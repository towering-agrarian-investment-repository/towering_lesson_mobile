import { authClient } from "@/lib/auth-client";


export const signIn = async ({ username, password }: { username: string; password: string }) => {
    const result = await authClient.signIn.username({
        username: username.trim(),
        password,
    });

    if (result.error) {
        throw new Error(result.error.message || "Invalid username or password.");
    }

    return result.data;
};

export const signOut = async () => {
    return authClient.signOut();
};
