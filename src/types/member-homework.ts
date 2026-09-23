export type MemberHomeworkSummaryResponse = {
    homeworkId: number;
    lessonInstanceId: number;
    lessonProgramGroupId: number | null;
    title: string;
    description: string | null;
    dueAt: string;
    homeworkStatus: string;
    currentSubmissionStatus: string | null;
    currentReviewStatus: string | null;
    submittedAt: string | null;
};

export type MemberHomeworkReviewResponse = {
    id: number;
    score: number | null;
    coachFeedback: string | null;
    status: string;
    checkedByCoachId: number | null;
    checkedByCoachName: string | null;
    reviewedAt: string | null;
    confirmedAt: string | null;
};

export type MemberHomeworkSubmissionResponse = {
    id: number;
    homeworkId: number;
    memberId: number;
    memberName: string | null;
    submittedByAuthUserId: string | null;
    submittedByName: string | null;
    originalFileName: string | null;
    externalUrl: string | null;
    fileUrl: string | null;
    mediaType: string | null;
    fileSizeBytes: number | null;
    revisionNo: number;
    memberMemo: string | null;
    submittedAt: string;
    isCurrent: boolean;
    status: string;
    review: MemberHomeworkReviewResponse | null;
};

export type MemberHomeworkDetailResponse = {
    homework: MemberHomeworkSummaryResponse;
    lesson: import("./member-lesson").MemberLessonSummaryResponse;
    submissions: MemberHomeworkSubmissionResponse[];
};

export type GenerateHomeworkSubmissionUploadFileRequest = {
    originalFileName: string;
    mediaType: string;
    sizeBytes: number;
};

export type GenerateHomeworkSubmissionUploadsRequest = {
    homeworkInstanceId: number;
    files: GenerateHomeworkSubmissionUploadFileRequest[];
};

export type HomeworkSubmissionUploadTarget = {
    key: string;
    uploadUrl: string;
    expiresAt: string;
};

export type GenerateHomeworkSubmissionUploadsResponse = {
    homeworkId: number;
    uploads: HomeworkSubmissionUploadTarget[];
};

export type SubmitHomeworkRequest = {
    homeworkId: number;
    uploadKey: string;
    originalFileName: string;
    memberMemo?: string;
};
