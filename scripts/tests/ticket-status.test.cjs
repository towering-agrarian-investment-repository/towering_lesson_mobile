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
    vm.runInNewContext(outputText, { exports, require: (id) => mocks[id] ?? require(id) }, { filename });
    return exports;
}

const statuses = load("utils/status-tone.ts", { "./format-enum": load("utils/format-enum.ts") });
const { canBookWithTicket, canRescheduleBayReservation } = load("lib/booking/ticket-eligibility.ts", {
    "@/utils/status-tone": statuses,
    "@/design-system/utils/ticket-type": load("design-system/utils/ticket-type.ts"),
});

test("refunded tickets keep their status and use the expired ticket tone", () => {
    assert.equal(statuses.getEffectiveTicketStatus("refunded", true), "REFUNDED");
    assert.equal(statuses.getEffectiveTicketStatus("ACTIVE", true), "FULLY_USED");
    assert.equal(
        statuses.getTicketStatusLabel("REFUNDED", true, (key) => key),
        "tickets.statuses.refunded",
    );
    assert.deepEqual(statuses.getTicketStatusTone("REFUNDED", true), statuses.getTicketStatusTone("EXPIRED"));
});

test("only active statuses count as active and unknown statuses stay in All", () => {
    for (const status of ["ACTIVE", "IN_USE"]) {
        assert.equal(statuses.getTicketStatusGroup(status, false), "active", status);
        assert.equal(statuses.getTicketStatusGroup(status, true), "past", status);
    }
    for (const status of ["FULLY_USED", "EXPIRED", "CANCELLED", "CANCELED", "TRANSFERRED", "REFUNDED"]) {
        assert.equal(statuses.getTicketStatusGroup(status), "past", status);
    }
    assert.equal(statuses.getTicketStatusGroup("UNRECOGNIZED", true), "other");
    assert.equal(statuses.getTicketStatusGroup(null), "other");
});

test("new bookings require a supported type, active status, and remaining or unlimited uses", () => {
    const ticket = { type: "BAY_USAGE", status: "ACTIVE", fullyUsed: false, isUnlimited: false, remainingCount: 1 };
    assert.equal(canBookWithTicket(ticket), true);
    assert.equal(canBookWithTicket({ ...ticket, status: "IN_USE", isUnlimited: true, remainingCount: 0 }), true);
    assert.equal(canBookWithTicket({ ...ticket, remainingCount: 0 }), false);
    assert.equal(canBookWithTicket({ ...ticket, remainingCount: null }), false);
    assert.equal(canBookWithTicket({ ...ticket, fullyUsed: true }), false);
    assert.equal(canBookWithTicket({ ...ticket, type: "LESSON_PROGRAM" }), false);
    assert.equal(canBookWithTicket(), false);
    for (const status of ["FULLY_USED", "EXPIRED", "CANCELLED", "TRANSFERRED", "REFUNDED", "UNRECOGNIZED"]) {
        assert.equal(canBookWithTicket({ ...ticket, status, isUnlimited: true }), false, status);
    }
});

test("rescheduling uses the reservation’s eligibility even when the ticket has been used up", () => {
    const reservation = {
        reservationStatus: "RESERVED",
        isCancellable: true,
        ticket: { id: 4, status: "FULLY_USED", remainingCount: 0 },
    };
    assert.equal(canRescheduleBayReservation(reservation), true);
    assert.equal(canRescheduleBayReservation({ ...reservation, isCancellable: false }), false);
    assert.equal(canRescheduleBayReservation({ ...reservation, reservationStatus: "CANCELLED" }), false);
    assert.equal(canRescheduleBayReservation({ ...reservation, ticket: { id: 4, status: "REFUNDED" } }), false);
});
