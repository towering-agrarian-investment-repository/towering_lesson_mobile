import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { AppState } from "react-native";

const MINUTE_MS = 60_000;

function getCurrentMinuteTimestamp() {
    return Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
}

export function useMinuteClock() {
    const [now, setNow] = useState(getCurrentMinuteTimestamp);

    useFocusEffect(
        useCallback(() => {
            let timer: ReturnType<typeof setInterval> | undefined;

            const updateMinute = () => {
                const nextMinute = getCurrentMinuteTimestamp();
                setNow((prev) => (prev === nextMinute ? prev : nextMinute));
            };

            const syncClock = () => {
                if (timer !== undefined) {
                    clearInterval(timer);
                    timer = undefined;
                }
                if (AppState.currentState !== "active") {
                    return;
                }
                updateMinute();
                timer = setInterval(updateMinute, MINUTE_MS);
            };

            syncClock();
            const subscription = AppState.addEventListener("change", syncClock);

            return () => {
                if (timer !== undefined) {
                    clearInterval(timer);
                }
                subscription.remove();
            };
        }, []),
    );

    return now;
}
