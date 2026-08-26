import { useEffect, useState } from "react";
import Constants from "expo-constants";
import {
    fetchAppUpdateState,
    isVersionLessThan,
    subscribeToUpdateRequired,
    type AppUpdateConfig,
    type AppUpdateState,
} from "./app-update";

export function useAppUpdate() {
    const skipUpdateCheck =
        __DEV__ && process.env.EXPO_PUBLIC_SKIP_APP_UPDATE_CHECK === "true";
    const [state, setState] = useState<AppUpdateState | null>(null);
    const [isChecking, setIsChecking] = useState(!skipUpdateCheck);
    const [isOptionalUpdateDismissed, setIsOptionalUpdateDismissed] = useState(false);

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

    return {
        state,
        isChecking,
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
