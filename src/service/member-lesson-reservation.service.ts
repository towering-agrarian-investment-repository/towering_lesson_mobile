import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import { MemberLessonReservationResponse } from "@/types/member-lesson";

export async function getLessonReservationById(
    id: number,
): Promise<ApiResponse<MemberLessonReservationResponse>> {
    return apiClient(`/member/lesson-reservations/${id}`, {
        method: "GET",
    });
}
