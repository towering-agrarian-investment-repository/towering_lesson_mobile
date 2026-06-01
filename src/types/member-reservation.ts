import { TicketType } from "./member.type";

export type MemberReservationResponse = {
    id: number;
    reservationNumber: string;
    reservationType: MemberReservationDomain;
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
    notes: string | null;
};

export type MemberReservationDomain = "lesson" | "bay";

export type MemberReservationSummaryResponse = Pick<
    MemberReservationResponse,
    | "id"
    | "reservationNumber"
    | "reservationType"
    | "ticketType"
    | "lessonProgramName"
    | "lessonProgramGroupName"
    | "lessonAvailabilityName"
    | "bayName"
    | "startTime"
    | "endTime"
    | "reservationDate"
    | "reservationStatus"
>;

export type MemberReservationCalendarResponse = {
    reservationDate: string;
    reservations: MemberReservationSummaryResponse[];
};
