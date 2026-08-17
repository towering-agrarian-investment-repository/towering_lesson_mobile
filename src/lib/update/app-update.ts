import Constants from "expo-constants";
import { Linking, Platform } from "react-native";
import { env } from "../config/env";
import i18n from "../../i18n";

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

export function subscribeToUpdateRequired(listener: (config?: AppUpdateConfig) => void) {
    updateRequiredListeners.add(listener);
    return () => updateRequiredListeners.delete(listener);
}

export function notifyUpdateRequired(config?: AppUpdateConfig) {
    updateRequiredListeners.forEach((listener) => listener(config));
}

export async function fetchAppUpdateState(): Promise<AppUpdateState | null> {
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
                "X-App-Platform": Platform.OS,
                "X-App-Version": installedVersion,
            },
            signal: controller.signal,
        });

        const responseText = await response.text();

        if (__DEV__) {
            console.log("[app-update] response:", response.status, responseText);
        }

        if (!response.ok) {
            return null;
        }

        const config = JSON.parse(responseText) as AppUpdateConfig;
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
        return (
            state.androidStoreUrl ??
            "https://play.google.com/store/apps/details?id=com.anonymous.golflessonsystemmobile"
        );
    }

    return state.iosStoreUrl;
}

export async function openStore(state: AppUpdateState) {
    const storeUrl = getStoreUrl(state);
    if (!storeUrl) {
        return;
    }

    try {
        await Linking.openURL(storeUrl);
    } catch {
        // The store URL is supplied by the backend and may not be available in a simulator.
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
