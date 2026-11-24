const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const query = require("@tanstack/react-query");

function load(relativePath, mocks) {
    const filename = path.resolve(__dirname, "../..", relativePath);
    const exports = {};
    vm.runInNewContext(
        ts.transpileModule(fs.readFileSync(filename, "utf8"), {
            compilerOptions: { module: ts.ModuleKind.CommonJS },
        }).outputText,
        {
            exports,
            require(id) {
                if (id in mocks) return mocks[id];
                throw new Error(`Missing test dependency: ${id}`);
            },
        },
        { filename },
    );
    return exports;
}

function availability(request) {
    const service = load("src/service/member-bay-reservation.service.ts", {
        "@/lib/client/api-client": { apiClient: request },
    });
    const hooks = load("src/lib/hook/useReservation.ts", {
        "@/service/member-bay-reservation.service": service,
        "@/service/member-lesson-reservation.service": {},
        "@/service/reservation.service": {},
        "@tanstack/react-query": { ...query, useQuery: (options) => options },
        "../api-response/api-response": {},
    });
    return { service, hooks };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));
const startDate = "2026-11-01";
const endDate = "2026-11-30";

test("bay schedule requests include the owned ticket, date range, and cancellation signal", async () => {
    const calls = [];
    const { service } = availability(async (...args) => {
        calls.push(args);
        return { data: [] };
    });
    const signal = new AbortController().signal;
    await service.getMemberBaySlotGroups(123, startDate, endDate, signal);
    assert.equal(calls.length, 1);
    const [endpoint, options] = calls[0];
    const url = new URL(endpoint, "https://example.invalid");
    assert.equal(url.pathname, "/member/bay-slot-groups");
    assert.equal(url.searchParams.get("ticketId"), "123");
    assert.equal(url.searchParams.get("startDate"), startDate);
    assert.equal(url.searchParams.get("endDate"), endDate);
    assert.equal(options.method, "GET");
    assert.equal(options.signal, signal);
});

test("invalid ticket IDs disable discovery and never send an unfiltered request", async () => {
    let requests = 0;
    const { service, hooks } = availability(async () => {
        requests++;
        return { data: [] };
    });
    const client = new query.QueryClient();
    try {
        for (const ticketId of [undefined, null, 0, -1, 1.5, NaN, Infinity]) {
            const options = hooks.useMemberBaySlotGroups(ticketId, startDate, endDate);
            assert.equal(options.enabled, false);
            const observer = new query.QueryObserver(client, options);
            const unsubscribe = observer.subscribe(() => {});
            await flush();
            unsubscribe();
            await assert.rejects(service.getMemberBaySlotGroups(ticketId, startDate, endDate), /positive ticketId/);
        }
        assert.equal(requests, 0);
    } finally {
        client.clear();
    }
});

test("switching bay packages isolates cached availability, hides other packages, and refetches", async () => {
    const requests = [];
    let delayedTicket, finishRequest;
    const { hooks } = availability((endpoint) => {
        const ticketId = Number(new URL(endpoint, "https://example.invalid").searchParams.get("ticketId"));
        requests.push(ticketId);
        const response = { data: [{ id: ticketId, totalReservableBaySlots: ticketId }] };
        if (ticketId === delayedTicket) {
            return new Promise((resolve) => {
                finishRequest = () => resolve(response);
            });
        }
        return Promise.resolve(response);
    });
    const client = new query.QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } });
    const options = (ticketId) => hooks.useMemberBaySlotGroups(ticketId, startDate, endDate);
    const observer = new query.QueryObserver(client, options(123));
    const unsubscribe = observer.subscribe(() => {});
    try {
        await flush();
        assert.equal(observer.getCurrentResult().data.data[0].id, 123);

        delayedTicket = 456;
        observer.setOptions(options(456));
        assert.equal(observer.getCurrentResult().data, undefined, "Another package must not become placeholder data");
        await flush();
        finishRequest();
        await flush();
        assert.equal(observer.getCurrentResult().data.data[0].id, 456);
        assert.equal(client.getQueryData(options(123).queryKey).data[0].id, 123);
        assert.equal(client.getQueryData(options(456).queryKey).data[0].id, 456);

        delayedTicket = undefined;
        observer.setOptions(options(123));
        await flush();
        assert.equal(observer.getCurrentResult().data.data[0].id, 123);
        assert.deepEqual(requests, [123, 456], "Switching back within staleTime reuses isolated cached package data");

        delayedTicket = 123;
        observer.setOptions(hooks.useMemberBaySlotGroups(123, "2026-12-01", "2026-12-31"));
        assert.equal(
            observer.getCurrentResult().isPlaceholderData,
            true,
            "Date navigation may keep the same ticket visible",
        );
        assert.equal(observer.getCurrentResult().data.data[0].id, 123);
        await flush();
        finishRequest();
        await flush();
    } finally {
        unsubscribe();
        client.clear();
    }
});

test("package and day prefetch send the selected ticket and refresh seeded availability", async () => {
    const requestedTickets = [];
    const { hooks } = availability(async (endpoint) => {
        const ticketId = Number(new URL(endpoint, "https://example.invalid").searchParams.get("ticketId"));
        requestedTickets.push(ticketId);
        return { data: [{ id: ticketId }] };
    });
    const { prefetchTicketAvailability } = load("src/lib/booking/prefetchTicketAvailability.ts", {
        "@/lib/hook/useReservation": hooks,
        "@/utils/time-helper": { formatDateForAPI: (date) => date.toISOString().slice(0, 10) },
        "@/utils/timezone": { toAppTimeZoneDate: (date) => date },
        "date-fns": require("date-fns"),
    });
    const client = new query.QueryClient();
    try {
        for (const ticketId of [123, 456, 0]) {
            prefetchTicketAvailability(client, { id: ticketId, type: "BAY_USAGE" });
            await flush();
        }
        assert.deepEqual(requestedTickets, [123, 456]);
        assert.equal(client.getQueryCache().getAll().length, 2);

        const dayOptions = hooks.getMemberBaySlotGroupsQueryOptions(123, "2026-11-22", "2026-11-22");
        client.setQueryData(dayOptions.queryKey, { data: [{ id: "calendar-preview" }] }, { updatedAt: 0 });
        await client.prefetchQuery(dayOptions);
        assert.equal(client.getQueryData(dayOptions.queryKey).data[0].id, 123);
        assert.deepEqual(requestedTickets, [123, 456, 123]);
    } finally {
        client.clear();
    }
});
