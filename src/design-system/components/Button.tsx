import {
    ActivityIndicator,
    Pressable,
    type PressableProps,
} from "react-native";
import { AppText } from "./AppText";
import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = PressableProps & {
    title: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    className?: string;
    textClassName?: string;
};

export function Button({
    title,
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    className,
    textClassName,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;
    const colors = useThemeColors();

    return (
        <Pressable
            accessibilityRole="button"
            disabled={isDisabled}
            className={cn(
                "items-center justify-center rounded-xl active:opacity-80",
                isDisabled && "opacity-50",
                size === "sm" && "h-10 px-3",
                size === "md" && "h-12 px-4",
                size === "lg" && "h-14 px-6",
                variant === "primary" && "bg-primary",
                variant === "secondary" && "border border-border bg-surface",
                variant === "ghost" && "bg-transparent",
                variant === "danger" && "bg-danger",
                className,
            )}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={
                        variant === "primary"
                            ? colors.primaryForeground
                            : variant === "danger"
                              ? colors.primaryForeground
                              : undefined
                    }
                />
            ) : (
                <AppText
                    className={cn(
                        "text-base font-semibold",
                        variant === "primary" && "text-primary-foreground",
                        variant === "secondary" && "text-foreground",
                        variant === "ghost" && "text-foreground",
                        variant === "danger" && "text-primary-foreground",
                        textClassName,
                    )}
                >
                    {title}
                </AppText>
            )}
        </Pressable>
    );
}
