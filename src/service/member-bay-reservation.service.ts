import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import {
    MemberBaySlotGroupResponse,
    MemberBayReservationResponse,
    CreateBayReservationRequest,
    RescheduleBayReservationRequest,
    UpdateBayReservationNotesRequest,
} from "@/types/member-bay";

export async function getBayReservationById(
    id: number,
    signal?: AbortSignal,
): Promise<ApiResponse<MemberBayReservationResponse>> {
    return apiClient(`/member/bay-reservations/${id}`, {
        method: "GET",
        signal,
    });
}

export async function createMemberBayReservation(
    data: CreateBayReservationRequest,
): Promise<ApiResponse<MemberBayReservationResponse>> {
    return apiClient("/member/bay-reservations", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getMemberBaySlotGroups(
    ticketId: number,
    startDate: string,
    endDate: string,
    signal?: AbortSignal,
): Promise<ApiResponse<MemberBaySlotGroupResponse[]>> {
    if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
        throw new Error("A positive ticketId is required for bay availability.");
    }

    return apiClient(
        `/member/bay-slot-groups?ticketId=${ticketId}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
        {
            method: "GET",
            signal,
        },
    );
}

export async function cancelBayReservationById(id: number): Promise<ApiResponse<null>> {
    return apiClient(`/member/bay-reservations/${id}/cancel`, {
        method: "PUT",
    });
}

export async function updateBayReservationMemberNotes(
    id: number,
    data: UpdateBayReservationNotesRequest,
): Promise<ApiResponse<null>> {
    return apiClient(`/member/bay-reservations/${id}/member-notes`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function rescheduleBayReservationById(
    id: number,
    data: RescheduleBayReservationRequest,
): Promise<ApiResponse<MemberBayReservationResponse>> {
    return apiClient(`/member/bay-reservations/${id}/reschedule`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}
