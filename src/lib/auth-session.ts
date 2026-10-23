import { authClient } from "./auth-client";
import { clearCachedJwtToken } from "./client/jwt-token";

let sessionCheck: Promise<boolean> | null = null;
let sessionEndedNotice = false;
const noticeListeners = new Set<() => void>();

export function getSessionEndedNotice() {
    return sessionEndedNotice;
}

export function subscribeToSessionEndedNotice(listener: () => void) {
    noticeListeners.add(listener);
    return () => { noticeListeners.delete(listener); };
}

function setSessionEndedNotice(value: boolean) {
    if (sessionEndedNotice === value) return;
    sessionEndedNotice = value;
    noticeListeners.forEach((listener) => listener());
}

export function clearSessionEndedNotice() {
    setSessionEndedNotice(false);
}

export function verifyMemberSession(): Promise<boolean> {
    if (sessionCheck) return sessionCheck;

    sessionCheck = (async () => {
        try {
            const result = await authClient.getSession({
                query: { disableCookieCache: true },
            });

            if (result.error) {
                if (result.error.status !== 401) return false;
            } else if (result.data?.session) {
                return true;
            } else if (result.data === undefined) {
                return false;
            }

            setSessionEndedNotice(true);
            clearCachedJwtToken();
            // The Expo auth client clears its stored cookie and session on sign-out.
            try {
                await authClient.signOut();
            } finally {
                clearCachedJwtToken();
            }
            return false;
        } catch {
            // Network and server failures must not end the local session.
            return false;
        }
    })().finally(() => {
        sessionCheck = null;
    });

    return sessionCheck;
}
