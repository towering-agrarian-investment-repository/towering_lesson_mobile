import { deactivatePushInstallation, savePushToken } from "@/service/shared/push-token-service";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const INSTALLATION_ID_KEY = "push-installation-id";
const PUSH_REGISTRATION_KEY = "confirmed-push-registration";

type PushRegistrationIdentity = { userId: string; installationId: string; token: string };
type ConfirmedPushRegistration = PushRegistrationIdentity & { registeredAt: number };

let installationIdPromise: Promise<string> | null = null;
let registrationQueue = Promise.resolve();
let registrationGeneration = 0;
let signOutInProgress = false;
let needsRegistration = false;

function enqueuePushOperation(operation: () => Promise<void>) {
    const result = registrationQueue.then(operation);
    registrationQueue = result.catch(() => {});
    return result;
}

export function getPushRegistrationGeneration() {
    return signOutInProgress ? null : registrationGeneration;
}

export function beginPushRegistrationSignOut() {
    signOutInProgress = true;
    registrationGeneration++;
    needsRegistration = true;
    return () => {
        signOutInProgress = false;
    };
}

async function loadConfirmedRegistration(): Promise<Partial<ConfirmedPushRegistration> | null> {
    try {
        const stored = await SecureStore.getItemAsync(PUSH_REGISTRATION_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

export function confirmPushRegistration(identity: PushRegistrationIdentity, generation: number, signal: AbortSignal) {
    const isCurrent = () => !signal.aborted && getPushRegistrationGeneration() === generation;

    return enqueuePushOperation(async () => {
        if (!isCurrent()) return;
        const cached = await loadConfirmedRegistration();
        if (!isCurrent()) return;

        const { userId, installationId, token } = identity;
        if (
            !needsRegistration &&
            cached?.userId === userId &&
            cached.installationId === installationId &&
            cached.token === token &&
            Number.isFinite(cached.registeredAt)
        ) {
            return;
        }

        needsRegistration = true;
        await savePushToken({ deviceId: installationId, pushToken: token, platform: "EXPO" }, signal);
        if (!isCurrent()) return;

        const confirmed: ConfirmedPushRegistration = { ...identity, registeredAt: Date.now() };
        await SecureStore.setItemAsync(PUSH_REGISTRATION_KEY, JSON.stringify(confirmed));
        if (isCurrent()) needsRegistration = false;
        if (__DEV__) console.info("[push] Expo push token registered with the backend");
    });
}

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

export function deactivateCurrentPushInstallation(signal: AbortSignal): Promise<void> {
    return enqueuePushOperation(async () => {
        try {
            await SecureStore.deleteItemAsync(PUSH_REGISTRATION_KEY);
        } finally {
            if (!signal.aborted) {
                const installationId = await getInstallationId();
                if (!signal.aborted) await deactivatePushInstallation(installationId, signal);
            }
        }
    });
}
