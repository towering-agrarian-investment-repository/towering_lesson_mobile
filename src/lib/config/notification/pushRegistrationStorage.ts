import { deactivatePushInstallation } from "@/service/shared/push-token-service";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const INSTALLATION_ID_KEY = "push-installation-id";

let installationIdPromise: Promise<string> | null = null;

export function getInstallationId(): Promise<string> {
    if (!installationIdPromise) {
        installationIdPromise = loadOrCreateInstallationId().catch((error) => {
            installationIdPromise = null;
            throw error;
        });
    }

    return installationIdPromise;
}

async function loadOrCreateInstallationId(): Promise<string> {
    const storedInstallationId = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);

    if (storedInstallationId) {
        return storedInstallationId;
    }

    const installationId = Crypto.randomUUID();
    await SecureStore.setItemAsync(INSTALLATION_ID_KEY, installationId);
    return installationId;
}

export async function deactivateCurrentPushInstallation(signal: AbortSignal): Promise<void> {
    const installationId = await getInstallationId();
    if (signal.aborted) return;
    await deactivatePushInstallation(installationId, signal);
}
