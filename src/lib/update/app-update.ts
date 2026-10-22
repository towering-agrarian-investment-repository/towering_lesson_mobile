import Constants from "expo-constants";
import { Linking, Platform } from "react-native";
import { env } from "../config/env";
import i18n from "../../i18n";
import { getAppRequestHeaders } from "../client/app-request-headers";
import type { ApiResponse } from "../api-response/api-response";
import { showAppToast } from "../toast/toast";

export type AppUpdateConfig = {
    minimumSupportedVersion?: string | null;
    latestVersion?: string | null;
    message?: string | null;
    androidStoreUrl?: string | null;
    iosStoreUrl?: string | null;
};

export type AppUpdateState = {
    installedVersion: string;
    minimumSupportedVersion: string | null;
    latestVersion: string | null;
    message: string | null;
    androidStoreUrl: string | null;
    iosStoreUrl: string | null;
};

const installedVersion = Constants.expoConfig?.version ?? "0.0.0";
const updateRequiredListeners = new Set<(config?: AppUpdateConfig) => void>();
let appUpdateCheck: Promise<AppUpdateState | null> | null = null;

export function subscribeToUpdateRequired(listener: (config?: AppUpdateConfig) => void) {
    updateRequiredListeners.add(listener);
    return () => updateRequiredListeners.delete(listener);
}

export function notifyUpdateRequired(config?: AppUpdateConfig) {
    if (!config) {
        appUpdateCheck = null;
    }

    updateRequiredListeners.forEach((listener) => listener(config));
}

export function fetchAppUpdateState(): Promise<AppUpdateState | null> {
    if (!appUpdateCheck) {
        appUpdateCheck = fetchAppUpdateStateOnce();
    }

    return appUpdateCheck;
}

export function refreshAppUpdateState(): Promise<AppUpdateState | null> {
    appUpdateCheck = fetchAppUpdateStateOnce();
    return appUpdateCheck;
}

async function fetchAppUpdateStateOnce(): Promise<AppUpdateState | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    try {
        if (__DEV__) {
            console.log("[app-update] checking:", env.appVersionUrl);
        }

        const response = await fetch(env.appVersionUrl, {
            headers: {
                Accept: "application/json",
                "Accept-Language": i18n.resolvedLanguage ?? i18n.language ?? "en",
                ...getAppRequestHeaders("MEMBER"),
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            if (__DEV__) {
                console.log(
                    "[app-update] response:",
                    response.status,
                    response.headers.get("content-type") ?? "unknown content type",
                );
            }
            return null;
        }

        const responseText = await response.text();

        if (__DEV__) {
            console.log("[app-update] response:", response.status, responseText);
        }

        const payload = JSON.parse(responseText) as ApiResponse<AppUpdateConfig>;
        const config = payload.data;

        if (!config) {
            return null;
        }

        return {
            installedVersion,
            minimumSupportedVersion: config.minimumSupportedVersion ?? null,
            latestVersion: config.latestVersion ?? null,
            message: config.message ?? null,
            androidStoreUrl: config.androidStoreUrl ?? null,
            iosStoreUrl: config.iosStoreUrl ?? null,
        };
    } catch (error) {
        if (__DEV__) {
            console.warn("[app-update] check failed:", error);
        }

        // Version checks must fail open when the user is offline or the endpoint is unavailable.
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

export function isVersionLessThan(current: string, minimum: string | null) {
    if (!minimum) {
        return false;
    }

    const currentParts = parseVersion(current);
    const minimumParts = parseVersion(minimum);

    for (let index = 0; index < 3; index += 1) {
        if (currentParts[index] !== minimumParts[index]) {
            return currentParts[index] < minimumParts[index];
        }
    }

    return false;
}

export function getStoreUrl(state: AppUpdateState) {
    if (Platform.OS === "android") {
        const androidStoreUrl = state.androidStoreUrl
            ?.trim()
            .replace(/^["']+|["']+$/g, "")
            .trim();
        return (
            androidStoreUrl ||
            "https://play.google.com/store/apps/details?id=com.toweringinvest.happygolfmobile"
        );
    }

    return state.iosStoreUrl;
}

export async function openStore(state: AppUpdateState) {
    try {
        const storeUrl = getStoreUrl(state)?.trim();
        if (!storeUrl || storeUrl.includes("YOUR_APP_ID") || !["https:", "http:", "market:", "itms-apps:"].includes(new URL(storeUrl).protocol)) {
            throw new Error("Missing or invalid store URL");
        }
        await Linking.openURL(storeUrl);
        return true;
    } catch {
        showAppToast({ message: i18n.t("appUpdate.openStoreError"), type: "error" });
        return false;
    }
}

function parseVersion(version: string) {
    return version
        .split(".")
        .slice(0, 3)
        .map((part) => Number.parseInt(part.replace(/[^0-9].*$/, ""), 10) || 0)
        .concat([0, 0, 0])
        .slice(0, 3);
}
