import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

const subscribe = (onStoreChange: () => void) => onlineManager.subscribe(onStoreChange);
const getSnapshot = () => onlineManager.isOnline();
const getServerSnapshot = () => true;

export function useIsOnline() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
