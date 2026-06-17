import { authClient } from "../auth-client";
import { env } from "../config/env";

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
    headers.set("Authorization", `Bearer ${jwtToken}`);

    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
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

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        throw data;
    }

    return data as T;
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
            const contentType = request.getResponseHeader("content-type");
            const responseText =
                typeof request.responseText === "string" ? request.responseText : "";
            let data: unknown = responseText;

            if (contentType?.includes("application/json") && responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch {
                    data = responseText;
                }
            }

            if (request.status >= 200 && request.status < 300) {
                resolve(data as T);
                return;
            }

            reject(data);
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
