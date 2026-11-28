import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import { UpdateMyProfileRequest, MemberSelfResponse } from "@/types/member.type";
import { hasExpired, PROFILE_IMAGE_MAX_SIZE_BYTES, type ProfileImageContentType } from "@/utils/media";
import { File, UploadType } from "expo-file-system";

export const getMemberProfile = async (signal?: AbortSignal): Promise<ApiResponse<MemberSelfResponse>> => {
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

type StagedUpload = {
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
): Promise<void> => {
    const imageFile = new File(imageUri);

    if (!imageFile.exists || imageFile.size <= 0) {
        throw new Error("The selected profile image is empty.");
    }

    if (imageFile.size > PROFILE_IMAGE_MAX_SIZE_BYTES) {
        throw new Error("Profile images must be 10 MiB or smaller.");
    }

    const stageUpload = async () => {
        const response = await apiClient<ApiResponse<StagedUpload>>("/uploads/images/presigned", {
            method: "POST",
            body: JSON.stringify({
                purpose: "PROFILE_IMAGE",
                contentType,
                sizeBytes: imageFile.size,
            }),
        });

        if (!response.data.uploadUrl || !response.data.key || !response.data.expiresAt) {
            throw new Error("The API returned an invalid staged upload.");
        }

        return response.data;
    };

    let staged = await stageUpload();

    if (hasExpired(staged.expiresAt)) {
        staged = await stageUpload();
    }

    if (hasExpired(staged.expiresAt)) {
        throw new Error("The API returned an expired staged upload.");
    }

    let uploadResponse = await putProfileImage(staged, imageFile, contentType);

    if (!isUploadSuccess(uploadResponse.status) && hasExpired(staged.expiresAt)) {
        staged = await stageUpload();
        uploadResponse = await putProfileImage(staged, imageFile, contentType);
    }

    if (!isUploadSuccess(uploadResponse.status)) {
        throw new Error(`Profile image upload failed: ${uploadResponse.status}`);
    }

    await apiClient(`/member/${memberId}/profile-image`, {
        method: "PUT",
        body: JSON.stringify({ uploadKey: staged.key }),
    });
};

function isUploadSuccess(status: number) {
    return status >= 200 && status < 300;
}

async function putProfileImage(staged: StagedUpload, imageFile: File, contentType: ProfileImageContentType) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300_000);
    try {
        return await imageFile.upload(staged.uploadUrl, {
            httpMethod: "PUT",
            uploadType: UploadType.BINARY_CONTENT,
            headers: { "Content-Type": contentType },
            sessionType: "foreground",
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }
}
