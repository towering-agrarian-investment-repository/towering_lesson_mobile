import type { HomeworkSubmissionFile } from "@/service/member-homework.service";
import type { MemberHomeworkSubmissionResponse, MemberHomeworkSummaryResponse } from "@/types/member-homework";
import {
    HOMEWORK_SUBMISSION_EXTENSIONS,
    HOMEWORK_SUBMISSION_MAX_SIZE_BYTES,
    HOMEWORK_SUBMISSION_MIME_TYPES,
    getFileExtension,
    isAllowedExtension,
    isAllowedMimeType,
} from "@/utils/media";
import type { DocumentPickerAsset } from "expo-document-picker";
import { File } from "expo-file-system";
import type { ImagePickerAsset } from "expo-image-picker";

const HOMEWORK_MIME_BY_EXTENSION: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    mp4: "video/mp4",
};

export type HomeworkDraft = {
    memo: string;
    file: HomeworkSubmissionFile | null;
};

type HomeworkDisplayState = "approved" | "needsRevision" | "awaitingReview" | "overdue" | "dueSoon" | "assigned";

export const homeworkDraftKey = (homeworkId: number) => `homework:${homeworkId}`;
const DUE_SOON_WINDOW_MS = 48 * 60 * 60 * 1000;

export function getHomeworkDisplayState(
    homework: MemberHomeworkSummaryResponse,
    currentSubmission: MemberHomeworkSubmissionResponse | null,
    now: number,
): HomeworkDisplayState {
    const reviewStatus = currentSubmission?.review?.status;
    const submissionStatus = currentSubmission?.status;

    if (reviewStatus === "CONFIRMED" || submissionStatus === "REVIEWED" || homework.homeworkStatus === "COMPLETED") {
        return "approved";
    }
    if (reviewStatus === "RETURNED" || homework.homeworkStatus === "REJECTED") {
        return "needsRevision";
    }
    if (currentSubmission && (submissionStatus === "SUBMITTED" || reviewStatus === "PENDING" || !reviewStatus)) {
        return "awaitingReview";
    }

    const dueAt = new Date(homework.dueAt).getTime();
    if (Number.isFinite(dueAt)) {
        if (dueAt < now) return "overdue";
        if (dueAt - now <= DUE_SOON_WINDOW_MS) return "dueSoon";
    }

    return "assigned";
}

export function createHomeworkDraft(
    memo: string | undefined,
    file: HomeworkSubmissionFile | null,
): HomeworkDraft | null {
    const draft = { memo: memo ?? "", file };
    return draft.memo.trim() || draft.file ? draft : null;
}

export class HomeworkFileValidationError extends Error {}

export function isImageFile(file: HomeworkSubmissionFile) {
    return file.type.startsWith("image/");
}

export function isVideoFile(file: HomeworkSubmissionFile) {
    return file.type.startsWith("video/");
}

export function createFileFromPickerAsset(asset: ImagePickerAsset, t: (key: string) => string): HomeworkSubmissionFile {
    const file = new File(asset.uri);
    const name = asset.fileName || file.name || `homework-${Date.now()}`;
    const extension = getFileExtension(name);
    const mimeType = asset.mimeType?.toLowerCase() ?? HOMEWORK_MIME_BY_EXTENSION[extension ?? ""];

    if (
        !isAllowedExtension(name, HOMEWORK_SUBMISSION_EXTENSIONS) &&
        !isAllowedMimeType(mimeType, HOMEWORK_SUBMISSION_MIME_TYPES)
    ) {
        throw new HomeworkFileValidationError(t("homework.supportedFilesOnly"));
    }

    if (!mimeType) {
        throw new HomeworkFileValidationError(t("homework.supportedFilesOnly"));
    }

    const size = asset.fileSize ?? file.size;
    if (!file.exists || size <= 0) {
        throw new HomeworkFileValidationError(t("homework.emptyFile"));
    }

    if (size > HOMEWORK_SUBMISSION_MAX_SIZE_BYTES) {
        throw new HomeworkFileValidationError(t("homework.fileTooLarge"));
    }

    return {
        uri: asset.uri,
        name,
        type: mimeType,
        size,
    };
}

export function createFileFromDocument(asset: DocumentPickerAsset, t: (key: string) => string): HomeworkSubmissionFile {
    const file = new File(asset.uri);
    const hasSupportedExtension = isAllowedExtension(asset.name, HOMEWORK_SUBMISSION_EXTENSIONS);
    const hasSupportedMimeType = isAllowedMimeType(asset.mimeType, HOMEWORK_SUBMISSION_MIME_TYPES);

    if (!hasSupportedExtension && !hasSupportedMimeType) {
        throw new HomeworkFileValidationError(t("homework.supportedFilesOnly"));
    }

    const mimeType = hasSupportedMimeType
        ? asset.mimeType?.toLowerCase()
        : HOMEWORK_MIME_BY_EXTENSION[getFileExtension(asset.name) ?? ""];

    if (!mimeType) {
        throw new HomeworkFileValidationError(t("homework.supportedFilesOnly"));
    }

    if (!file.exists || file.size <= 0) {
        throw new HomeworkFileValidationError(t("homework.emptyFile"));
    }

    if (file.size > HOMEWORK_SUBMISSION_MAX_SIZE_BYTES) {
        throw new HomeworkFileValidationError(t("homework.fileTooLarge"));
    }

    return {
        uri: asset.uri,
        name: asset.name || file.name,
        type: mimeType,
        size: file.size,
    };
}
