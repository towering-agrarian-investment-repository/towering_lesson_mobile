import { onlineManager } from "@tanstack/react-query";
import { verifyMemberSession } from "../auth-session";
import { env } from "../config/env";
import i18n from "../../i18n";
import { API_ERROR_CODE, isApiError, isApiErrorResponse, UserFacingError } from "../api-response/api-response";
import { notifyUpdateRequired } from "../update/app-update";
import { getAppRequestHeaders } from "./app-request-headers";
import { getJwtToken, invalidateRejectedJwtToken, recoverRejectedJwtToken, type JwtToken } from "./jwt-token";

const API_BASE_URL = env.apiBaseUrl;
const API_REQUEST_TIMEOUT_MS = 15_000;

export async function apiClient<T = unknown>(
    endpoint: string,
    options: RequestInit & { signal?: AbortSignal } = {},
): Promise<T> {
    options.signal?.throwIfAborted();
    const isGetRequest = (options.method ?? "GET").toUpperCase() === "GET";
    if (!isGetRequest && !onlineManager.isOnline()) {
        throw new UserFacingError(i18n.t("common.offlineMessage"));
    }

    const controller = new AbortController();
    let didTimeOut = false;
    const timeout = setTimeout(() => {
        didTimeOut = true;
        controller.abort();
    }, API_REQUEST_TIMEOUT_MS);
    const abortFromCaller = () => controller.abort();
    options.signal?.addEventListener("abort", abortFromCaller, { once: true });

    try {
        let jwtToken: JwtToken | null;
        try {
            jwtToken = await withAbort(getJwtToken(controller.signal), controller.signal);
        } catch (error) {
            if (error && typeof error === "object" && "status" in error && error.status === 401) {
                await withAbort(verifyMemberSession(), controller.signal);
            }
            throw error;
        }

        if (!jwtToken) {
            await withAbort(verifyMemberSession(), controller.signal);
            throw new Error("No JWT token available");
        }

        const headers = new Headers(options.headers);
        headers.set("Accept", "application/json");
        headers.set("Authorization", `Bearer ${jwtToken.value}`);
        Object.entries(getAppRequestHeaders()).forEach(([key, value]) => headers.set(key, value));

        if (!headers.has("Accept-Language")) {
            headers.set("Accept-Language", i18n.resolvedLanguage ?? i18n.language ?? "en");
        }

        if (options.body && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }

        const request = () =>
            fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
                signal: controller.signal,
            });

        let response = await withAbort(request(), controller.signal);

        if (response.status === 401 && (isGetRequest || isBearerTokenRejection(response))) {
            const freshToken = await withAbort(recoverRejectedJwtToken(jwtToken), controller.signal);
            if (freshToken) {
                headers.set("Authorization", `Bearer ${freshToken.value}`);
                response = await withAbort(request(), controller.signal);
                if (isBearerTokenRejection(response)) {
                    invalidateRejectedJwtToken(freshToken);
                }
            }
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
            throw new UserFacingError(i18n.t("common.requestTimeout"));
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

function isBearerTokenRejection(response: Response) {
    return response.status === 401 && /^Bearer(?:\s|$)/i.test(response.headers.get("WWW-Authenticate")?.trim() ?? "");
}
