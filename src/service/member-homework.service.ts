import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import {
    GenerateHomeworkSubmissionUploadsRequest,
    GenerateHomeworkSubmissionUploadsResponse,
    MemberHomeworkDetailResponse,
    MemberHomeworkSubmissionResponse,
    SubmitHomeworkRequest,
} from "@/types/member-homework";
import { HOMEWORK_SUBMISSION_MAX_SIZE_BYTES, HOMEWORK_SUBMISSION_MIME_TYPES, isAllowedMimeType } from "@/utils/media";
import { File, UploadType } from "expo-file-system";

export type HomeworkSubmissionFile = {
    uri: string;
    name: string;
    type: string;
    size: number;
};

export async function getMemberHomeworkById(
    homeworkId: number,
    signal?: AbortSignal,
): Promise<ApiResponse<MemberHomeworkDetailResponse>> {
    return apiClient(`/member/homework/${homeworkId}`, {
        method: "GET",
        signal,
    });
}

export async function generateHomeworkSubmissionUpload(
    homeworkId: number,
    data: GenerateHomeworkSubmissionUploadsRequest,
): Promise<ApiResponse<GenerateHomeworkSubmissionUploadsResponse>> {
    if (data.files.length === 0) {
        throw new Error("At least one homework file is required.");
    }

    for (const file of data.files) {
        if (!Number.isSafeInteger(file.sizeBytes) || file.sizeBytes <= 0) {
            throw new Error("Each homework file must have an exact positive size.");
        }

        if (file.sizeBytes > HOMEWORK_SUBMISSION_MAX_SIZE_BYTES) {
            throw new Error("Homework files must be 100 MiB or smaller.");
        }

        if (!isAllowedMimeType(file.mediaType, HOMEWORK_SUBMISSION_MIME_TYPES)) {
            throw new Error("Only JPEG, PNG, WebP, and MP4 files are supported.");
        }
    }

    return apiClient(`/member/homework-submissions/homework/${homeworkId}/presigned-upload`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function submitHomework(
    data: SubmitHomeworkRequest,
): Promise<ApiResponse<MemberHomeworkSubmissionResponse>> {
    return apiClient("/member/homework-submissions", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function uploadHomeworkSubmissionFile(uploadUrl: string, file: File, mediaType: string) {
    if (!file.exists || file.size <= 0) {
        throw new Error("The selected homework file is empty.");
    }

    if (file.size > HOMEWORK_SUBMISSION_MAX_SIZE_BYTES) {
        throw new Error("Homework files must be 100 MiB or smaller.");
    }

    if (!isAllowedMimeType(mediaType, HOMEWORK_SUBMISSION_MIME_TYPES)) {
        throw new Error("Only JPEG, PNG, WebP, and MP4 files are supported.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300_000);
    let uploadResult: Awaited<ReturnType<File["upload"]>>;
    try {
        uploadResult = await file.upload(uploadUrl, {
            httpMethod: "PUT",
            uploadType: UploadType.BINARY_CONTENT,
            headers: {
                "Content-Type": mediaType,
            },
            sessionType: "foreground",
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw Object.assign(new Error(`Storage upload failed: ${uploadResult.status} ${uploadResult.body}`), {
            status: uploadResult.status,
        });
    }
}
