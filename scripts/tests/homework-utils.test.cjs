const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, mocks = {}) {
    const filename = path.resolve(__dirname, "../../src", file);
    const exports = {};
    vm.runInNewContext(
        ts.transpileModule(fs.readFileSync(filename, "utf8"), {
            compilerOptions: { module: ts.ModuleKind.CommonJS },
        }).outputText,
        { exports, require: (id) => mocks[id] ?? require(id) },
        { filename },
    );
    return exports;
}

const maxSize = 100 * 1024 * 1024;
const files = new Map([
    ["file:///normal", { exists: true, name: "photo.jpg", size: 2048 }],
    ["file:///missing", { exists: false, size: 0 }],
    ["file:///empty", { exists: true, size: 0 }],
    ["file:///at-limit", { exists: true, size: maxSize }],
    ["file:///too-large", { exists: true, size: maxSize + 1 }],
]);
const {
    createFileFromDocument,
    createFileFromPickerAsset,
    createHomeworkDraft,
    getHomeworkDisplayState,
    homeworkDraftKey,
    HomeworkFileValidationError,
} = load("components/golf/homework/homework-utils.ts", {
    "@/utils/media": load("utils/media.ts"),
    "expo-file-system": {
        File: class {
            constructor(uri) {
                Object.assign(this, files.get(uri));
            }
        },
    },
});

test("homework display handles all six states, review precedence and the due-soon boundary", () => {
    const now = Date.parse("2026-11-25T00:00:00Z");
    const state = (homework, currentSubmission = null) => getHomeworkDisplayState(homework, currentSubmission, now);
    assert.equal(state({ dueAt: "2026-11-27T00:00:00.001Z" }), "assigned");
    assert.equal(state({ dueAt: "invalid" }), "assigned");
    assert.equal(state({ dueAt: "2026-11-27T00:00:00Z" }), "dueSoon");
    assert.equal(state({ dueAt: "2026-11-25T00:00:00Z" }), "dueSoon");
    assert.equal(state({ dueAt: "2026-11-24T23:59:59.999Z" }), "overdue");
    assert.equal(state({ dueAt: "2026-11-24" }, { status: "SUBMITTED", review: null }), "awaitingReview");
    assert.equal(state({}, { review: { status: "RETURNED" } }), "needsRevision");
    assert.equal(state({}, { review: { status: "CONFIRMED" } }), "approved");
    assert.equal(state({ homeworkStatus: "COMPLETED" }), "approved");
});

test("attachment validation accepts supported extensions and MIME types from both sources", () => {
    const t = (key) => key;
    const uri = "file:///normal";
    assert.equal(
        createFileFromDocument({ uri, name: "Swing.MP4", mimeType: "application/octet-stream" }, t).type,
        "video/mp4",
    );
    assert.equal(createFileFromDocument({ uri, name: "attachment", mimeType: "IMAGE/PNG" }, t).type, "image/png");
    assert.equal(createFileFromPickerAsset({ uri, fileName: "Swing.WEBP" }, t).type, "image/webp");
    assert.equal(createFileFromPickerAsset({ uri, mimeType: "IMAGE/JPEG", fileSize: 1024 }, t).size, 1024);
    for (const from of [createFileFromDocument, createFileFromPickerAsset]) {
        assert.throws(() => from({ uri, name: "out.pdf", fileName: "out.pdf", mimeType: "application/pdf" }, t), {
            constructor: HomeworkFileValidationError,
            message: "homework.supportedFilesOnly",
        });
    }
});

test("attachment validation requires a readable non-empty file and respects the 100 MiB limit", () => {
    const t = (key) => key;
    for (const from of [createFileFromDocument, createFileFromPickerAsset]) {
        const pick = (uri, fileSize) => from({ uri, name: "swing.mp4", fileName: "swing.mp4", fileSize }, t);
        assert.throws(() => pick("file:///missing", 100), { message: "homework.emptyFile" });
        assert.throws(() => pick("file:///empty"), { message: "homework.emptyFile" });
        assert.throws(() => pick("file:///too-large"), { message: "homework.fileTooLarge" });
        assert.equal(pick("file:///at-limit").size, maxSize);
    }
});

test("nonempty drafts preserve memo whitespace and file metadata under the existing storage key", () => {
    assert.equal(homeworkDraftKey(7), "homework:7");
    assert.equal(createHomeworkDraft("  ", null), null);
    assert.equal(createHomeworkDraft("  keep this ", null).memo, "  keep this ");
    const file = { uri: "file:///normal", name: "photo.jpg", type: "image/jpeg", size: 2048 };
    assert.equal(createHomeworkDraft(undefined, file).file, file);
});
