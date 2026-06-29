import { ChevronRight } from "lucide-react-native";
import { type ReactNode } from "react";
import { Pressable, View, type GestureResponderEvent, type PressableProps } from "react-native";
import { AppText } from "./AppText";
import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";
import { triggerSelectionHaptic } from "../utils/haptics";

type ListRowProps = PressableProps & {
    title: string;
    subtitle?: string;
    meta?: ReactNode;
    leading?: ReactNode;
    trailing?: ReactNode;
    showChevron?: boolean;
    className?: string;
    titleClassName?: string;
};

export function ListRow({
    title,
    subtitle,
    meta,
    leading,
    trailing,
    showChevron = true,
    className,
    titleClassName,
    disabled,
    onPress,
    ...props
}: ListRowProps) {
    const colors = useThemeColors();

    const handlePress = (event: GestureResponderEvent) => {
        if (disabled) {
            return;
        }

        triggerSelectionHaptic();
        onPress?.(event);
    };

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            disabled={disabled}
            className={cn(
                "min-h-16 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 disabled:opacity-60",
                className,
            )}
            style={({ pressed }) => ({
                transform: [{ scale: pressed && !disabled ? 0.992 : 1 }],
            })}
            {...props}
            onPress={handlePress}
        >
            {leading ? <View className="shrink-0">{leading}</View> : null}

            <View className="min-w-0 flex-1 gap-1">
                <AppText
                    variant="body"
                    className={cn("text-base text-foreground", titleClassName)}
                    numberOfLines={2}
                >
                    {title}
                </AppText>

                {subtitle ? (
                    <AppText variant="caption" numberOfLines={2}>
                        {subtitle}
                    </AppText>
                ) : null}
            </View>

            {meta ? (
                typeof meta === "string" ? (
                    <AppText variant="meta" className="shrink-0 text-foreground/75">
                        {meta}
                    </AppText>
                ) : (
                    <View className="shrink-0">{meta}</View>
                )
            ) : null}

            {trailing}

            {showChevron ? (
                <View className="h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <ChevronRight
                        size={18}
                        color={colors.mutedForeground}
                        strokeWidth={2.25}
                    />
                </View>
            ) : null}
        </Pressable>
    );
}
