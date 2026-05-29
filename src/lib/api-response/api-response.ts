export type ApiResponse<T> = {
    data: T | null;
    status: {
        code: number;
        message: string;
        timestamp: string;
    };
};
