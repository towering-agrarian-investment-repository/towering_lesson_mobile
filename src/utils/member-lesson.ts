import type {
    MemberHomeworkDetailResponse,
    MemberHomeworkSummaryResponse,
} from "@/types/member-homework";
import type { MemberLessonSummaryResponse } from "@/types/member-lesson";
import type { SessionInstanceResponse } from "@/types/member-session";

export function getGroupName(group?: { groupName?: string | null } | null) {
    return group?.groupName?.trim() || "-";
}

export function getLessonName(lesson?: MemberLessonSummaryResponse | null) {
    return lesson?.title?.trim() || "-";
}

export function getHomeworkTitle(
    homework?: MemberHomeworkSummaryResponse | MemberHomeworkDetailResponse | null,
) {
    const value = "homework" in (homework ?? {})
        ? (homework as MemberHomeworkDetailResponse).homework
        : homework as MemberHomeworkSummaryResponse | null | undefined;

    return value?.title?.trim() || "-";
}

export function getSessionTitle(session?: SessionInstanceResponse | null) {
    return (
        session?.titleSnapshot?.trim() ||
        "-"
    );
}
