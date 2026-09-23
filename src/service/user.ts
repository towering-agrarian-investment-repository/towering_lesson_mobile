import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import {
    UpdateMyProfileRequest,
    MemberSelfResponse,
} from "@/types/member.type";
import {
    PROFILE_IMAGE_MAX_SIZE_BYTES,
    type ProfileImageContentType,
} from "@/utils/media";

export const getMemberProfile = async (
    signal?: AbortSignal,
): Promise<ApiResponse<MemberSelfResponse>> => {
    return apiClient("/member/me", {
        method: "GET",
        signal,
    });
};

export const updateMemberProfile = async (
    payload: UpdateMyProfileRequest,
): Promise<ApiResponse<MemberSelfResponse>> => {
    return apiClient("/member/me/mobile", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export type StagedUpload = {
    uploadUrl: string;
    key: string;
    expiresAt: string;
};

export const updateMemberProfileImage = async (
    memberId: number,
    imageUri: string,
    contentType: ProfileImageContentType,
): Promise<ApiResponse<MemberSelfResponse>> => {
    const imageResponse = await fetch(imageUri);
    const imageBlob = await imageResponse.blob();

    if (imageBlob.size <= 0) {
        throw new Error("The selected profile image is empty.");
    }

    if (imageBlob.size > PROFILE_IMAGE_MAX_SIZE_BYTES) {
        throw new Error("Profile images must be 10 MiB or smaller.");
    }

    const stageUpload = async () => {
        const response = await apiClient<ApiResponse<StagedUpload>>(
            "/uploads/images/presigned",
            {
                method: "POST",
                body: JSON.stringify({
                    purpose: "PROFILE_IMAGE",
                    contentType,
                    sizeBytes: imageBlob.size,
                }),
            },
        );

        if (
            !response.data?.uploadUrl
            || !response.data.key
            || !response.data.expiresAt
        ) {
            throw new Error("The API returned an invalid staged upload.");
        }

        return response.data;
    };

    let staged = await stageUpload();

    if (hasExpired(staged.expiresAt)) {
        staged = await stageUpload();
    }

    let uploadResponse = await putProfileImage(staged, imageBlob, contentType);

    if (!uploadResponse.ok && hasExpired(staged.expiresAt)) {
        staged = await stageUpload();
        uploadResponse = await putProfileImage(staged, imageBlob, contentType);
    }

    if (!uploadResponse.ok) {
        throw new Error(`Profile image upload failed: ${uploadResponse.status}`);
    }

    return apiClient<ApiResponse<MemberSelfResponse>>(
        `/member/${memberId}/profile-image`,
        {
            method: "PUT",
            body: JSON.stringify({ uploadKey: staged.key }),
        },
    );
};

function putProfileImage(
    staged: StagedUpload,
    imageBlob: Blob,
    contentType: ProfileImageContentType,
) {
    return fetch(staged.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: imageBlob,
    });
}

function hasExpired(expiresAt: string) {
    const expiryTime = Date.parse(expiresAt);

    return Number.isFinite(expiryTime) && expiryTime <= Date.now();
}
