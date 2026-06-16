import type { LessonReservationStatus } from "./member-lesson";
import type { TicketType } from "./member.type";

type MemberReservationResponseBase = {
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
    memberNotes: string | null;
    adminNotes: string | null;
};

export type MemberLessonReservationListResponse =
    MemberReservationResponseBase & {
        reservationType: "lesson";
        reservationStatus: LessonReservationStatus;
    };

export type MemberBayReservationListResponse = MemberReservationResponseBase & {
    reservationType: "bay";
    reservationStatus: string;
};

export type MemberReservationResponse =
    | MemberLessonReservationListResponse
    | MemberBayReservationListResponse;

export type MemberReservationDomain = "lesson" | "bay";

type MemberReservationSummaryBase = Pick<
    MemberReservationResponseBase,
    | "id"
    | "reservationNumber"
    | "ticketType"
    | "lessonProgramName"
    | "lessonProgramGroupName"
    | "lessonAvailabilityName"
    | "bayName"
    | "startTime"
    | "endTime"
    | "reservationDate"
    | "memberNotes"
    | "adminNotes"
>;

export type MemberLessonReservationSummaryResponse =
    MemberReservationSummaryBase & {
        reservationType: "lesson";
        reservationStatus: LessonReservationStatus;
    };

export type MemberBayReservationSummaryResponse =
    MemberReservationSummaryBase & {
        reservationType: "bay";
        reservationStatus: string;
    };

export type MemberReservationSummaryResponse =
    | MemberLessonReservationSummaryResponse
    | MemberBayReservationSummaryResponse;

export type MemberReservationCalendarResponse = {
    reservationDate: string;
    reservations: MemberReservationSummaryResponse[];
};
