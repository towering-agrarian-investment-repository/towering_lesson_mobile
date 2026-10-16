import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { useTheme, useThemeColors } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Host, Text, type TextProps } from "@expo/ui";
import { ChevronRight } from "lucide-react-native";
import { type ReactNode } from "react";
import {
    Pressable,
    View,
    type GestureResponderEvent,
    type PressableProps,
} from "react-native";

import { cn } from "../utils/cn";
import { triggerSelectionHaptic } from "../utils/haptics";

type ListRowProps = PressableProps & {
    title: string;
    subtitle?: string;
    meta?: ReactNode;
    leading?: ReactNode;
    trailing?: ReactNode;
    showChevron?: boolean;
    className?: string;
    titleStyle?: TextProps["textStyle"];
};

export function ListRow({
    title,
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
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
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        numberOfLines={2}
                        textStyle={{
                            ...typography.body, lineHeight: typography.body.lineHeight * uiFontScale,
                            fontSize: typography.body.fontSize * uiFontScale,
                            color: uiColors.foreground,
                            ...titleStyle,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {title}
                    </Text>
                </Host>

                {subtitle ? (
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            numberOfLines={2}
                            textStyle={{
                                ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                color: uiColors.mutedForeground,
                                fontSize:
                                    typography.caption.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {subtitle}
                        </Text>
                    </Host>
                ) : null}
            </View>

            {meta ? (
                typeof meta === "string" ? (
                    <Host
                        matchContents
                        ignoreSafeArea="all"
                        style={{ flexShrink: 0 }}
                    >
                        <Text
                            textStyle={{
                                ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                                color: uiColors.foreground + "bf",
                                fontSize:
                                    typography.meta.fontSize * uiFontScale,
                            }}
                        >
                            {meta}
                        </Text>
                    </Host>
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
