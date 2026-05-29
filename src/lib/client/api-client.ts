import { authClient } from "../auth-client";

const API_BASE_URL = "http://192.168.0.65:8082/api/v1";

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

export async function apiClient<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const jwtToken = await getJwtToken();

    if (!jwtToken) {
        throw new Error("No JWT token available");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
            ...options.headers,
        },
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        throw data;
    }

    return data as T;
}