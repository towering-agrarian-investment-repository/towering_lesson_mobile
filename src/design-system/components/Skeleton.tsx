import type { ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { cn } from "../utils/cn";

type SkeletonProps = {
    className?: string;
    children?: ReactNode;
    style?: StyleProp<ViewStyle>;
};

const SKELETON_PULSE_STYLE = {
    animationName: {
        from: { opacity: 0.45 },
        to: { opacity: 1 },
    },
    animationDuration: "1040ms",
    animationIterationCount: "infinite" as const,
    animationDirection: "alternate" as const,
    animationTimingFunction: "ease-in-out" as const,
};

export function Skeleton({ className, children, style }: SkeletonProps) {
    const reduceMotion = useReducedMotion();

    return (
        <Animated.View
            style={[style, reduceMotion ? undefined : SKELETON_PULSE_STYLE]}
            className={cn("overflow-hidden rounded-xl bg-muted", className)}
        >
            {children}
        </Animated.View>
    );
}
