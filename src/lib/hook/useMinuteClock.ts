import { toAppTimeZoneDate } from "@/utils/timezone";
import { format } from "date-fns";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { AppState } from "react-native";

const MINUTE_MS = 60_000;

function getCurrentMinuteTimestamp() {
    return Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
}

function getMsUntilNextMinute() {
    const remainder = Date.now() % MINUTE_MS;
    return remainder === 0 ? MINUTE_MS : MINUTE_MS - remainder;
}

export function useMinuteClock(enabled = true) {
    const [now, setNow] = useState(getCurrentMinuteTimestamp);

    useFocusEffect(
        useCallback(() => {
            if (!enabled) {
                return undefined;
            }

            let timeout: ReturnType<typeof setTimeout> | undefined;
            let interval: ReturnType<typeof setInterval> | undefined;

            const clearTimers = () => {
                if (timeout !== undefined) {
                    clearTimeout(timeout);
                    timeout = undefined;
                }
                if (interval !== undefined) {
                    clearInterval(interval);
                    interval = undefined;
                }
            };

            const updateMinute = () => {
                const nextMinute = getCurrentMinuteTimestamp();
                setNow((prev) => (prev === nextMinute ? prev : nextMinute));
            };

            const syncClock = () => {
                clearTimers();
                if (AppState.currentState !== "active") {
                    return;
                }
                updateMinute();
                timeout = setTimeout(() => {
                    updateMinute();
                    interval = setInterval(updateMinute, MINUTE_MS);
                }, getMsUntilNextMinute());
            };

            syncClock();
            const subscription = AppState.addEventListener("change", syncClock);

            return () => {
                clearTimers();
                subscription.remove();
            };
        }, [enabled]),
    );

    return now;
}

function getDaySnapshot() {
    const now = getCurrentMinuteTimestamp();
    const tzDate = toAppTimeZoneDate(now);
    const key = tzDate ? format(tzDate, "yyyy-MM-dd") : format(new Date(now), "yyyy-MM-dd");
    return { key, timestamp: now };
}

/**
 * Updates only when the calendar date rolls over (or on focus after midnight),
 * avoiding 60s full-screen re-renders on containers that only need today's date.
 */
export function useDayClock() {
    const [day, setDay] = useState(getDaySnapshot);

    useFocusEffect(
        useCallback(() => {
            let timeout: ReturnType<typeof setTimeout> | undefined;
            let interval: ReturnType<typeof setInterval> | undefined;

            const clearTimers = () => {
                if (timeout !== undefined) {
                    clearTimeout(timeout);
                    timeout = undefined;
                }
                if (interval !== undefined) {
                    clearInterval(interval);
                    interval = undefined;
                }
            };

            const checkDay = () => {
                const next = getDaySnapshot();
                setDay((prev) => (prev.key === next.key ? prev : next));
            };

            const syncClock = () => {
                clearTimers();
                if (AppState.currentState !== "active") {
                    return;
                }
                checkDay();
                timeout = setTimeout(() => {
                    checkDay();
                    interval = setInterval(checkDay, MINUTE_MS);
                }, getMsUntilNextMinute());
            };

            syncClock();
            const subscription = AppState.addEventListener("change", syncClock);

            return () => {
                clearTimers();
                subscription.remove();
            };
        }, []),
    );

    return day.timestamp;
}
