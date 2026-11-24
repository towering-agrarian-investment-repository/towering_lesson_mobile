const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function load(relativePath, mocks, globals = {}) {
    const filename = path.resolve(__dirname, "../..", relativePath);
    const exports = {};
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
    });
    vm.runInNewContext(
        outputText,
        {
            exports,
            require(id) {
                if (id in mocks) return mocks[id];
                throw new Error(`Missing test dependency: ${id}`);
            },
            AbortController,
            Headers,
            setTimeout,
            clearTimeout,
            ...globals,
        },
        { filename },
    );
    return exports;
}

function deferred() {
    let resolve;
    const promise = new Promise((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));
const success = () => Response.json({ ok: true });
const unauthorized = (bearerChallenge = false) =>
    Response.json(
        { errorCode: "UNAUTHORIZED" },
        {
            status: 401,
            headers: bearerChallenge ? { "WWW-Authenticate": "Bearer" } : {},
        },
    );
const isUnauthorized = (error) => error.errorCode === "UNAUTHORIZED";

class UserFacingError extends Error {}

function mockClient(respond, isOnline = () => true) {
    let checks = 0;
    const mints = [];
    const calls = [];
    const tokens = load("src/lib/client/jwt-token.ts", {
        jose: { decodeJwt: () => ({ exp: Date.now() / 1000 + 600 }) },
        "../auth-client": {
            authClient: {
                token: () => {
                    const mint = deferred();
                    mints.push(mint);
                    return mint.promise;
                },
            },
        },
    });
    const { apiClient } = load(
        "src/lib/client/api-client.ts",
        {
            "@tanstack/react-query": { onlineManager: { isOnline } },
            "../auth-session": {
                verifyMemberSession: async () => {
                    checks++;
                    return true;
                },
            },
            "../config/env": { env: { apiBaseUrl: "https://example.invalid" } },
            "../../i18n": { __esModule: true, default: { language: "en", t: (key) => key } },
            "../api-response/api-response": { isApiErrorResponse: () => true, UserFacingError },
            "../update/app-update": {},
            "./app-request-headers": { getAppRequestHeaders: () => ({}) },
            "./jwt-token": tokens,
        },
        {
            fetch: (url, options) => {
                const endpoint = new URL(url).pathname;
                const authorization = options.headers.get("Authorization");
                calls.push([endpoint, authorization]);
                return respond(endpoint, authorization);
            },
        },
    );
    return {
        apiClient,
        clearCachedJwtToken: tokens.clearCachedJwtToken,
        calls,
        get mintCount() {
            return mints.length;
        },
        get sessionChecks() {
            return checks;
        },
        issue(index, token) {
            mints[index].resolve({ data: { token } });
        },
    };
}

test("offline writes reject before authentication or fetch and can be retried on reconnect", async () => {
    let online = false;
    const client = mockClient(
        async () => success(),
        () => online,
    );
    for (const method of ["post", "PUT", "PATCH", "DELETE"]) {
        await assert.rejects(client.apiClient("/write", { method }), {
            constructor: UserFacingError,
            message: "common.offlineMessage",
        });
    }
    assert.equal(client.mintCount, 0);
    assert.equal(client.sessionChecks, 0);
    assert.equal(client.calls.length, 0);

    const read = client.apiClient("/read");
    client.issue(0, "valid-token");
    await read;
    online = true;
    await client.apiClient("/write", { method: "POST" });
    assert.deepEqual(client.calls, [
        ["/read", "Bearer valid-token"],
        ["/write", "Bearer valid-token"],
    ]);
});

test("staggered 401s share recovery and a late 401 reuses the newer cached token", async () => {
    const old = { "/a": deferred(), "/b": deferred(), "/late": deferred() };
    const client = mockClient((endpoint, header) =>
        header === "Bearer old" ? old[endpoint].promise : Promise.resolve(success()),
    );
    const a = client.apiClient("/a");
    const b = client.apiClient("/b");
    const late = client.apiClient("/late");
    client.issue(0, "old");
    await flush();

    old["/a"].resolve(unauthorized());
    await flush();
    assert.equal(client.mintCount, 2);
    old["/b"].resolve(unauthorized());
    const during = client.apiClient("/during");
    await flush();
    assert.equal(client.mintCount, 2);
    assert.equal(client.sessionChecks, 0);
    client.issue(1, "fresh");
    await Promise.all([a, b, during]);

    old["/late"].resolve(unauthorized());
    await late;
    assert.equal(client.mintCount, 2);
    assert.equal(client.sessionChecks, 0);
    for (const endpoint of ["/a", "/b", "/late"]) {
        assert.deepEqual(
            client.calls.filter(([route]) => route === endpoint).map(([, token]) => token),
            ["Bearer old", "Bearer fresh"],
        );
    }
    assert.deepEqual(
        client.calls.filter(([route]) => route === "/during"),
        [["/during", "Bearer fresh"]],
    );
});

test("clearing auth during recovery prevents an old request from replaying in the next session", async () => {
    const old = { "/recovering": deferred(), "/late": deferred() };
    const client = mockClient((endpoint, header) =>
        header === "Bearer old" ? old[endpoint].promise : Promise.resolve(success()),
    );
    const recovering = assert.rejects(client.apiClient("/recovering"), isUnauthorized);
    const late = assert.rejects(client.apiClient("/late"), isUnauthorized);
    client.issue(0, "old");
    await flush();
    old["/recovering"].resolve(unauthorized());
    await flush();
    assert.equal(client.mintCount, 2);

    client.clearCachedJwtToken();
    const nextSession = client.apiClient("/next-session");
    client.issue(2, "next-session");
    await nextSession;
    client.issue(1, "discarded-refresh");
    old["/late"].resolve(unauthorized());
    await Promise.all([recovering, late]);
    await client.apiClient("/after");

    assert.equal(client.sessionChecks, 0);
    assert.equal(client.mintCount, 3);
    assert.deepEqual(client.calls, [
        ["/recovering", "Bearer old"],
        ["/late", "Bearer old"],
        ["/next-session", "Bearer next-session"],
        ["/after", "Bearer next-session"],
    ]);
});

test("write requests require a Bearer challenge for one replay", async () => {
    const client = mockClient((endpoint) =>
        Promise.resolve(endpoint === "/after" ? success() : unauthorized(endpoint === "/bearer-rejection")),
    );
    const rejected = assert.rejects(client.apiClient("/application-rejection", { method: "POST" }), isUnauthorized);
    client.issue(0, "old");
    await rejected;
    assert.equal(client.sessionChecks, 0);

    const replayed = assert.rejects(client.apiClient("/bearer-rejection", { method: "POST" }), isUnauthorized);
    await flush();
    client.issue(1, "rejected-refresh");
    await replayed;
    assert.equal(client.sessionChecks, 0);
    assert.equal(client.mintCount, 2);

    const after = client.apiClient("/after");
    client.issue(2, "new-token");
    await after;
    assert.deepEqual(client.calls, [
        ["/application-rejection", "Bearer old"],
        ["/bearer-rejection", "Bearer old"],
        ["/bearer-rejection", "Bearer rejected-refresh"],
        ["/after", "Bearer new-token"],
    ]);
});
