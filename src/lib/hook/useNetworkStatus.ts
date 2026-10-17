import * as Network from "expo-network";
import { useEffect, useState } from "react";

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);

    useEffect(() => {
        let mounted = true;
        let receivedEvent = false;

        void Network.getNetworkStateAsync().then((state) => {
            if (mounted && !receivedEvent) {
                setIsOnline(state.isConnected ?? null);
            }
        }).catch(() => {
            // A failed lookup leaves connectivity unknown; a listener can still recover it.
        });

        const subscription = Network.addNetworkStateListener((state) => {
            receivedEvent = true;
            if (mounted) setIsOnline(state.isConnected ?? null);
        });

        return () => {
            mounted = false;
            subscription.remove();
        };
    }, []);

    return { isOnline };
}
