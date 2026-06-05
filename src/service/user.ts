import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import {
    MemberMobileProfileUpdateRequest,
    MemberResponse,
} from "@/types/member.type";

export const getMemberProfile = async (
    signal?: AbortSignal,
): Promise<ApiResponse<MemberResponse>> => {
    return apiClient("/member/me", {
        method: "GET",
        signal,
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

export const uploadMemberUserProfileImage = async (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient(`/member/${id}/profile-image`, {
        method: "PUT",
        body: formData,
    });
};
