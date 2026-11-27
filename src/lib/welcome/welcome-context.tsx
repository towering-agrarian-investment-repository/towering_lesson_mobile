import AsyncStorage from "@react-native-async-storage/async-storage";
import { WELCOME_COMPLETED_STORAGE_KEY, loadStartupPreferences } from "@/lib/startup-preferences";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type WelcomeContextValue = {
    isReady: boolean;
    hasCompletedWelcome: boolean;
    completeWelcome: () => Promise<void>;
};

const WelcomeContext = createContext<WelcomeContextValue | null>(null);

export function WelcomeProvider({ children }: { children: ReactNode }) {
    const [isReady, setIsReady] = useState(false);
    const [hasCompletedWelcome, setHasCompletedWelcome] = useState(false);

    useEffect(() => {
        let isMounted = true;

        void loadStartupPreferences()
            .then((preferences) => {
                if (isMounted) {
                    setHasCompletedWelcome(preferences.get(WELCOME_COMPLETED_STORAGE_KEY) === "true");
                }
            })
            .catch(() => {
                // Leave onboarding available when its saved completion cannot be read.
            })
            .finally(() => {
                if (isMounted) {
                    setIsReady(true);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const value = useMemo<WelcomeContextValue>(
        () => ({
            isReady,
            hasCompletedWelcome,
            completeWelcome: async () => {
                await AsyncStorage.setItem(WELCOME_COMPLETED_STORAGE_KEY, "true");
                setHasCompletedWelcome(true);
            },
        }),
        [hasCompletedWelcome, isReady],
    );

    return <WelcomeContext.Provider value={value}>{children}</WelcomeContext.Provider>;
}

export function useWelcome() {
    const context = useContext(WelcomeContext);

    if (!context) {
        throw new Error("useWelcome must be used inside WelcomeProvider");
    }

    return context;
}
