import { decodeJwt } from "jose";
import { authClient } from "../auth-client";

const TOKEN_REFRESH_SKEW_MS = 30_000;

export type JwtToken = { value: string; generation: number };

let cachedToken: (JwtToken & { expiresAt: number }) | null = null;
let pendingToken: Promise<JwtToken | null> | null = null;
let authGeneration = 0;

function getTokenExpiration(token: string): number | null {
    try {
        const { exp } = decodeJwt(token);
        return typeof exp === "number" && Number.isFinite(exp) ? exp * 1000 : null;
    } catch {
        return null;
    }
}

export function clearCachedJwtToken() {
    authGeneration += 1;
    cachedToken = null;
    pendingToken = null;
}

export function invalidateRejectedJwtToken(rejectedToken: JwtToken) {
    if (cachedToken?.value === rejectedToken.value && cachedToken.generation === rejectedToken.generation) {
        cachedToken = null;
    }
}

function getUsableCachedToken(): JwtToken | null {
    return cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_SKEW_MS > Date.now() ? cachedToken : null;
}

function requestJwtToken(): Promise<JwtToken | null> {
    if (pendingToken) return pendingToken;
    const generation = authGeneration;
    const request = authClient.token().then(({ data, error }) => {
        if (generation !== authGeneration) return null;
        if (error) throw error;
        const value = data?.token;
        if (!value) return null;

        const token = { value, generation };
        const expiresAt = getTokenExpiration(value);
        if (expiresAt !== null && expiresAt - TOKEN_REFRESH_SKEW_MS > Date.now()) {
            cachedToken = { ...token, expiresAt };
        }
        return token;
    });
    pendingToken = request;
    const clearPending = () => {
        if (pendingToken === request) pendingToken = null;
    };
    void request.then(clearPending, clearPending);
    return request;
}

export async function getJwtToken(signal?: AbortSignal): Promise<JwtToken | null> {
    signal?.throwIfAborted();
    const token = await (getUsableCachedToken() ?? requestJwtToken());
    signal?.throwIfAborted();
    return token?.generation === authGeneration ? token : null;
}

export async function recoverRejectedJwtToken(rejected: JwtToken): Promise<JwtToken | null> {
    if (rejected.generation !== authGeneration) return null;
    invalidateRejectedJwtToken(rejected);
    return getJwtToken();
}
