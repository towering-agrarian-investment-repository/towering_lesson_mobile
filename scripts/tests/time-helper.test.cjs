const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, mocks = {}) {
    const filename = path.resolve(__dirname, "../../src/utils", file);
    const exports = {};
    vm.runInNewContext(
        ts.transpileModule(fs.readFileSync(filename, "utf8"), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
        }).outputText,
        { Date, exports, require: (id) => mocks[id] ?? require(id) },
        { filename },
    );
    return exports;
}

const { fmtTime, formatDateForAPI, getMonthKey } = load("time-helper.ts", {
    "@/i18n": { language: "en-GB" },
    "./timezone": load("timezone.ts"),
});

test("month keys and API dates roll over at Phnom Penh midnight", () => {
    const before = "2026-11-30T16:59:59Z";
    const after = "2026-11-30T17:00:00Z";
    assert.equal(getMonthKey(before), "2026-11");
    assert.equal(getMonthKey(Date.parse(after)), "2026-12");
    assert.equal(formatDateForAPI(new Date(before)), "2026-11-30");
    assert.equal(formatDateForAPI(after), "2026-12-01");
    assert.equal(formatDateForAPI("2026-12-01"), "2026-12-01");
    assert.equal(getMonthKey("invalid"), null);
    assert.equal(formatDateForAPI("invalid"), "");
});

test("clock-only times stay local to the schedule while timestamps convert to Phnom Penh", () => {
    const originalZone = process.env.TZ;
    try {
        for (const zone of ["UTC", "America/Los_Angeles", "Asia/Phnom_Penh"]) {
            process.env.TZ = zone;
            assert.equal(fmtTime("09:45"), "9:45", zone);
            assert.equal(fmtTime(" 09:45:30 "), "9:45", zone);
            assert.equal(fmtTime("9:45 PM"), "21:45", zone);
            assert.equal(fmtTime("12:05 AM"), "0:05", zone);
            assert.equal(fmtTime("2026-11-30T17:45:00Z"), "0:45", zone);
            assert.equal(fmtTime("25:99"), "—", zone);
        }
    } finally {
        if (originalZone === undefined) delete process.env.TZ;
        else process.env.TZ = originalZone;
    }
});
