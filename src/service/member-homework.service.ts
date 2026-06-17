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

export type HomeworkSubmissionFile = {
    uri: string;
    name: string;
    type: string;
    size?: number;
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
    file: HomeworkSubmissionFile,
) {
    const fileResponse = await fetch(file.uri);
    const blob = await fileResponse.blob();

    const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": file.type,
        },
        body: blob,
    });

    if (!uploadResponse.ok) {
        throw new Error("Could not upload homework file.");
    }
}
