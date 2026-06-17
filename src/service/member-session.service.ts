import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import { SessionInstanceResponse } from "@/types/member-session";

export async function getMemberSessionInstancesByLessonId(
    lessonId: number,
    signal?: AbortSignal,
): Promise<ApiResponse<SessionInstanceResponse[]>> {
    return apiClient(`/member/session-instances/lesson/${lessonId}`, {
        method: "GET",
        signal,
    });
}
