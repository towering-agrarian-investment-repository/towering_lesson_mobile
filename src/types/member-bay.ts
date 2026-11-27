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

type MemberBayReservationSlot = {
    id: number;
    bayId: number | null;
};

type MemberBayReservationParticipant = {
    id: number;
    bayReservationId: number;
    memberId: number;
    memberName: string;
    image: string;
};

export type MemberBayReservationResponse = {
    reservationType: Extract<MemberReservationDomain, "bay">;
    id: number;
    reservationNumber: string;
    ticket: MemberBayReservationTicket;
    baySlot: MemberBayReservationSlot | null;
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
    participants: MemberBayReservationParticipant[];
    isCancellable: boolean;
    canEditMemberNotes: boolean;
};

export type MemberBaySlotGroupResponse = {
    id: number;
    name: string;
    startDateTime: string;
    endDateTime: string;
    totalReservableBaySlots: number;
};

export type CreateBayReservationRequest = {
    baySlotGroupId: number;
    ticketId: number;
    memberNotes?: string | null;
};

export type RescheduleBayReservationRequest = {
    baySlotGroupId: number;
};

export type UpdateBayReservationNotesRequest = {
    memberNotes: string | null;
};
