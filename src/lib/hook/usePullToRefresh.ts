import { useRef, useState } from "react";

/** Track a user refresh independently of background query activity. */
export function usePullToRefresh(refresh: () => Promise<unknown>) {
    const [refreshing, setRefreshing] = useState(false);
    const pending = useRef(false);

    const onRefresh = async () => {
        if (pending.current) return;
        pending.current = true;
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
