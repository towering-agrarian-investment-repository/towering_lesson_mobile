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
    reservationType: Extract<MemberReservationDomain, "lesson">;
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
        profileImage: string;
    } | null;
    ticket: {
        id: number;
        name: string;
        type: TicketType;
        status: TicketStatus;
    } | null;
    lessonAvailability: {
        id: number;
        name: string;
        startTime: string;
        endTime: string;
        capacity: number | null;
        bookedCount: number | null;
        lessonType: LessonType;
        slotStatus: LessonSlotStatus;
    } | null;
    lessonLog: {
        id: number;
        name: string;
    } | null;
    bookedAt: string | null;
    startTime: string | null;
    endTime: string | null;
    reservationDate: string | null;
    durationMinutes: number | null;
    reservationStatus: LessonReservationStatus | null;
    checkedInAt: string | null;
    cancelledAt: string | null;
    memberNotes: string | null;
};

export type LessonAvailabilityReservationResponse = {
    id: number;
    memberId?: number | null;
    reservationStatus?: LessonReservationStatus | null;
};


export type MemberLessonSlotResponse = {
    id: number;
    branchId?: number | null;
    instructorId?: number | null;
    name?: string | null;
    coachName?: string | null;
    lessonType: LessonType;
    startTime: string;
    endTime: string;
    coachBlockedUntil?: string | null;
    capacity: number;
    bookedCount: number;
    bookable?: boolean;
    remainingSessionsFromSelectedStart?: number | null;
    slotStatus?: LessonSlotStatus | null;
    notes?: string | null;
    lessonInstances?: unknown[];
    reservations?: LessonAvailabilityReservationResponse[];
};

export type CreateLessonReservationRequest = {
    ticketId: number;
    lessonAvailabilityId: number;
    baySlotId?: number | null;
    // Request-side `notes` maps to `memberNotes` in the backend.
    notes?: string | null;
};

export type RescheduleLessonReservationRequest = {
    lessonAvailabilityId: number;
    // Request-side `notes` maps to `memberNotes` in the backend.
    notes?: string | null;
};
