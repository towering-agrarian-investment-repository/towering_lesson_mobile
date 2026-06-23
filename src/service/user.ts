import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import {
    UpdateMyProfileRequest,
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
    payload: UpdateMyProfileRequest,
): Promise<ApiResponse<MemberResponse>> => {
    return apiClient("/member/me/mobile", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export type UploadFormFile = {
    uri: string;
    name: string;
    type: string;
};

export const uploadMemberUserProfileImage = async (
    id: number,
    file: UploadFormFile,
) => {
    if (!file?.uri || !file?.name || !file?.type) {
        throw new Error("Selected image is missing uri, name, or MIME type.");
    }

    const formData = new FormData();
    formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.type,
    } as unknown as Blob);

    return apiClient(`/member/${id}/profile-image`, {
        method: "PUT",
        body: formData,
    });
};
