import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import {
    GenerateHomeworkSubmissionUploadsRequest,
    GenerateHomeworkSubmissionUploadsResponse,
    MemberHomeworkDetailResponse,
    MemberHomeworkSubmissionResponse,
    MemberHomeworkSummaryResponse,
    SubmitHomeworkRequest,
} from "@/types/member-homework";
import {
    HOMEWORK_SUBMISSION_MAX_SIZE_BYTES,
    HOMEWORK_SUBMISSION_MIME_TYPES,
    isAllowedMimeType,
} from "@/utils/media";

export type HomeworkSubmissionFile = {
    uri: string;
    name: string;
    type: string;
    size: number;
};

export async function getMemberHomeworks(
    signal?: AbortSignal,
): Promise<ApiResponse<MemberHomeworkSummaryResponse[]>> {
    return apiClient("/member/homeworks", {
        method: "GET",
        signal,
    });
}

export async function getMemberHomeworkById(
    homeworkId: number,
    signal?: AbortSignal,
): Promise<ApiResponse<MemberHomeworkDetailResponse>> {
    return apiClient(`/member/homework/${homeworkId}`, {
        method: "GET",
        signal,
    });
}

export async function getMemberHomeworkSubmissionsByHomeworkId(
    homeworkId: number,
    signal?: AbortSignal,
): Promise<ApiResponse<MemberHomeworkSubmissionResponse[]>> {
    return apiClient(`/member/homework-submissions/homework/${homeworkId}`, {
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

    return apiClient(
        `/member/homework-submissions/homework/${homeworkId}/presigned-upload`,
        {
            method: "POST",
            body: JSON.stringify(data),
        },
    );
}

export async function submitHomework(
    data: SubmitHomeworkRequest,
): Promise<ApiResponse<MemberHomeworkSubmissionResponse>> {
    return apiClient("/member/homework-submissions", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function uploadHomeworkSubmissionFile(
    uploadUrl: string,
    fileBlob: Blob,
    mediaType: string,
) {
    if (fileBlob.size <= 0) {
        throw new Error("The selected homework file is empty.");
    }

    if (fileBlob.size > HOMEWORK_SUBMISSION_MAX_SIZE_BYTES) {
        throw new Error("Homework files must be 100 MiB or smaller.");
    }

    if (!isAllowedMimeType(mediaType, HOMEWORK_SUBMISSION_MIME_TYPES)) {
        throw new Error("Only JPEG, PNG, WebP, and MP4 files are supported.");
    }

    const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": mediaType,
        },
        body: fileBlob,
    });

    if (!uploadResponse.ok) {
        throw new Error(`Could not upload homework file (${uploadResponse.status}).`);
    }
}

export async function readHomeworkSubmissionFile(
    file: HomeworkSubmissionFile,
): Promise<Blob> {
    const fileResponse = await fetch(file.uri);

    if (!fileResponse.ok) {
        throw new Error("Could not read the selected homework file.");
    }

    return fileResponse.blob();
}
