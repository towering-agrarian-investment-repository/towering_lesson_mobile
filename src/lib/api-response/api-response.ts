export type ApiResponse<T> = {
    data: T | null;
    status: {
        code: number;
        message: string;
        timestamp: string;
    };
};

export type CursorPageResponse<T> = {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
};