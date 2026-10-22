import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { cn } from "../utils/cn";

type SkeletonProps = {
    className?: string;
    children?: ReactNode;
    style?: StyleProp<ViewStyle>;
};

export function Skeleton({ className, children, style }: SkeletonProps) {
    const reduceMotion = useReducedMotion();

    return (
        <Animated.View
            style={[style,
                reduceMotion
                    ? undefined
                    : {
                          animationName: {
                              from: { opacity: 0.45 },
                              to: { opacity: 1 },
                          },
                          animationDuration: "1040ms",
                          animationIterationCount: "infinite",
                          animationDirection: "alternate",
                          animationTimingFunction: "ease-in-out",
                      },
            ]}
            className={cn("overflow-hidden rounded-xl bg-muted", className)}
        >
            {children}
        </Animated.View>
    );
}

export function SkeletonLines({ lines = 3 }: { lines?: number }) {
    return (
        <Skeleton className="gap-3 rounded-none bg-transparent">
            {Array.from({ length: lines }, (_, index) => (
                <View
                    key={index}
                    className={cn("rounded-xl bg-muted", index === lines - 1 ? "h-4 w-2/3" : "h-4 w-full")}
                />
            ))}
        </Skeleton>
    );
}
