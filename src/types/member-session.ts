export type SessionResourcesFilesResponse = {
    id: number;
    s3Key: string | null;
    externalUrl: string | null;
    originalFileName: string | null;
    mediaType: string | null;
    fileSizeBytes: number | null;
    createdAt: string;
    updatedAt: string;
    uploadedByName: string | null;
    fileUrl: string | null;
};

export type MemberSessionResponse = {
    id: number;
    sessionInstanceId: number;
    markByCoachId: number | null;
    score: number | null;
    memo: string | null;
    createdAt: string;
    updatedAt: string;
};

export type SessionInstanceResponse = {
    id: number;
    lessonInstanceId: number;
    sessionTemplateId: number | null;
    titleSnapshot: string | null;
    descriptionSnapshot: string | null;
    typeSnapshot: string | null;
    durationMinutesSnapshot: number | null;
    orderIndex: number | null;
    status: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    memberSession: MemberSessionResponse | null;
    resources: SessionResourcesFilesResponse[];
};
