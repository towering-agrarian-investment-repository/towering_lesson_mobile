import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import { MemberLessonLogResponse, MemberLessonLogUpdateRequest } from "@/types/member-lesson-log";


export const getMemberLessonLogs = async (
	signal?: AbortSignal,
): Promise<ApiResponse<MemberLessonLogResponse[]>> => {
	return apiClient("/member/lesson-logs", {
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
