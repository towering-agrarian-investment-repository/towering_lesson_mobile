import { triggerImpactHaptic } from "@/design-system/utils/haptics";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";

/** Track a user refresh independently of background query activity. */
export function usePullToRefresh(refresh: () => Promise<unknown>) {
    const [refreshing, setRefreshing] = useState(false);
    const pending = useRef(false);

    const onRefresh = async () => {
        if (pending.current) return;
        pending.current = true;
        if (process.env.EXPO_OS === "android") {
            triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Light);
        }
        setRefreshing(true);
        try {
            await refresh();
        } finally {
            pending.current = false;
            setRefreshing(false);
        }
    };

    return { refreshing, onRefresh };
}
