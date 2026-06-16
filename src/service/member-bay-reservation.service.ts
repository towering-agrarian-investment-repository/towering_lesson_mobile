import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import {
    BaySlotGroupScheduleResponse,
    MemberBayReservationResponse,
    CreateBayReservationRequest,
    RescheduleBayReservationRequest,
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
    startDate: string,
    endDate: string,
    signal?: AbortSignal,
): Promise<ApiResponse<BaySlotGroupScheduleResponse[]>> {
    return apiClient(
        `/member/bay-slot-groups?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
        {
            method: "GET",
            signal,
        },
    );
}

export async function cancelBayReservationById(id: number): Promise<ApiResponse<void>> {
    return apiClient(`/member/bay-reservations/${id}/cancel`, {
        method: "PUT",
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
