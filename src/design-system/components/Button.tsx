import {
    ActivityIndicator,
    Pressable,
    type PressableProps,
    View,
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

function getButtonTextColorClass(variant: ButtonVariant) {
    switch (variant) {
        case "primary":
            return "text-primary-foreground";
        case "danger":
            return "text-white";
        case "secondary":
            return "text-foreground";
        case "ghost":
            return "text-foreground";
        default:
            return "text-foreground";
    }
}

function getButtonSpinnerColor(
    colors: ReturnType<typeof useThemeColors>,
    variant: ButtonVariant,
) {
    switch (variant) {
        case "primary":
            return colors.primaryForeground;
        case "danger":
            return "#ffffff";
        case "secondary":
        case "ghost":
            return colors.foreground;
        default:
            return colors.foreground;
    }
}

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
    const textColorClassName = getButtonTextColorClass(variant);
    const spinnerColor = getButtonSpinnerColor(colors, variant);

    return (
        <Pressable
            accessibilityRole="button"
            disabled={isDisabled}
            className={cn(
                "w-full items-center justify-center rounded-xl active:opacity-80",
                isDisabled && "opacity-50",
                size === "sm" && "h-10 px-4",
                size === "md" && "h-12 px-5",
                size === "lg" && "h-14 px-6",
                variant === "primary" && "bg-primary",
                variant === "secondary" && "border border-border bg-surface",
                variant === "ghost" && "bg-transparent",
                variant === "danger" && "bg-danger",
                className,
            )}
            {...props}
        >
            <View className="flex-row items-center justify-center gap-2">
                {loading ? (
                    <ActivityIndicator color={spinnerColor} />
                ) : null}
                <AppText
                    variant="label"
                    className={cn(
                        "text-center text-base font-semibold",
                        textColorClassName,
                        textClassName,
                    )}
                    numberOfLines={1}
                >
                    {title}
                </AppText>
            </View>
        </Pressable>
    );
}
