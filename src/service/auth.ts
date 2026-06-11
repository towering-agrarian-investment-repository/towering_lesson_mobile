import { authClient } from "@/lib/auth-client";

export const ALLOWED_APP_ROLE = "MEMBER";
const GENERIC_LOGIN_ERROR_MESSAGE = "Invalid username or password";

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
        username?: string | null;
        displayUsername?: string | null;
        phoneNumber?: string | null;
        image?: string | null;
        emailVerified?: boolean;
        createdAt?: string | Date;
        updatedAt?: string | Date;
    };
};

export const signIn = async ({ username, password }: { username: string; password: string }) => {
    const result = await authClient.signIn.username({
        username: username.trim(),
        password,
    });

    if (result.error) {
        throw new Error(GENERIC_LOGIN_ERROR_MESSAGE);
    }

    const signedInUser = result.data?.user as { role?: string | null } | undefined;
    const signedInRole = signedInUser?.role?.toUpperCase?.() ?? null;

    if (signedInRole !== ALLOWED_APP_ROLE) {
        await authClient.signOut().catch(() => { });
        throw new Error(GENERIC_LOGIN_ERROR_MESSAGE);
    }

    return result.data;
};

export const signOut = async () => {
    const result = await authClient.signOut();

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
        throw new Error(error.message || "Could not change password.");
    }

    return data;
};
