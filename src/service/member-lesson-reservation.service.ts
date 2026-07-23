import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import {
    CreateLessonReservationRequest,
    MemberLessonReservationResponse,
    MemberLessonSlotResponse,
} from "@/types/member-lesson";

export async function getLessonReservationById(
    id: number,
    signal?: AbortSignal,
): Promise<ApiResponse<MemberLessonReservationResponse>> {
    return apiClient(`/member/lesson-reservations/${id}`, {
        method: "GET",
        signal,
    });
}


export async function getTicketLessonSlots(
    ticketId: number,
    year: number,
    month: number,
    signal?: AbortSignal,
): Promise<ApiResponse<MemberLessonSlotResponse[]>> {
    return apiClient(
        `/member/tickets/${ticketId}/lesson-slots?year=${encodeURIComponent(String(year))}&month=${encodeURIComponent(String(month))}`,
        {
            method: "GET",
            signal,
        },
    );
}

export async function createMemberLessonReservation(
    data: CreateLessonReservationRequest,
): Promise<ApiResponse<MemberLessonReservationResponse>> {
    return apiClient("/member/lesson-reservations", {
        method: "POST",
        body: JSON.stringify(data),
    });
}


export async function cancelLessonReservationById(
    id: number,
): Promise<ApiResponse<void>> {
    return apiClient(`/member/lesson-reservations/${id}/cancel`, {
        method: "PUT",
    });
}
