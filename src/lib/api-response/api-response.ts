import { showAppToast } from "../toast/toast";

export type CursorPageResponse<T> = {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
};

export type ApiStatus = {
    code: number;
    message: string;
    timestamp: string;
};

export type ApiResponse<T> = {
    data: T | null;
    status: ApiStatus;
};

export const API_ERROR_CODE = {
    BAD_REQUEST: "BAD_REQUEST",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    CONFLICT: "CONFLICT",
    METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
    NOT_ACCEPTABLE: "NOT_ACCEPTABLE",
    UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
    UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
    TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
    UPGRADE_REQUIRED: "UPGRADE_REQUIRED",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
    RESERVATION_SLOT_UNAVAILABLE: "RESERVATION_SLOT_UNAVAILABLE",
} as const;

export type ApiErrorCode =
    (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE];

export type ApiErrorResponse = {
    httpStatus: number;
    errorCode: ApiErrorCode;
    message: string;
    timestamp: string;
};

export function isApiErrorResponse(
    error: unknown,
): error is ApiErrorResponse {
    if (!error || typeof error !== "object") {
        return false;
    }

    const value = error as Record<string, unknown>;

    return (
        typeof value.httpStatus === "number" &&
        typeof value.errorCode === "string" &&
        typeof value.message === "string" &&
        typeof value.timestamp === "string"
    );
}

export function isApiError(
    error: unknown,
    expected: { httpStatus: number; errorCode: ApiErrorCode },
): error is ApiErrorResponse {
    return (
        isApiErrorResponse(error) &&
        error.httpStatus === expected.httpStatus &&
        error.errorCode === expected.errorCode
    );
}

export type PagedResponse<T, M = Record<string, unknown>> = {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
    totalAll?: number;
    totalFiltered?: number;
    meta?: M;
};

export function responseStatus<T>(res: ApiResponse<T>): void {
    showAppToast({
        message: res.status.message,
        type: "success",
    });
}

export function responseError(error: unknown): void {
    const message = isApiErrorResponse(error)
        ? error.message
        : "Unable to connect to the server.";

    showAppToast({
        message,
        type: "error",
        duration: 4000,
    });
}
