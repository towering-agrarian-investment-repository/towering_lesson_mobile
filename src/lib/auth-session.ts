import { authClient } from "./auth-client";

let sessionCheck: Promise<void> | null = null;
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

export function verifyMemberSession(): Promise<void> {
    if (sessionCheck) return sessionCheck;

    sessionCheck = (async () => {
        try {
            const result = await authClient.getSession({
                query: { disableCookieCache: true },
            });

            if (result.error) {
                if (result.error.status !== 401) return;
            } else if (result.data === undefined || result.data?.session) {
                return;
            }

            setSessionEndedNotice(true);
            // The Expo auth client clears its stored cookie and session on sign-out.
            await authClient.signOut();
        } catch {
            // Network and server failures must not end the local session.
        }
    })().finally(() => {
        sessionCheck = null;
    });

    return sessionCheck;
}
