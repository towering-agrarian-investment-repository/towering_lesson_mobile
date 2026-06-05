import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

export function useNavigationLock() {
    const lockRef = useRef(false);
    const [isLocked, setIsLocked] = useState(false);

    const unlock = useCallback(() => {
        lockRef.current = false;
        setIsLocked(false);
    }, []);

    const lock = useCallback(() => {
        if (lockRef.current) {
            return false;
        }

        lockRef.current = true;
        setIsLocked(true);
        return true;
    }, []);

    useFocusEffect(
        useCallback(() => {
            unlock();
        }, [unlock]),
    );

    const runWithNavigationLock = useCallback(
        (action: () => void) => {
            if (!lock()) {
                return false;
            }

            try {
                action();
                return true;
            } catch (error) {
                unlock();
                throw error;
            }
        },
        [lock, unlock],
    );

    return {
        isLocked,
        unlock,
        runWithNavigationLock,
    };
}
