type ApiErrorPayload = {
    message?: string;
    traceId?: string;
    [key: string]: unknown;
};

export function isRequestBodyFormData(body: RequestInit["body"]): body is FormData {
    return typeof FormData !== "undefined" && body instanceof FormData;
}

export async function parseApiResponse(response: Response) {
    const contentType = response.headers.get("Content-Type") ?? response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const traceId =
        response.headers.get("X-Trace-Id") ??
        response.headers.get("x-trace-id");

    if (!response.ok) {
        const errorData: ApiErrorPayload = isJson
            ? await response.json()
            : { message: "Unknown error" };

        if (traceId) {
            errorData.traceId = traceId;
        }

        throw errorData;
    }

    if (response.status === 204) {
        return undefined;
    }

    return isJson ? response.json() : response.text();
}
