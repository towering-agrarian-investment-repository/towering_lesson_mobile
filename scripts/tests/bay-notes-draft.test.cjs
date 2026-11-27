const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, mocks = {}) {
    const filename = path.resolve(__dirname, "../..", file);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    const exports = {};
    vm.runInNewContext(
        code,
        {
            exports,
            require: (id) => mocks[id] ?? require(id),
            AbortController,
            setTimeout,
            clearTimeout,
        },
        { filename },
    );
    return exports;
}

test("bay notes retain the ten most recently updated non-empty drafts", () => {
    const { getBayNotesDraft, setBayNotesDraft } = load("src/lib/booking/bay-notes-draft.ts");
    for (let id = 1; id <= 10; id++) setBayNotesDraft(id, String(id));
    setBayNotesDraft(1, "updated");
    setBayNotesDraft(11, "new");

    assert.equal(getBayNotesDraft(1), "updated");
    assert.equal(getBayNotesDraft(2), undefined);
    assert.equal(getBayNotesDraft(11), "new");
    setBayNotesDraft(1, "");
    assert.equal(getBayNotesDraft(1), undefined);
});

test("successful sign-out clears bay drafts and failed sign-out preserves them", async () => {
    const drafts = load("src/lib/booking/bay-notes-draft.ts");
    const error = new Error("offline");
    let result = { error };
    const { signOut } = load("src/service/auth.ts", {
        "@/lib/auth-client": { authClient: { signOut: async () => result } },
        "@/lib/auth-session": { clearInterruptedHref() {} },
        "@/lib/booking/bay-notes-draft": drafts,
        "@/lib/client/jwt-token": { clearCachedJwtToken() {} },
        "@/lib/config/notification/pushRegistrationStorage": {
            beginPushRegistrationSignOut: () => () => {},
            deactivateCurrentPushInstallation: async () => {},
        },
    });

    drafts.setBayNotesDraft(1, "first");
    drafts.setBayNotesDraft(2, "second");
    await assert.rejects(signOut, error);
    assert.equal(drafts.getBayNotesDraft(1), "first");

    result = { data: {} };
    await signOut();
    assert.equal(drafts.getBayNotesDraft(1), undefined);
    assert.equal(drafts.getBayNotesDraft(2), undefined);
});
