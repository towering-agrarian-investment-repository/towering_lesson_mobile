import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

type SkeletonProps = {
    className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
    const opacity = useRef(new Animated.Value(0.45)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.45,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        );

        animation.start();

        return () => {
            animation.stop();
        };
    }, [opacity]);

    return (
        <Animated.View
            style={{ opacity }}
            className={`overflow-hidden rounded-2xl bg-gray-200 ${className}`}
        />
    );
}

export function SkeletonLines({
    lines = 3,
}: {
    lines?: number;
}) {
    return (
        <View className="gap-3">
            {Array.from({ length: lines }, (_, index) => (
                <Skeleton
                    key={index}
                    className={index === lines - 1 ? "h-4 w-2/3" : "h-4 w-full"}
                />
            ))}
        </View>
    );
}
