import { deactivatePushInstallation } from "@/service/shared/push-token-service";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const INSTALLATION_ID_KEY = "push-installation-id";
const PUSH_INSTALLATION_DEACTIVATION_RETRY_DELAYS_MS = [0, 500, 1_500] as const;

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

export async function deactivateCurrentPushInstallation(): Promise<void> {
    const installationId = await getInstallationId();
    await deactivatePushInstallationWithRetry(installationId);
}

async function deactivatePushInstallationWithRetry(
    installationId: string,
): Promise<void> {
    let lastError: unknown;

    for (
        let attempt = 0;
        attempt < PUSH_INSTALLATION_DEACTIVATION_RETRY_DELAYS_MS.length;
        attempt += 1
    ) {
        const retryDelay = PUSH_INSTALLATION_DEACTIVATION_RETRY_DELAYS_MS[attempt];

        if (retryDelay > 0) {
            await wait(retryDelay);
        }

        try {
            await deactivatePushInstallation(installationId);
            return;
        } catch (error) {
            lastError = error;
            console.error(
                "[push] Installation deactivation failed during logout " +
                `(attempt ${attempt + 1}/${PUSH_INSTALLATION_DEACTIVATION_RETRY_DELAYS_MS.length})`,
                error,
            );
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error("Could not deactivate this push installation");
}

function wait(delayMs: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, delayMs);
    });
}
