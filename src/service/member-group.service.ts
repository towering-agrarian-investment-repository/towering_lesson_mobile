import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import {
    MemberGroupDetailsResponse,
    MemberGroupSummaryResponse,
} from "@/types/member-group";

export async function getMemberGroups(
    signal?: AbortSignal,
): Promise<ApiResponse<MemberGroupSummaryResponse[]>> {
    return apiClient("/member/groups", {
        method: "GET",
        signal,
    });
}

export async function getMemberGroupHistory(
    signal?: AbortSignal,
): Promise<ApiResponse<MemberGroupSummaryResponse[]>> {
    return apiClient("/member/groups/history", {
        method: "GET",
        signal,
    });
}

export async function getMemberGroupById(
    groupId: number,
    signal?: AbortSignal,
): Promise<ApiResponse<MemberGroupDetailsResponse>> {
    return apiClient(`/member/groups/${groupId}`, {
        method: "GET",
        signal,
    });
}
