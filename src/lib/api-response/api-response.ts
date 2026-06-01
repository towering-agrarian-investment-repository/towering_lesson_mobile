import { showAppToast } from "../toast/toast";


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


export type ApiStatus = {
    code: number;
    message: string;
    timestamp: string;
};

type ApiErrorResponse = {
    httpStatus: string;
    message: unknown;
    errorCode: string;
    timestamp: string;
};

type ResponseStatusOptions<T> = {
    res: ApiResponse<T> | ApiResponse<T>[];
};

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

const normalizeErrorMessage = (value: unknown): string | undefined => {
    if (typeof value === "string") {
        const raw = value.trim();
        if (!raw) return undefined;

        const stripHtml = (text: string) =>
            text
                .replace(/<[^>]*>/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        const nextJsErrorPrefix = "Next.js error:";

        if (raw.includes("<!DOCTYPE html") || raw.includes("<html")) {
            const withoutHtml = stripHtml(raw);
            return withoutHtml ? withoutHtml.slice(0, 200) : "Request failed.";
        }

        if (raw.startsWith(nextJsErrorPrefix)) {
            const bodyStart = raw.indexOf("<!DOCTYPE html");
            if (bodyStart >= 0) {
                return raw.slice(0, bodyStart).trim();
            }
        }

        const jsonStart = raw.indexOf("{");
        if (jsonStart >= 0) {
            const jsonChunk = raw.slice(jsonStart);

            try {
                const parsed = JSON.parse(jsonChunk) as {
                    message?: unknown;
                    error?: unknown;
                };

                return (
                    normalizeErrorMessage(parsed.message) ||
                    normalizeErrorMessage(parsed.error) ||
                    raw
                );
            } catch {
                return raw;
            }
        }

        return raw;
    }

    if (Array.isArray(value)) {
        const items = value
            .map((item) => normalizeErrorMessage(item))
            .filter((item): item is string => Boolean(item));

        return items.length > 0 ? items.join(", ") : undefined;
    }

    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;

        return (
            normalizeErrorMessage(record.message) ||
            normalizeErrorMessage(record.error) ||
            normalizeErrorMessage(record.detail) ||
            normalizeErrorMessage(record.details) ||
            undefined
        );
    }

    return undefined;
};

export function responseStatus<T>({ res }: ResponseStatusOptions<T>): void {
    if (!res) return;

    if (Array.isArray(res)) {
        const allOk = res.every(
            (r) => r?.status?.code === 200 || r?.status?.code === 201
        );

        const anyFail = res.some((r) => r?.status?.code >= 400);

        if (allOk) {
            showAppToast({
                message: "All uploads completed successfully!",
                type: "success",
            });
        } else if (anyFail) {
            const errors = res
                .filter((r) => r?.status?.code >= 400)
                .map((r) => r?.status?.message)
                .filter(Boolean)
                .join(", ");

            showAppToast({
                message: errors || "Some uploads failed. Please check retry.",
                type: "error",
                duration: 4000,
            });
        } else {
            showAppToast({
                message: "Upload finished with mixed results.",
                type: "info",
            });
        }

        return;
    }

    const code = res?.status?.code;

    if (code === 200 || code === 201) {
        showAppToast({
            message: res?.status?.message || "Success",
            type: "success",
        });
    }

    if (code && code >= 400) {
        showAppToast({
            message: res?.status?.message || "Something went wrong.",
            type: "error",
            duration: 4000,
        });
    }
}

export function responseError(input: {
    errorMessage?: string;
    error?: unknown;
}): void {
    let message = input.errorMessage || "An unknown error occurred";

    if (input.error) {
        const err = input.error as {
            status?: { code?: number; message?: unknown };
            code?: number;
            message?: unknown;
            error?: unknown;
            data?: ApiErrorResponse;
        };

        const apiError = err.data;

        const statusCode = Number(
            apiError?.httpStatus ?? err.status?.code ?? err.code
        );

        message =
            normalizeErrorMessage(apiError?.message) ||
            normalizeErrorMessage(err.status?.message) ||
            normalizeErrorMessage(err.message) ||
            normalizeErrorMessage(err.error) ||
            message;

        const normalized = String(message ?? "").toLowerCase();

        const mentionsIdempotency = normalized.includes("idempotency");

        const mentionsDuplicateKey =
            normalized.includes("duplicate key") ||
            (normalized.includes("duplicate") && normalized.includes("payload"));

        const isDuplicateIdempotency =
            statusCode === 409 && (mentionsIdempotency || mentionsDuplicateKey);

        if (isDuplicateIdempotency) {
            message = "Duplicate key with different payload.";
        }
    }

    if (typeof message === "string") {
        message = message.replace(/\s+/g, " ").trim();
    }

    showAppToast({
        message,
        type: "error",
        duration: 4000,
    });
}
