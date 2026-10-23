import { View } from "react-native";
import { cn } from "../utils/cn";
import type { ThemeColors } from "../utils/theme";
import { AppText } from "./AppText";

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
            <AppText variant="badge" color={color ?? (variant === "default" ? "mutedForeground" : variant)} wrap={false}>
                {label}
            </AppText>
        </View>
    );
}
