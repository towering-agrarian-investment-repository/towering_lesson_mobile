import { createContext, useContext, type ReactNode } from "react";
import { useAppUpdate } from "./use-app-update";

type AppUpdateContextValue = ReturnType<typeof useAppUpdate>;

const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);

export function AppUpdateProvider({
    value,
    children,
}: {
    value: AppUpdateContextValue;
    children: ReactNode;
}) {
    return <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>;
}

export function useAppUpdateContext() {
    const context = useContext(AppUpdateContext);

    if (!context) {
        throw new Error("useAppUpdateContext must be used inside AppUpdateProvider");
    }

    return context;
}
