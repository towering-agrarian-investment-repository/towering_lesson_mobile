import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import { MemberResponse } from "@/types/member.type";

export const getMemberProfile = async (): Promise<ApiResponse<MemberResponse>> => {
    return apiClient(`/member/me`, {
        method: "GET",
    });
};
