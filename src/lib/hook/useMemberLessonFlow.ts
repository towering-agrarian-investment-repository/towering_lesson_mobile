import {
    getMemberGroupById,
    getMemberGroups,
} from "@/service/member-group.service";
import {
    generateHomeworkSubmissionUpload,
    getMemberHomeworkById,
    getMemberHomeworks,
    getMemberHomeworkSubmissionsByHomeworkId,
    HomeworkSubmissionFile,
    readHomeworkSubmissionFile,
    submitHomework,
    uploadHomeworkSubmissionFile,
} from "@/service/member-homework.service";
import {
    getMemberLessonById,
    getMemberLessonByIdAndGroupId,
} from "@/service/member-lesson.service";
import { getMemberSessionInstancesByLessonId } from "@/service/member-session.service";
import {
    MemberHomeworkDetailResponse,
    MemberHomeworkSubmissionResponse,
    MemberHomeworkSummaryResponse,
} from "@/types/member-homework";
import { MemberLessonDetailResponse } from "@/types/member-lesson";
import { SessionInstanceResponse } from "@/types/member-session";
import {
    HOMEWORK_SUBMISSION_MAX_SIZE_BYTES,
    HOMEWORK_SUBMISSION_MIME_TYPES,
    isAllowedMimeType,
} from "@/utils/media";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ApiResponse,
    responseError,
    responseStatus,
} from "../api-response/api-response";

export function getMemberGroupsQueryOptions() {
    return {
        queryKey: ["member", "groups"] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) => getMemberGroups(signal),
    };
}

export function getMemberGroupByIdQueryOptions(groupId: number) {
    return {
        queryKey: ["member", "groups", groupId] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
            getMemberGroupById(groupId, signal),
    };
}

export function getMemberLessonByGroupQueryOptions(
    groupId: number,
    lessonId: number,
) {
    return {
        queryKey: ["member", "groups", groupId, "lessons", lessonId] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
            getMemberLessonByIdAndGroupId(lessonId, groupId, signal),
    };
}

export function getMemberLessonByIdQueryOptions(lessonId: number) {
    return {
        queryKey: ["member", "lessons", lessonId] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
            getMemberLessonById(lessonId, signal),
    };
}

export function getMemberHomeworkByIdQueryOptions(homeworkId: number) {
    return {
        queryKey: ["member", "homeworks", homeworkId] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
            getMemberHomeworkById(homeworkId, signal),
    };
}

export function useMemberGroups() {
    return useQuery({
        ...getMemberGroupsQueryOptions(),
        staleTime: 60_000,
    });
}

export function useMemberGroupById(groupId: number) {
    return useQuery({
        ...getMemberGroupByIdQueryOptions(groupId),
        enabled: Number.isFinite(groupId) && groupId > 0,
        staleTime: 60_000,
    });
}

export function useMemberLessonByGroup(
    groupId: number,
    lessonId: number,
) {
    return useQuery<ApiResponse<MemberLessonDetailResponse>>({
        ...getMemberLessonByGroupQueryOptions(groupId, lessonId),
        enabled:
            Number.isFinite(groupId) &&
            groupId > 0 &&
            Number.isFinite(lessonId) &&
            lessonId > 0,
        staleTime: 60_000,
    });
}

export function useMemberLessonById(lessonId: number) {
    return useQuery<ApiResponse<MemberLessonDetailResponse>>({
        ...getMemberLessonByIdQueryOptions(lessonId),
        enabled: Number.isFinite(lessonId) && lessonId > 0,
        staleTime: 60_000,
    });
}

export function useMemberSessionInstancesByLesson(lessonId: number) {
    return useQuery<ApiResponse<SessionInstanceResponse[]>>({
        queryKey: ["member", "lessons", lessonId, "sessions"],
        queryFn: ({ signal }) => getMemberSessionInstancesByLessonId(lessonId, signal),
        enabled: Number.isFinite(lessonId) && lessonId > 0,
        staleTime: 60_000,
    });
}

export function useMemberHomeworks() {
    return useQuery<ApiResponse<MemberHomeworkSummaryResponse[]>>({
        queryKey: ["member", "homeworks"],
        queryFn: ({ signal }) => getMemberHomeworks(signal),
        staleTime: 60_000,
    });
}

export function useMemberHomeworkById(homeworkId: number) {
    return useQuery<ApiResponse<MemberHomeworkDetailResponse>>({
        ...getMemberHomeworkByIdQueryOptions(homeworkId),
        enabled: Number.isFinite(homeworkId) && homeworkId > 0,
        staleTime: 30_000,
    });
}

export function useMemberHomeworkSubmissions(homeworkId: number) {
    return useQuery<ApiResponse<MemberHomeworkSubmissionResponse[]>>({
        queryKey: ["member", "homeworks", homeworkId, "submissions"],
        queryFn: ({ signal }) =>
            getMemberHomeworkSubmissionsByHomeworkId(homeworkId, signal),
        enabled: Number.isFinite(homeworkId) && homeworkId > 0,
        staleTime: 30_000,
    });
}

export function useSubmitMemberHomework() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            homeworkId,
            homeworkInstanceId,
            file,
            memberMemo,
        }: {
            homeworkId: number;
            homeworkInstanceId: number;
            file: HomeworkSubmissionFile;
            memberMemo?: string;
        }) => {
            const mediaType = file.type.toLowerCase();

            if (!isAllowedMimeType(mediaType, HOMEWORK_SUBMISSION_MIME_TYPES)) {
                throw new Error("Only JPEG, PNG, WebP, and MP4 files are supported.");
            }

            const fileBlob = await readHomeworkSubmissionFile(file);

            if (fileBlob.size <= 0) {
                throw new Error("The selected homework file is empty.");
            }

            if (fileBlob.size > HOMEWORK_SUBMISSION_MAX_SIZE_BYTES) {
                throw new Error("Homework files must be 100 MiB or smaller.");
            }

            const requestUploadTarget = async () => {
                const uploadResponse = await generateHomeworkSubmissionUpload(homeworkId, {
                    homeworkInstanceId,
                    files: [
                        {
                            originalFileName: file.name,
                            mediaType,
                            sizeBytes: fileBlob.size,
                        },
                    ],
                });
                const uploadTarget = uploadResponse.data?.uploads?.[0];

                if (
                    uploadResponse.data?.homeworkId !== homeworkId
                    || !uploadTarget?.key
                    || !uploadTarget.uploadUrl
                    || !uploadTarget.expiresAt
                ) {
                    throw new Error("Could not prepare homework upload.");
                }

                return uploadTarget;
            };

            const requestFreshUploadTarget = async () => {
                let uploadTarget = await requestUploadTarget();

                if (hasExpired(uploadTarget.expiresAt)) {
                    uploadTarget = await requestUploadTarget();
                }

                if (hasExpired(uploadTarget.expiresAt)) {
                    throw new Error("Could not prepare a valid homework upload URL.");
                }

                return uploadTarget;
            };

            let uploadTarget = await requestFreshUploadTarget();

            try {
                await uploadHomeworkSubmissionFile(
                    uploadTarget.uploadUrl,
                    fileBlob,
                    mediaType,
                );
            } catch {
                uploadTarget = await requestFreshUploadTarget();
                await uploadHomeworkSubmissionFile(
                    uploadTarget.uploadUrl,
                    fileBlob,
                    mediaType,
                );
            }

            return submitHomework({
                homeworkId,
                uploadKey: uploadTarget.key,
                originalFileName: file.name,
                memberMemo: memberMemo?.trim() || undefined,
            });
        },
        onSuccess: (res, variables) => {
            responseStatus(res);
            queryClient.invalidateQueries({ queryKey: ["member", "homeworks"] });
            queryClient.invalidateQueries({
                queryKey: ["member", "homeworks", variables.homeworkId],
            });
            queryClient.invalidateQueries({
                queryKey: [
                    "member",
                    "homeworks",
                    variables.homeworkId,
                    "submissions",
                ],
            });
            queryClient.invalidateQueries({ queryKey: ["member", "groups"] });
        },
        onError: (error: unknown) => {
            responseError(error);
        },
    });
}

function hasExpired(expiresAt: string) {
    const expiryTime = Date.parse(expiresAt);

    return !Number.isFinite(expiryTime) || expiryTime <= Date.now();
}
