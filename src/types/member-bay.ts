import type { MemberReservationDomain } from "./member-reservation";

export type MemberBayReservationTicket = {
    id: number;
    name: string;
    type: string;
    status: string;
};

export type MemberBayReservationBaySlot = {
    id: number;
    bayId: number;
    ruleId: number;
    ruleName: string;
    slotStatus: string;
    notes: string | null;
};

export type MemberBayReservationParticipant = {
    id: number;
    bayReservationId: number;
    memberId: number;
    memberName: string;
    phoneNumber: string;
    image: string;
    email: string;
    notes: string | null;
};

export type MemberBayReservationAttendance = {
    id: number;
    reservationId: number;
    reservationDomain: string;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    attendanceStatus: string;
    notes: string | null;
};

export type MemberBayReservationResponse = {
    reservationType: Extract<MemberReservationDomain, "bay">;
    id: number;
    reservationNumber: string;
    ticket: MemberBayReservationTicket;
    baySlot: MemberBayReservationBaySlot;
    bayName: string;
    bookedAt: string | null;
    startTime: string;
    endTime: string;
    reservationDate: string;
    durationMinutes: number;
    numberOfPlayers: number;
    reservationStatus: string;
    checkedInAt: string | null;
    cancelledAt: string | null;
    memberNotes: string | null;
    adminNotes: string | null;
    participants: MemberBayReservationParticipant[];
    attendance: MemberBayReservationAttendance;
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

export type CreateBayReservationRequest = {
    baySlotId: number;
    ticketId: number;
    // Request-side `notes` maps to `memberNotes` in the backend.
    notes?: string | null;
};

export type RescheduleBayReservationRequest = {
    baySlotId: number;
    // Request-side `notes` maps to `memberNotes` in the backend.
    notes?: string | null;
};
