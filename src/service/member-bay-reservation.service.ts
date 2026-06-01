import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import { BaySlotGroupScheduleResponse, MemberBayReservationRequest, MemberBayReservationResponse } from "@/types/member-bay";

export async function getBayReservationById(
    id: number,
): Promise<ApiResponse<MemberBayReservationResponse>> {
    return apiClient(`/member/bay-reservations/${id}`, {
        method: "GET",
    });
}

export async function createMemberBayReservation(
    data: MemberBayReservationRequest,
): Promise<ApiResponse<MemberBayReservationResponse>> {
    return apiClient("/member/bay-reservations", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getMemberBaySlotGroups(
    startDate: string,
    endDate: string,
): Promise<ApiResponse<BaySlotGroupScheduleResponse[]>> {
    return apiClient(
        `/member/bay-slot-groups?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
        {
            method: "GET",
        },
    );
}
