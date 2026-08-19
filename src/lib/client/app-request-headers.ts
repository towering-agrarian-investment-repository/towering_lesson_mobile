import Constants from "expo-constants";
import { Platform } from "react-native";

export type AppClient = "MEMBER" | "COACH";
export type AppPlatform = "android" | "ios";

export const APP_CLIENT: AppClient = "MEMBER";
export const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export function getAppPlatform(): AppPlatform {
    return Platform.OS === "ios" ? "ios" : "android";
}

export function getAppRequestHeaders(client: AppClient = APP_CLIENT) {
    return {
        "X-App-Client": client,
        "X-App-Platform": getAppPlatform(),
        "X-App-Version": APP_VERSION,
    } satisfies Record<string, string>;
}
