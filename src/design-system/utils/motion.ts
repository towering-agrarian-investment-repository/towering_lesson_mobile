import { cubicBezier, Easing } from "react-native-reanimated";

/** Shared motion tokens. Durations are milliseconds. */
export const motionDuration = {
    fast: 120,
    normal: 160,
    standard: 200,
    slow: 280,
} as const;

/** Easing functions for `withTiming`. */
export const motionEase = Easing.bezier(0.23, 1, 0.32, 1);
export const motionEaseInOut = Easing.bezier(0.77, 0, 0.175, 1);

/** Easing factories for CSS-style `animationTimingFunction`. */
export const motionCssEase = cubicBezier(0.23, 1, 0.32, 1);

export const motionPressScale = 0.97;
