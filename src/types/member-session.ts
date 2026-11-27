export type MemberSessionResourceResponse = {
    id: number;
    originalFileName: string | null;
    mediaType: string | null;
    fileSizeBytes: number | null;
    uploadedByName: string | null;
    fileUrl: string | null;
};

type MemberSessionInstanceMemberResponse = {
    id: number;
    sessionInstanceId: number;
    score: number | null;
};

export type MemberLessonSessionResponse = {
    id: number;
    lessonInstanceId: number;
    titleSnapshot: string | null;
    descriptionSnapshot: string | null;
    typeSnapshot: string | null;
    durationMinutesSnapshot: number | null;
    orderIndex: number | null;
    status: string | null;
    completedAt: string | null;
    memberSession: MemberSessionInstanceMemberResponse | null;
    resources: MemberSessionResourceResponse[];
};
