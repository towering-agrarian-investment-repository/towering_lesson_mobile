import { AppText } from "./AppText";
import { useTheme } from "@/design-system/utils/theme";
import { ChevronRight } from "lucide-react-native";
import { type ReactNode } from "react";
import {
    Pressable,
    View,
    type GestureResponderEvent,
    type PressableProps,
    type TextStyle,
} from "react-native";
import { cn } from "../utils/cn";
import { triggerSelectionHaptic } from "../utils/haptics";

type ListRowProps = PressableProps & {
    title: string;
    titleContent?: ReactNode;
    subtitle?: string;
    meta?: ReactNode;
    leading?: ReactNode;
    trailing?: ReactNode;
    showChevron?: boolean;
    className?: string;
    titleStyle?: TextStyle;
};

// Match NativeWind's gap-1 (14-point native rem / 16px browser rem).
const TEXT_GAP = process.env.EXPO_OS === "web" ? 4 : 3.5;

export function ListRow({
    title,
    titleContent,
    subtitle,
    meta,
    leading,
    trailing,
    showChevron = true,
    className,
    titleStyle,
    disabled,
    onPress,
    ...props
}: ListRowProps) {
    const { colors: uiColors } = useTheme();

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

            {titleContent ? (
                <View className="min-w-0 flex-1">{titleContent}</View>
            ) : (
                <View style={{ flex: 1, minWidth: 0, gap: TEXT_GAP }}>
                    <AppText variant="body" numberOfLines={2} textStyle={titleStyle}>
                        {title}
                    </AppText>
                    {subtitle ? (
                        <AppText variant="caption" color="mutedForeground" numberOfLines={2}>
                            {subtitle}
                        </AppText>
                    ) : null}
                </View>
            )}

            {meta ? (
                typeof meta === "string" ? (
                    <AppText
                        variant="meta"
                        wrap={false}
                        className="text-foreground/75"
                        style={{ flexShrink: 0 }}
                    >
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
                        color={uiColors.mutedForeground}
                        strokeWidth={2.25}
                    />
                </View>
            ) : null}
        </Pressable>
    );
}
