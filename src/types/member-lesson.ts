import { MemberReservationDomain } from "./member-reservation";
import { TicketStatus, TicketType } from "./member.type";


export type LessonReservationStatus =
    | "RESERVED"
    | "CHECKED_IN"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW";

export type LessonType = "PRIVATE_LESSON" | "GROUP_LESSON";

export type LessonSlotStatus = "AVAILABLE" | "BLOCKED" | "CANCELLED";

export type MemberLessonReservationResponse = {
    reservationType: string;
    id: number;
    reservationNumber: string;
    lessonId: number | null;
    lessonName: string | null;
    lessonProgramGroupId: number | null;
    lessonProgramEnrollmentId: number | null;
    lessonProgramName: string | null;
    lessonProgramGroupName: string | null;
    coach: {
        id: number;
        name: string;
        profileImage: string | null;
    } | null;
    ticket: {
        id: number;
        name: string;
        type: TicketType | null;
        status: TicketStatus | null;
    } | null;
    lessonAvailability: {
        id: number;
        name: string;
        startTime: string;
        endTime: string;
        capacity: number | null;
        bookedCount: number | null;
        lessonType: LessonType | null;
        slotStatus: LessonSlotStatus | null;
    } | null;
    lessonLog: {
        id: number;
        name: string | null;
    } | null;
    bookedAt: string | null;
    startTime: string | null;
    endTime: string | null;
    reservationDate: string | null;
    durationMinutes: number | null;
    reservationStatus: LessonReservationStatus | null;
    checkedInAt: string | null;
    cancelledAt: string | null;
    notes: string | null;
};

export type LessonAvailabilityReservationResponse = {
    id: number;
    memberId?: number | null;
    reservationStatus?: LessonReservationStatus | null;
};


export type LessonAvailabilityResponse = {
    id: number;
    lessonId?: number | null;
    lessonProgramGroupId?: number | null;
    lessonProgramName?: string | null;
    title?: string | null;
    name?: string | null;
    coachName?: string | null;
    lessonType: LessonType;
    startTime: string;
    endTime: string;
    capacity: number;
    bookedCount: number;
    reservations?: LessonAvailabilityReservationResponse[];
    lessonProgram?: {
        name?: string | null;
    } | null;
};

export type MemberCreateLessonReservationRequest = {
    ticketId: number;
    lessonAvailabilityId: number;
    baySlotId?: number | null;
    notes?: string | null;
};
