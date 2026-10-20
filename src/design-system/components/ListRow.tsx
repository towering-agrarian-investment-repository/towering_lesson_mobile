import { NativeText } from "./NativeText";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Column, Host, Text, type TextProps } from "@expo/ui";
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
    titleContent?: ReactNode;
    subtitle?: string;
    meta?: ReactNode;
    leading?: ReactNode;
    trailing?: ReactNode;
    showChevron?: boolean;
    className?: string;
    titleStyle?: TextProps["textStyle"];
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();

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
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ flex: 1, minWidth: 0 }}>
                    <Column spacing={TEXT_GAP} alignment="start" modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
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
                        {subtitle ? (
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
                        ) : null}
                    </Column>
                </Host>
            )}

            {meta ? (
                typeof meta === "string" ? (
                    <NativeText
                        variant="meta"
                        wrap={false}
                        style={{ flexShrink: 0 }}
                        textStyle={{ color: uiColors.foreground + "bf" }}
                    >
                        {meta}
                    </NativeText>
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
