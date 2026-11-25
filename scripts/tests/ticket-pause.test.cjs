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
            compilerOptions: { module: ts.ModuleKind.CommonJS },
        }).outputText,
        { Date, exports, require: (id) => mocks[id] ?? require(id) },
        { filename },
    );
    return exports;
}

const timeHelper = load("time-helper.ts", {
    "@/i18n": { default: { language: "en" } },
    "./timezone": load("timezone.ts"),
});
const { getTicketPausePeriods, isTicketDatePaused } = load("ticket-pause.ts", { "./time-helper": timeHelper });

function pause(id, pausedStartDate, pausedEndDate, overrides = {}) {
    return { id, ticketId: 1088, pausedStartDate, pausedEndDate, cancelledAt: null, notes: null, ...overrides };
}

test("pause start and end dates are blocked and adjacent dates remain selectable", () => {
    const periods = getTicketPausePeriods([pause(1, "2026-11-26", "2026-11-28")]);
    for (const date of ["2026-11-26", "2026-11-27", "2026-11-28"]) {
        assert.equal(isTicketDatePaused(periods, date), true, date);
    }
    for (const date of ["2026-11-25", "2026-11-29"]) {
        assert.equal(isTicketDatePaused(periods, date), false, date);
    }
});

test("a single-day pause uses the Phnom Penh date and separate periods leave the gap bookable", () => {
    const periods = getTicketPausePeriods([
        pause(2, "2026-12-05", "2026-12-06"),
        pause(1, "2026-11-30T17:00:00Z", "2026-12-01T16:59:59Z"),
    ]);
    assert.equal(periods[0].id, 1);
    assert.equal(periods[0].startDate, "2026-12-01");
    assert.equal(periods[0].endDate, "2026-12-01");
    assert.equal(isTicketDatePaused(periods, "2026-12-01"), true);
    assert.equal(isTicketDatePaused(periods, "2026-12-03"), false);
    assert.equal(isTicketDatePaused(periods, "2026-12-05"), true);
});

test("missing, cancelled, invalid, and reversed pause periods leave dates selectable", () => {
    assert.equal(getTicketPausePeriods().length, 0);
    const periods = getTicketPausePeriods([
        pause(1, "2026-11-26", "2026-11-28", { cancelledAt: "2026-11-25T10:00:00Z" }),
        pause(2, "invalid", "2026-11-28"),
        pause(3, "2026-11-28", "2026-11-26"),
    ]);
    assert.equal(periods.length, 0);
    assert.equal(isTicketDatePaused(periods, "2026-11-27"), false);
});
