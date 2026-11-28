const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function load(relativePath, mocks = {}) {
    const filename = path.resolve(__dirname, "../../src", relativePath);
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
    });
    const exports = {};
    vm.runInNewContext(
        outputText,
        { exports, URLSearchParams, require: (id) => mocks[id] ?? require(id) },
        { filename },
    );
    return exports;
}

const statuses = load("utils/status-tone.ts", { "./format-enum": load("utils/format-enum.ts") });

test("refunded tickets keep their status and use the expired ticket tone", () => {
    assert.equal(
        statuses.getTicketStatusLabel("REFUNDED", (key) => key),
        "tickets.statuses.refunded",
    );
    assert.deepEqual(statuses.getTicketStatusTone("REFUNDED"), statuses.getTicketStatusTone("EXPIRED"));
});

test("only active statuses count as active and unknown statuses stay in All", () => {
    for (const status of ["ACTIVE", "IN_USE"]) {
        assert.equal(statuses.getTicketStatusGroup(status), "active", status);
    }
    for (const status of ["FULLY_USED", "EXPIRED", "CANCELLED", "TRANSFERRED", "REFUNDED"]) {
        assert.equal(statuses.getTicketStatusGroup(status), "past", status);
    }
    assert.equal(statuses.getTicketStatusGroup("UNRECOGNIZED"), "other");
    assert.equal(statuses.getTicketStatusGroup(null), "other");
});

test("member ticket history sends the server filter and preserves cursor and types", async () => {
    const requests = [];
    const { getMemberTickets } = load("service/ticket-service.ts", {
        "@/lib/client/api-client": { apiClient: (url) => requests.push(new URL(url, "https://example.invalid")) },
    });

    await getMemberTickets({ history: "past", types: ["BAY_USAGE", "GROUP_LESSON"], cursor: "cursor+1", limit: 10 });
    await getMemberTickets({ history: "active" });
    await getMemberTickets();

    assert.equal(requests[0].pathname, "/member/tickets");
    assert.equal(requests[0].searchParams.get("history"), "past");
    assert.deepEqual(requests[0].searchParams.getAll("types"), ["BAY_USAGE", "GROUP_LESSON"]);
    assert.equal(requests[0].searchParams.get("cursor"), "cursor+1");
    assert.equal(requests[0].searchParams.get("limit"), "10");
    assert.equal(requests[1].searchParams.get("history"), "active");
    assert.equal(requests[2].searchParams.has("history"), false);
    assert.ok(requests.every((request) => !request.searchParams.has("statuses")));
});
