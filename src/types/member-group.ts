import type { MemberHomeworkSummaryResponse } from "./member-homework";
import type { MemberLessonSummaryResponse } from "./member-lesson";

export type MemberGroupSummaryResponse = {
    groupId: number;
    groupName: string;
    lessonProgramId: number;
    lessonProgramName: string;
    lessonType: string;
    capacity: number;
    groupStatus: string;
    programStartDate: string;
    programEndDate: string;
    sessionStartTime: string;
    sessionEndTime: string;
    ticketId: number | null;
    ticketName: string | null;
    enrollmentStatus: string;
    enrolledAt: string;
};

export type MemberGroupDetailsResponse = {
    group: MemberGroupSummaryResponse;
    lessons: MemberLessonSummaryResponse[];
    homeworks: MemberHomeworkSummaryResponse[];
};
