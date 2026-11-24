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

type MemberLessonReservationListResponse = MemberReservationResponseBase & {
    reservationType: "lesson";
    reservationStatus: LessonReservationStatus;
};

type MemberBayReservationListResponse = MemberReservationResponseBase & {
    reservationType: "bay";
    reservationStatus: string;
};

export type MemberReservationResponse = MemberLessonReservationListResponse | MemberBayReservationListResponse;

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

type MemberLessonReservationSummaryResponse = MemberReservationSummaryBase & {
    reservationType: "lesson";
    reservationStatus: LessonReservationStatus;
};

type MemberBayReservationSummaryResponse = MemberReservationSummaryBase & {
    reservationType: "bay";
    reservationStatus: string;
};

export type MemberReservationSummaryResponse =
    MemberLessonReservationSummaryResponse | MemberBayReservationSummaryResponse;
