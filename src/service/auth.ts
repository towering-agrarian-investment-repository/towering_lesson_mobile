import { authClient } from "@/lib/auth-client";
import { deactivateCurrentPushInstallation } from "@/lib/config/notification/pushRegistrationStorage";
import { clearCachedJwtToken } from "@/lib/client/jwt-token";

export const ALLOWED_APP_ROLE = "MEMBER";
const GENERIC_LOGIN_ERROR_MESSAGE = "Invalid phone number or password";

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
        throw new Error(GENERIC_LOGIN_ERROR_MESSAGE);
    }

    const signedInUser = result.data?.user as { role?: string | null } | undefined;
    const signedInRole = signedInUser?.role?.toUpperCase?.() ?? null;

    if (signedInRole !== ALLOWED_APP_ROLE) {
        await authClient.signOut().catch(() => { });
        clearCachedJwtToken();
        throw new Error(GENERIC_LOGIN_ERROR_MESSAGE);
    }

    clearCachedJwtToken();
    return result.data;
};

export const signOut = async () => {
    await deactivateCurrentPushInstallation();
    clearCachedJwtToken();

    const result = await authClient.signOut().finally(clearCachedJwtToken);

    if (result.error) {
        throw new Error(result.error.message || "Could not sign out.");
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
