import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { AppState } from "react-native";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
// Asia/Phnom_Penh is UTC+7 year-round.
const PHNOM_PENH_OFFSET_MS = 7 * 60 * MINUTE_MS;

function getCurrentMinuteTimestamp(now = Date.now()) {
    return Math.floor(now / MINUTE_MS) * MINUTE_MS;
}

function getPhnomPenhDay(timestamp: number) {
    return Math.floor((timestamp + PHNOM_PENH_OFFSET_MS) / DAY_MS);
}

function getMsUntilNextDay(now: number) {
    return (getPhnomPenhDay(now) + 1) * DAY_MS - PHNOM_PENH_OFFSET_MS - now;
}

function startForegroundClock(update: (now: number) => void, getDelay: (now: number) => number) {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const sync = () => {
        clearTimeout(timer);
        if (AppState.currentState !== "active") return;
        const now = Date.now();
        update(now);
        timer = setTimeout(sync, getDelay(now));
    };

    const subscription = AppState.addEventListener("change", sync);
    sync();
    return () => {
        clearTimeout(timer);
        subscription.remove();
    };
}

const minuteListeners = new Set<(minute: number) => void>();
let currentMinute: number;
let stopMinuteClock: (() => void) | undefined;

function subscribeToMinute(listener: (minute: number) => void) {
    minuteListeners.add(listener);
    if (minuteListeners.size === 1) {
        currentMinute = getCurrentMinuteTimestamp();
        stopMinuteClock = startForegroundClock(
            (now) => {
                const minute = getCurrentMinuteTimestamp(now);
                if (minute === currentMinute) return;
                currentMinute = minute;
                minuteListeners.forEach((notify) => notify(minute));
            },
            (now) => MINUTE_MS - (now % MINUTE_MS),
        );
    }
    if (AppState.currentState === "active") listener(currentMinute);

    return () => {
        minuteListeners.delete(listener);
        if (minuteListeners.size === 0) {
            stopMinuteClock?.();
            stopMinuteClock = undefined;
        }
    };
}

export function useMinuteClock(enabled = true) {
    const [now, setNow] = useState(getCurrentMinuteTimestamp);
    useFocusEffect(useCallback(() => (enabled ? subscribeToMinute(setNow) : undefined), [enabled]));
    return now;
}

/** Updates on Phnom Penh date changes while focused, including after a foreground resume. */
export function useDayClock() {
    const [day, setDay] = useState(getCurrentMinuteTimestamp);

    useFocusEffect(
        useCallback(
            () =>
                startForegroundClock((now) => {
                    setDay((previous) =>
                        getPhnomPenhDay(previous) === getPhnomPenhDay(now) ? previous : getCurrentMinuteTimestamp(now),
                    );
                }, getMsUntilNextDay),
            [],
        ),
    );

    return day;
}
