import { decodeJwt } from "jose";
import { authClient } from "../auth-client";

const TOKEN_REFRESH_SKEW_MS = 30_000;

let cachedToken: { value: string; expiresAt: number } | null = null;
let pendingToken: Promise<string | null> | null = null;
let authGeneration = 0;

function getTokenExpiration(token: string): number | null {
    try {
        const { exp } = decodeJwt(token);
        return typeof exp === "number" && Number.isFinite(exp)
            ? exp * 1000
            : null;
    } catch {
        return null;
    }
}

export function clearCachedJwtToken() {
    authGeneration += 1;
    cachedToken = null;
    pendingToken = null;
}

export async function getJwtToken(signal?: AbortSignal): Promise<string | null> {
    signal?.throwIfAborted();

    if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_SKEW_MS > Date.now()) {
        return cachedToken.value;
    }

    const generation = authGeneration;
    if (!pendingToken) {
        const request = authClient.token().then(({ data, error }) => {
            if (error) return null;

            const token = data?.token ?? null;
            const expiresAt = token ? getTokenExpiration(token) : null;
            if (token && expiresAt && expiresAt - TOKEN_REFRESH_SKEW_MS > Date.now() && generation === authGeneration) {
                cachedToken = { value: token, expiresAt };
            }
            return token;
        });
        pendingToken = request;
        const clearPending = () => { if (pendingToken === request) pendingToken = null; };
        void request.then(clearPending, clearPending);
    }

    const token = await pendingToken;
    signal?.throwIfAborted();
    return generation === authGeneration ? token : null;
}
