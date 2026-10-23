import { verifyMemberSession } from "../auth-session";
import { env } from "../config/env";
import i18n from "../../i18n";
import {
    API_ERROR_CODE,
    isApiError,
    isApiErrorResponse,
} from "../api-response/api-response";
import { notifyUpdateRequired } from "../update/app-update";
import { getAppRequestHeaders } from "./app-request-headers";
import { clearCachedJwtToken, getJwtToken } from "./jwt-token";

const API_BASE_URL = env.apiBaseUrl;
const API_REQUEST_TIMEOUT_MS = 15_000;

export async function apiClient<T = unknown>(
    endpoint: string,
    options: RequestInit & { signal?: AbortSignal } = {}
): Promise<T> {
    options.signal?.throwIfAborted();
    const controller = new AbortController();
    let didTimeOut = false;
    const timeout = setTimeout(() => {
        didTimeOut = true;
        controller.abort();
    }, API_REQUEST_TIMEOUT_MS);
    const abortFromCaller = () => controller.abort();
    options.signal?.addEventListener("abort", abortFromCaller, { once: true });

    try {
        const jwtToken = await withAbort(getJwtToken(controller.signal), controller.signal);

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

        if (options.body && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }

        const request = () => fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal,
        });

        let response = await withAbort(request(), controller.signal);
        let retriedGet = false;

        if (response.status === 401) {
            clearCachedJwtToken();
            const sessionRecovered = await withAbort(
                verifyMemberSession(),
                controller.signal,
            );
            if ((options.method ?? "GET").toUpperCase() === "GET" && sessionRecovered) {
                const freshToken = await withAbort(
                    getJwtToken(controller.signal),
                    controller.signal,
                );
                if (freshToken) {
                    headers.set("Authorization", `Bearer ${freshToken}`);
                    retriedGet = true;
                    response = await withAbort(request(), controller.signal);
                }
            }
        }

        if (retriedGet && response.status === 401) {
            clearCachedJwtToken();
        }

        if (response.status === 204) {
            return undefined as T;
        }

        let payload: unknown;

        try {
            payload = await withAbort(response.json(), controller.signal);
        } catch (error) {
            controller.signal.throwIfAborted();
            throw new Error(
                response.ok
                    ? "Backend returned an invalid success response."
                    : "Backend returned an invalid error response.",
                { cause: error },
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
    } catch (error) {
        if (didTimeOut && !options.signal?.aborted) {
            throw new Error("Request timed out.", { cause: error });
        }
        throw error;
    } finally {
        clearTimeout(timeout);
        options.signal?.removeEventListener("abort", abortFromCaller);
    }
}

function withAbort<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
    signal.throwIfAborted();

    return new Promise((resolve, reject) => {
        const onAbort = () => reject(signal.reason);
        signal.addEventListener("abort", onAbort, { once: true });
        operation.then(
            (value) => {
                signal.removeEventListener("abort", onAbort);
                resolve(value);
            },
            (error) => {
                signal.removeEventListener("abort", onAbort);
                reject(error);
            },
        );
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
