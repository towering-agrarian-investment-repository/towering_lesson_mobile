import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Host, Text } from "@expo/ui";

import { cn } from "../utils/cn";

type InlineStateTone = "neutral" | "danger";

type InlineStateProps = {
    title: string;
    message?: string;
    tone?: InlineStateTone;
    className?: string;
};

export function InlineState({
    title,
    message,
    tone = "neutral",
    className,
}: InlineStateProps) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    return (
        <View className={cn("px-1 py-2", className)}>
            <Host
                matchContents={{ vertical: true }}
                ignoreSafeArea="all"
                style={{ width: "100%" }}
            >
                <Text
                    textStyle={{
                        ...typography.meta,
                        textAlign: "center" as const,
                        lineHeight: typography.body.lineHeight * uiFontScale,
                        color:
                            tone === "danger"
                                ? uiColors.danger
                                : uiColors.mutedForeground,
                        fontSize: typography.meta.fontSize * uiFontScale,
                    }}
                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                    {message ? `${title}. ${message}` : title}
                </Text>
            </Host>
        </View>
    );
}
