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
        console.log("Failed to get JWT:", result.error);
        return null;
    }

    return result.data?.token ?? null;
}


export async function getSession(): Promise<string | null> {
    const result = await authClient.$fetch<JwtResponse>("/get-session", {
        method: "GET",
    });

    if (result.error) {
        console.log("Failed to get Session:", result.error);
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
