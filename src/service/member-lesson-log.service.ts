import { ApiResponse, CursorPageResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import { MemberLessonLogResponse, MemberLessonLogUpdateRequest } from "@/types/member-lesson-log";


export const MEMBER_LESSON_LOG_PAGE_SIZE = 20;

export const getMemberLessonLogCount = async (
	signal?: AbortSignal,
): Promise<ApiResponse<number>> =>
	apiClient("/member/lesson-logs/count", { method: "GET", signal });

export const getMemberLessonLogs = async (
	params: { cursor?: string; limit?: number } = {},
	signal?: AbortSignal,
): Promise<ApiResponse<CursorPageResponse<MemberLessonLogResponse>>> => {
	const query = new URLSearchParams({
		limit: String(params.limit ?? MEMBER_LESSON_LOG_PAGE_SIZE),
	});
	if (params.cursor) query.set("cursor", params.cursor);
	return apiClient(`/member/lesson-logs?${query.toString()}`, {
		method: "GET",
		signal,
	});
};

export const getMemberLessonLogById = async (
	lessonLogId: number,
	signal?: AbortSignal,
): Promise<ApiResponse<MemberLessonLogResponse>> => {
	return apiClient(`/member/lesson-logs/${lessonLogId}`, {
		method: "GET",
		signal,
	});
};

export const updateMemberLessonLog = async (
	lessonLogId: number,
	data: MemberLessonLogUpdateRequest,
): Promise<ApiResponse<MemberLessonLogResponse>> => {
	return apiClient(`/member/lesson-logs/${lessonLogId}`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
};
