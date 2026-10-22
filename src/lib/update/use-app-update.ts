import { useEffect, useRef, useState } from "react";
import Constants from "expo-constants";
import {
    fetchAppUpdateState,
    isVersionLessThan,
    refreshAppUpdateState,
    subscribeToUpdateRequired,
    type AppUpdateConfig,
    type AppUpdateState,
} from "./app-update";

export function useAppUpdate() {
    const skipUpdateCheck =
        __DEV__ && process.env.EXPO_PUBLIC_SKIP_APP_UPDATE_CHECK === "true";
    const [state, setState] = useState<AppUpdateState | null>(null);
    const [isChecking, setIsChecking] = useState(!skipUpdateCheck);
    const [isCheckingAgain, setIsCheckingAgain] = useState(false);
    const [isOptionalUpdateDismissed, setIsOptionalUpdateDismissed] = useState(false);
    const checkingAgain = useRef(false);

    useEffect(() => {
        let mounted = true;

        if (skipUpdateCheck) {
            return;
        }

        const check = () => fetchAppUpdateState().then((nextState) => {
            if (!mounted) {
                return;
            }

            setState(nextState);
            setIsChecking(false);
        });

        void check();
        const unsubscribe = subscribeToUpdateRequired((config?: AppUpdateConfig) => {
            if (config) {
                setState({
                    installedVersion: Constants.expoConfig?.version ?? "0.0.0",
                    minimumSupportedVersion: config.minimumSupportedVersion ?? null,
                    latestVersion: config.latestVersion ?? null,
                    message: config.message ?? null,
                    androidStoreUrl: config.androidStoreUrl ?? null,
                    iosStoreUrl: config.iosStoreUrl ?? null,
                });
                setIsChecking(false);
                return;
            }

            void check();
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [skipUpdateCheck]);

    const checkAgain = async () => {
        if (checkingAgain.current) return false;
        checkingAgain.current = true;
        setIsCheckingAgain(true);

        try {
            const nextState = await refreshAppUpdateState();
            if (nextState) setState(nextState);
            return nextState !== null;
        } finally {
            checkingAgain.current = false;
            setIsCheckingAgain(false);
        }
    };

    return {
        state,
        isChecking,
        isCheckingAgain,
        checkAgain,
        isForceUpdateRequired: Boolean(
            state &&
                isVersionLessThan(
                    state.installedVersion,
                    state.minimumSupportedVersion,
                ),
        ),
        isOptionalUpdateAvailable: Boolean(
            !isOptionalUpdateDismissed &&
            state &&
                !isVersionLessThan(
                    state.installedVersion,
                    state.minimumSupportedVersion,
                ) &&
                isVersionLessThan(state.installedVersion, state.latestVersion),
        ),
        dismissOptionalUpdate: () => setIsOptionalUpdateDismissed(true),
    };
}
