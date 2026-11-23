import type { MemberReservationDomain } from "./member-reservation";

type MemberBayReservationTicket = {
    id: number;
    name: string;
    type: string;
    status: string;
    isUnlimited: boolean;
    totalCount: number | null;
    usedCount: number;
    remainingCount: number | null;
};

type MemberBayReservationParticipant = {
    id: number;
    bayReservationId: number;
    memberId: number;
    memberName: string;
    phoneNumber: string;
    image: string;
    email: string;
    notes: string | null;
};

type AttendanceStatus = "PENDING" | "PRESENT" | "ABSENT";

type AttendanceReservationDomain = "LESSON" | "BAY";

type MemberReservationAttendance = {
    id: number;
    reservationId: number;
    reservationDomain: AttendanceReservationDomain;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    attendanceStatus: AttendanceStatus;
    notes: string | null;
};

export type MemberBayReservationResponse = {
    reservationType: Extract<MemberReservationDomain, "bay">;
    id: number;
    reservationNumber: string;
    ticket: MemberBayReservationTicket;
    bayName: string | null;
    bookedAt: string | null;
    startTime: string;
    endTime: string;
    reservationDate: string;
    durationMinutes: number;
    numberOfPlayers: number;
    reservationStatus: string;
    cancelledAt: string | null;
    memberNotes: string | null;
    adminNotes: string | null;
    participants: MemberBayReservationParticipant[];
    attendance: MemberReservationAttendance | null;
    isCancellable: boolean;
};

type BaySlotScheduleResponse = {
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
    totalReservableBaySlots: number;
    totalDisplayCapacity: number;
    totalReservations: number;
    baySlots: BaySlotScheduleResponse[];
};

export type CreateBayReservationRequest = {
    baySlotGroupId: number;
    ticketId: number;
    memberNotes?: string | null;
};

export type RescheduleBayReservationRequest = {
    baySlotGroupId: number;
};
