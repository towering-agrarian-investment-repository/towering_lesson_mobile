import { MotiView } from "moti";
import { View } from "react-native";
import { cn } from "../utils/cn";

type SkeletonProps = {
    className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
    return (
        <MotiView
            from={{ opacity: 0.45 }}
            animate={{ opacity: 1 }}
            transition={{
                type: "timing",
                duration: 520,
                loop: true,
                repeatReverse: true,
            }}
            className={cn("overflow-hidden rounded-xl bg-muted", className)}
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
