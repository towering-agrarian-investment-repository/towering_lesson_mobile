import type { TicketType } from "./member.type";

export type MemberReservationDomain = "lesson" | "bay";

export type MemberReservationSummaryResponse = {
    reservationType: MemberReservationDomain;
    id: number;
    reservationNumber: string;
    ticketId: number;
    ticketType: TicketType;
    lessonProgramEnrollmentId: number | null;
    lessonProgramName: string | null;
    lessonProgramGroupName: string | null;
    lessonAvailabilityId: number | null;
    lessonAvailabilityName: string | null;
    baySlotId: number | null;
    bayName: string | null;
    bookedAt: string;
    startTime: string;
    endTime: string;
    reservationDate: string;
    durationMinutes: number;
    reservationStatus: string;
    memberNotes: string | null;
};
