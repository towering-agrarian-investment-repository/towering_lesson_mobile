import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import { MemberLessonDetailResponse } from "@/types/member-lesson";

export async function getMemberLessonById(
    lessonId: number,
    signal?: AbortSignal,
): Promise<ApiResponse<MemberLessonDetailResponse>> {
    return apiClient(`/member/lesson/${lessonId}`, {
        method: "GET",
        signal,
    });
}

export async function getMemberLessonByIdAndGroupId(
    lessonId: number,
    groupId: number,
    signal?: AbortSignal,
): Promise<ApiResponse<MemberLessonDetailResponse>> {
    return apiClient(`/member/lesson/${lessonId}/group/${groupId}`, {
        method: "GET",
        signal,
    });
}
