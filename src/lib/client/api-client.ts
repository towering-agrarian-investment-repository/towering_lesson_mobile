import { authClient } from "../auth-client";
import { env } from "../config/env";
import i18n from "../../i18n";
import {
    API_ERROR_CODE,
    isApiError,
    isApiErrorResponse,
} from "../api-response/api-response";
import { notifyUpdateRequired } from "../update/app-update";
import { getAppRequestHeaders } from "./app-request-headers";

const API_BASE_URL = env.apiBaseUrl;

type JwtResponse = {
    token?: string | null;
};

async function getJwtToken(): Promise<string | null> {
    const result = await authClient.$fetch<JwtResponse>("/token", {
        method: "GET",
    });

    if (result.error) {
        return null;
    }

    return result.data?.token ?? null;
}


export async function getSession(): Promise<string | null> {
    const result = await authClient.$fetch<JwtResponse>("/get-session", {
        method: "GET",
    });

    if (result.error) {
        return null;
    }

    return result.data?.token ?? null;
}


export async function apiClient<T = unknown>(
    endpoint: string,
    options: RequestInit & { signal?: AbortSignal } = {}
): Promise<T> {
    const jwtToken = await getJwtToken();

    if (!jwtToken) {
        throw new Error("No JWT token available");
    }

    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    headers.set("Authorization", `Bearer ${jwtToken}`);
    Object.entries(getAppRequestHeaders()).forEach(([key, value]) => headers.set(key, value));

    if (!headers.has("Accept-Language")) {
        headers.set("Accept-Language", i18n.resolvedLanguage ?? i18n.language ?? "en");
    }

    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    if (options.body instanceof FormData) {
        return uploadFormDataWithXhr<T>(
            `${API_BASE_URL}${endpoint}`,
            options.method ?? "GET",
            headers,
            options.body,
        );
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    let payload: unknown;

    try {
        payload = await response.json();
    } catch {
        throw new Error(
            response.ok
                ? "Backend returned an invalid success response."
                : "Backend returned an invalid error response.",
        );
    }

    if (!response.ok) {
        if (!isApiErrorResponse(payload)) {
            throw new Error("Backend returned an invalid error response.");
        }

        if (isUpdateRequiredResponse(response.status, payload)) {
            notifyUpdateRequired();
        }

        throw payload;
    }

    return payload as T;
}

function uploadFormDataWithXhr<T>(
    url: string,
    method: string,
    headers: Headers,
    body: FormData,
): Promise<T> {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();

        request.open(method, url);
        headers.forEach((value, key) => {
            request.setRequestHeader(key, value);
        });

        request.onload = () => {
            const responseText =
                typeof request.responseText === "string" ? request.responseText : "";
            let payload: unknown;

            try {
                payload = JSON.parse(responseText);
            } catch {
                reject(new Error(
                    request.status >= 200 && request.status < 300
                        ? "Backend returned an invalid success response."
                        : "Backend returned an invalid error response.",
                ));
                return;
            }

            if (request.status >= 200 && request.status < 300) {
                resolve(payload as T);
                return;
            }

            if (!isApiErrorResponse(payload)) {
                reject(new Error("Backend returned an invalid error response."));
                return;
            }

            if (isUpdateRequiredResponse(request.status, payload)) {
                notifyUpdateRequired();
            }

            reject(payload);
        };

        request.onerror = () => {
            reject(new Error("Network request failed"));
        };

        request.ontimeout = () => {
            reject(new Error("Network request timed out"));
        };

        request.send(body);
    });
}

function isUpdateRequiredResponse(status: number, data: unknown) {
    return (
        status === 426 &&
        isApiError(data, {
            httpStatus: 426,
            errorCode: API_ERROR_CODE.UPGRADE_REQUIRED,
        })
    );
}
