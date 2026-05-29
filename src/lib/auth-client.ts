import { expoClient } from "@better-auth/expo/client";
import { jwtClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
    baseURL: "http://192.168.0.65:3002/api/member/auth",
    plugins: [
        expoClient({
            scheme: "golflessonsystemmobile",
            storagePrefix: "golflessonsystemmobile",
            storage: SecureStore,
        }),
        usernameClient(),
        jwtClient(),
    ]
});