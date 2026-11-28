import type { MemberGroupSummaryResponse } from "./member-group";
import type { MemberHomeworkSummaryResponse } from "./member-homework";
import type { MemberLessonLogResponse as MemberLessonLogSummaryResponse } from "./member-lesson-log";
import type { MemberReservationDomain } from "./member-reservation";
import type { MemberLessonSessionResponse } from "./member-session";
import type { TicketType } from "./member.type";

type LessonType = "PRIVATE_LESSON" | "GROUP_LESSON";

export type LessonReservationStatus = "RESERVED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export type MemberLessonSummaryResponse = {
    lessonId: number;
    lessonAvailabilityId: number | null;
    lessonProgramGroupId: number | null;
    title: string;
    description: string | null;
    objectives: string[];
    homeworkSnapshot: string | null;
    orderIndex: number | null;
    lessonStatus: string;
    startTime: string | null;
    endTime: string | null;
    reservationStatus: LessonReservationStatus | null;
};

type MemberLessonMediaResponse = {
    id: number;
    lessonInstanceId: number;
    memberId: number | null;
    memberName: string | null;
    uploadedByName: string | null;
    fileUrl: string | null;
    description: string | null;
    mediaType: string | null;
    fileSizeBytes: number | null;
    tags: string[];
    createdAt: string;
};

export type MemberLessonDetailResponse = {
    lesson: MemberLessonSummaryResponse;
    group: MemberGroupSummaryResponse | null;
    lessonLog: MemberLessonLogSummaryResponse | null;
    sessions: MemberLessonSessionResponse[];
    homeworks: MemberHomeworkSummaryResponse[];
    media: MemberLessonMediaResponse[];
};

export type MemberLessonSlotResponse = {
    id: number;
    coachName: string | null;
    name: string | null;
    startTime: string;
    endTime: string;
    lessonType: LessonType;
    capacity: number;
    bookedCount: number;
    bookable: boolean;
    bookedByCurrentMember: boolean;
};

export type CreateLessonReservationRequest = {
    ticketId: number;
    lessonAvailabilityId: number;
    baySlotId?: number | null;
    notes?: string | null;
};

type MemberLessonReservationRelatedCoach = {
    id: number;
    name: string;
    profileImage: string | null;
};

type MemberLessonReservationRelatedTicket = {
    id: number;
    name: string;
    type: TicketType | null;
    isUnlimited: boolean;
    totalCount: number | null;
    usedCount: number;
    remainingCount: number | null;
};

type MemberLessonReservationRelatedLessonAvailability = {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    capacity: number | null;
    bookedCount: number | null;
    lessonType: LessonType | null;
};

type MemberLessonReservationRelatedLessonLog = {
    id: number;
    name: string;
};

export type MemberLessonReservationResponse = {
    reservationType: Extract<MemberReservationDomain, "lesson">;
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
    memberNotes: string | null;
    isCancellable: boolean;
};
