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

    const localFileResponse = await fetch(file.uri);

    if (!localFileResponse.ok) {
        throw new Error("Could not read the selected image file.");
    }

    const sourceBlob = await localFileResponse.blob();
    const uploadBlob =
        sourceBlob.type === file.type
            ? sourceBlob
            : sourceBlob.slice(0, sourceBlob.size, file.type);

    const formData = new FormData();
    if (typeof File !== "undefined") {
        const uploadFile = new File([uploadBlob], file.name, {
            type: file.type,
        });
        formData.append("file", uploadFile);
    } else {
        formData.append("file", uploadBlob, file.name);
    }

    return apiClient(`/member/${id}/profile-image`, {
        method: "PUT",
        body: formData,
    });
};
