import { authClient } from "@/lib/auth-client";
import { deactivateCurrentPushInstallation } from "@/lib/config/notification/pushRegistrationStorage";
import { clearCachedJwtToken } from "@/lib/client/jwt-token";

export const ALLOWED_APP_ROLE = "MEMBER";
const PUSH_CLEANUP_TIMEOUT_MS = 1_500;
export class InvalidCredentialsError extends Error {
    constructor() {
        super("INVALID_CREDENTIALS");
    }
}

export class BannedUserError extends Error {
    constructor() {
        super("BANNED_USER");
    }
}

export type AuthSession = {
    session: {
        id: string;
        token?: string | null;
        userId: string;
        expiresAt?: string | Date;
        createdAt?: string | Date;
        updatedAt?: string | Date;
    } | null;
    user: {
        id: string;
        email: string;
        name?: string | null;
        role?: string | null;
        phoneNumber?: string | null;
        image?: string | null;
        emailVerified?: boolean;
        createdAt?: string | Date;
        updatedAt?: string | Date;
    };
};

export const signIn = async ({ phoneNumber, password }: { phoneNumber: string; password: string }) => {
    clearCachedJwtToken();
    const result = await authClient.signIn.phoneNumber({
        phoneNumber: phoneNumber.trim(),
        password,
    });

    if (result.error) {
        if (result.error.code === "BANNED_USER") {
            throw new BannedUserError();
        }
        if (result.error.code === "INVALID_PHONE_NUMBER_OR_PASSWORD" || result.error.code === "INVALID_PHONE_NUMBER") {
            throw new InvalidCredentialsError();
        }
        throw result.error;
    }

    const signedInUser = result.data?.user as { role?: string | null } | undefined;
    const signedInRole = signedInUser?.role?.toUpperCase?.() ?? null;

    if (signedInRole !== ALLOWED_APP_ROLE) {
        await authClient.signOut().catch(() => { });
        clearCachedJwtToken();
        throw new InvalidCredentialsError();
    }

    clearCachedJwtToken();
    return result.data;
};

export const signOut = async () => {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const cleanup = deactivateCurrentPushInstallation(controller.signal).catch((error) => {
        console.warn("[push] Could not deactivate this installation during sign-out", error);
    });
    const timeout = new Promise<void>((resolve) => {
        timeoutId = setTimeout(() => {
            controller.abort();
            resolve();
        }, PUSH_CLEANUP_TIMEOUT_MS);
    });

    await Promise.race([cleanup, timeout]);
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    clearCachedJwtToken();

    const result = await authClient.signOut().finally(clearCachedJwtToken);

    if (result.error) {
        throw result.error;
    }

    return result.data;
};

export const changePassword = async ({
    newPassword,
    currentPassword,
}: {
    newPassword: string;
    currentPassword: string;
}) => {
    const { data, error } = await authClient.changePassword({
        newPassword,
        currentPassword,
    });

    if (error) {
        throw error;
    }

    return data;
};
