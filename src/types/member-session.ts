export type SessionResourcesFilesResponse = {
    id: number;
    fileId?: number | null;
    originalFileName?: string | null;
    mediaType?: string | null;
    url?: string | null;
    fileSizeBytes?: number | null;
};

export type SessionInstanceResponse = {
    id: number;
    sessionId?: number | null;
    sessionInstanceId?: number | null;
    sessionName?: string | null;
    title?: string | null;
    name?: string | null;
    description?: string | null;
    sessionOrder?: number | null;
    resources?: SessionResourcesFilesResponse[] | null;
};
