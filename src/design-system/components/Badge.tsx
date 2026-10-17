import { View } from "react-native";
import { cn } from "../utils/cn";
import type { ThemeColors } from "../utils/theme";
import { NativeText } from "./NativeText";

type BadgeProps = {
    label: string;
    variant?: "default" | "success" | "warning" | "danger";
    className?: string;
    color?: keyof ThemeColors;
};

export function Badge({
    label,
    variant = "default",
    className,
    color,
}: BadgeProps) {
    return (
        <View
            className={cn(
                "self-start rounded-md px-2.5 py-1",
                variant === "default" && "bg-muted",
                variant === "success" && "bg-success/10",
                variant === "warning" && "bg-warning/10",
                variant === "danger" && "bg-danger/10",
                className,
            )}
        >
            <NativeText variant="badge" color={color ?? (variant === "default" ? "mutedForeground" : variant)} wrap={false}>
                {label}
            </NativeText>
        </View>
    );
}
