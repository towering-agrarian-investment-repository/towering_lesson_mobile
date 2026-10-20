import { expoClient } from "@better-auth/expo/client";
import { jwtClient, phoneNumberClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { getAppRequestHeaders } from "./client/app-request-headers";
import { env } from "./config/env";

export const authClient = createAuthClient({
    baseURL: env.authBaseUrl,
    fetchOptions: {
        headers: {
            ...getAppRequestHeaders(),
            ...(Device.modelName ? { "X-Device-Model": Device.modelName } : {}),
        },
    },
    sessionOptions: { refetchOnWindowFocus: false },
    plugins: [
        expoClient({
            scheme: "golflessonsystemmobile",
            storagePrefix: "golflessonsystemmobile",
            storage: SecureStore,
            cookiePrefix: "member",
        }),
        phoneNumberClient(),
        jwtClient(),
    ]
});
