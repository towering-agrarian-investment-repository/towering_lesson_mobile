import type { MemberReservationDomain } from "./member-reservation";

export type MemberBayReservationResponse = {
    id: number;
    reservationNumber: string;
    reservationType: MemberReservationDomain;
    baySlotId: number;
    bayName: string | null;
    bookedAt: string | null;
    startTime: string;
    endTime: string;
    reservationDate: string;
    durationMinutes: number;
    numberOfPlayers: number | null;
    reservationStatus: string;
    checkedInAt: string | null;
    cancelledAt: string | null;
    notes: string | null;
    participants: unknown[];
    attendance: unknown | null;
};

export type BayScheduleResponse = {
    bayId: number;
    bayName: string;
};

export type BaySlotScheduleResponse = {
    id: number;
    ruleId: number | null;
    ruleName: string | null;
    bayId: number;
    bayNumber: number;
    bayName: string;
    slotStatus: string;
    notes: string | null;
    reservations: MemberBayReservationResponse[];
};

export type BaySlotGroupScheduleResponse = {
    id: number;
    name: string;
    branchId: number;
    isActive: boolean;
    memo: string | null;
    startDateTime: string;
    endDateTime: string;
    totalBaySlots: number;
    totalReservations: number;
    baySlots: BaySlotScheduleResponse[];
};

export type MemberBayReservationRequest = {
    baySlotId: number;
    ticketId: number;
    notes?: string | null;
};
