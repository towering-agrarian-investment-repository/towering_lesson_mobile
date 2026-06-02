import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import {
    MemberMobileProfileUpdateRequest,
    MemberResponse,
} from "@/types/member.type";

export const getMemberProfile = async (): Promise<ApiResponse<MemberResponse>> => {
    return apiClient("/member/me", {
        method: "GET",
    });
};

export const updateMemberProfile = async (
    payload: MemberMobileProfileUpdateRequest,
): Promise<ApiResponse<MemberResponse>> => {
    return apiClient("/member/me/mobile", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};
