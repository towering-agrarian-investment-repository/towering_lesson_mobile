import type { MemberGroupSummaryResponse } from "./member-group";
import type {
    MemberHomeworkSubmissionResponse,
    MemberHomeworkSummaryResponse,
} from "./member-homework";
import type { MemberLessonLogResponse as MemberLessonLogSummaryResponse } from "./member-lesson-log";
import type { MemberReservationDomain } from "./member-reservation";
import type { SessionInstanceResponse } from "./member-session";

export type TicketStatus = "ACTIVE" | "EXPIRED" | "IN_USE" | "FULLY_USED" | "CANCELLED";

export type TicketType =
    | "BAY_USAGE"
    | "PRIVATE_LESSON"
    | "GROUP_LESSON"
    | "LESSON_PROGRAM"
    | "LOCKER_SERVICE"
    | "LOCATION"
    | "OTHER";

export type LessonType = "PRIVATE_LESSON" | "GROUP_LESSON";

export type LessonSlotStatus = "AVAILABLE" | "BLOCKED" | "CANCELLED";

export type LessonReservationStatus =
    | "RESERVED"
    | "CHECKED_IN"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW";

export type MemberLessonLogStatus = "DRAFT" | "FINAL" | "SENT";

export type MemberLessonLogResponse = {
    id: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    lessonInstanceId: number;
    lessonReservationId: number | null;
    memberId: number;
    coachId: number;
    lessonDate: string;
    memberName: string;
    phoneNumber: string | null;
    school: string | null;
    body: string;
    comment: string | null;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    ratings: number | null;
    isReviewed: boolean;
    isConfirmed: boolean;
    confirmedDate: string | null;
    status: MemberLessonLogStatus;
};

export type MemberTodayLessonResponse = {
    lessonId: number;
    lessonAvailabilityId: number | null;
    lessonProgramGroupId: number | null;
    lessonProgramName: string | null;
    groupName: string | null;
    title: string;
    orderIndex: number;
    lessonStatus: string;
    startTime: string | null;
    endTime: string | null;
    reservationStatus: LessonReservationStatus | null;
};

export type MemberLessonSummaryResponse = {
    lessonId: number;
    lessonAvailabilityId: number | null;
    lessonProgramGroupId: number | null;
    title: string;
    description: string | null;
    objectives: string[];
    homeworkSnapshot: string | null;
    orderIndex: number;
    lessonStatus: string;
    startTime: string | null;
    endTime: string | null;
    reservationStatus: LessonReservationStatus | null;
};

export type LessonMediaResponse = {
    id: number;
    lessonInstanceId: number;
    memberId: number | null;
    memberName: string | null;
    uploadedByAuthUserId: string | null;
    uploadedByName: string | null;
    fileUrl: string | null;
    description: string | null;
    mediaType: string | null;
    fileSizeBytes: number | null;
    tags: string[];
    createdAt: string;
    updatedAt: string;
};


export type MemberLessonDetailResponse = {
    lesson: MemberLessonSummaryResponse;
    group: MemberGroupSummaryResponse | null;
    lessonLog: MemberLessonLogSummaryResponse | null;
    sessions: SessionInstanceResponse[];
    homeworks: MemberHomeworkSummaryResponse[];
    media: LessonMediaResponse[];
    currentHomeworkSubmissions: MemberHomeworkSubmissionResponse[];
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
    lessonId?: number | null;
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
    notes?: string | null;
};

export type RescheduleLessonReservationRequest = {
    lessonAvailabilityId: number;
    notes?: string | null;
};

export type MemberLessonReservationRelatedCoach = {
    id: number;
    name: string;
    profileImage: string | null;
};

export type MemberLessonReservationRelatedTicket = {
    id: number;
    name: string;
    type: TicketType | null;
    status: TicketStatus | null;
};

export type MemberLessonReservationRelatedLessonAvailability = {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    capacity: number | null;
    bookedCount: number | null;
    lessonType: LessonType | null;
    slotStatus: LessonSlotStatus | null;
};

export type MemberLessonReservationRelatedLessonLog = {
    id: number;
    name: string;
};

export type MemberLessonReservationResponse = {
    reservationType: MemberReservationDomain;
    id: number;
    reservationNumber: string;
    lessonProgramEnrollmentId: number | null;
    lessonProgramGroupId: number | null;
    lessonId: number | null;
    lessonName: string | null;
    lessonProgramName: string | null;
    lessonProgramGroupName: string | null;
    coach: MemberLessonReservationRelatedCoach | null;
    ticket: MemberLessonReservationRelatedTicket | null;
    lessonAvailability: MemberLessonReservationRelatedLessonAvailability | null;
    lessonLog: MemberLessonReservationRelatedLessonLog | null;
    bookedAt: string | null;
    startTime: string | null;
    endTime: string | null;
    reservationDate: string | null;
    durationMinutes: number | null;
    reservationStatus: LessonReservationStatus | null;
    checkedInAt: string | null;
    cancelledAt: string | null;
    memberNotes: string | null;
    isCancellable: boolean;
};
