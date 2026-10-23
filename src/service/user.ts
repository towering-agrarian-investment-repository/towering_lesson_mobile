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
import { fetch as expoFetch } from "expo/fetch";
import { File } from "expo-file-system";

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

export const removeMemberProfileImage = async (memberId: number): Promise<void> => {
    await apiClient(`/member/${memberId}/profile-image`, {
        method: "DELETE",
    });
};

export const updateMemberProfileImage = async (
    memberId: number,
    imageUri: string,
    contentType: ProfileImageContentType,
): Promise<ApiResponse<MemberSelfResponse>> => {
    const imageFile = new File(imageUri);

    if (!imageFile.exists || imageFile.size <= 0) {
        throw new Error("The selected profile image is empty.");
    }

    if (imageFile.size > PROFILE_IMAGE_MAX_SIZE_BYTES) {
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
                    sizeBytes: imageFile.size,
                }),
            },
        );

        if (
            !response.data.uploadUrl
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

    let uploadResponse = await putProfileImage(staged, imageFile, contentType);

    if (!uploadResponse.ok && hasExpired(staged.expiresAt)) {
        staged = await stageUpload();
        uploadResponse = await putProfileImage(staged, imageFile, contentType);
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

async function putProfileImage(
    staged: StagedUpload,
    imageFile: File,
    contentType: ProfileImageContentType,
) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300_000);
    try {
        return await expoFetch(staged.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: imageFile,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }
}

function hasExpired(expiresAt: string) {
    const expiryTime = Date.parse(expiresAt);

    return Number.isFinite(expiryTime) && expiryTime <= Date.now();
}
