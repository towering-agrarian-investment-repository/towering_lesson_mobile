import { View } from "react-native";
import { AppText } from "./AppText";
import { cn } from "../utils/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger";

type BadgeProps = {
    label: string;
    variant?: BadgeVariant;
    className?: string;
    textClassName?: string;
};

export function Badge({
    label,
    variant = "default",
    className,
    textClassName,
}: BadgeProps) {
    return (
        <View
            className={cn(
                "self-start rounded-full px-2.5 py-1",
                variant === "default" && "bg-muted",
                variant === "success" && "bg-success/10",
                variant === "warning" && "bg-warning/10",
                variant === "danger" && "bg-danger/10",
                className,
            )}
        >
            <AppText
                variant="caption"
                className={cn(
                    "font-medium",
                    variant === "default" && "text-muted-foreground",
                    variant === "success" && "text-success",
                    variant === "warning" && "text-warning",
                    variant === "danger" && "text-danger",
                    textClassName,
                )}
            >
                {label}
            </AppText>
        </View>
    );
}
