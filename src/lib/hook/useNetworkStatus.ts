import * as Network from "expo-network";
import { useEffect, useState } from "react";

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);

    useEffect(() => {
        let mounted = true;

        void Network.getNetworkStateAsync().then((state) => {
            if (mounted) {
                setIsOnline(state.isConnected ?? false);
            }
        });

        const subscription = Network.addNetworkStateListener((state) => {
            setIsOnline(state.isConnected ?? false);
        });

        return () => {
            mounted = false;
            subscription.remove();
        };
    }, []);

    return { isOnline };
}
