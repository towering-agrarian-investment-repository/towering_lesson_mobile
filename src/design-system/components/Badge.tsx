import { View } from "react-native";
import { cn } from "../utils/cn";
import { AppText, type AppTextColor } from "./AppText";

type BadgeProps = {
    label: string;
    variant?: "default" | "primary" | "success" | "warning" | "danger";
    size?: "sm" | "md";
    className?: string;
    color?: AppTextColor;
};

const variantClasses = {
    default: "bg-muted",
    primary: "bg-primary/10",
    success: "bg-success/10",
    warning: "bg-warning/10",
    danger: "bg-danger/10",
} as const;

const variantTextColors: Record<NonNullable<BadgeProps["variant"]>, AppTextColor> = {
    default: "mutedForeground",
    primary: "primary",
    success: "success",
    warning: "warning",
    danger: "danger",
};

export function Badge({ label, variant = "default", size = "md", className, color }: BadgeProps) {
    return (
        <View
            className={cn(
                "self-start rounded-md",
                size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1",
                variantClasses[variant],
                className,
            )}
        >
            <AppText
                variant="badge"
                color={color ?? variantTextColors[variant]}
                wrap={false}
                maxFontSizeMultiplier={1.35}
            >
                {label}
            </AppText>
        </View>
    );
}
