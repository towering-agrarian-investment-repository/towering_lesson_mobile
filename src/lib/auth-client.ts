import { expoClient } from "@better-auth/expo/client";
import { jwtClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { env } from "./config/env";

export const authClient = createAuthClient({
    baseURL: env.authBaseUrl,
    plugins: [
        expoClient({
            scheme: "golflessonsystemmobile",
            storagePrefix: "golflessonsystemmobile",
            storage: SecureStore,
            cookiePrefix: "member",
        }),
        usernameClient(),
        jwtClient(),
    ]
});

