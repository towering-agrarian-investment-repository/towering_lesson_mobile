import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { useTheme, useThemeColors } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Host, Text } from "@expo/ui";
import { Inbox } from "lucide-react-native";
import { View } from "react-native";

import { cn } from "../utils/cn";

type CompactEmptyStateProps = {
    title: string;
    message?: string;
    className?: string;
};

export function CompactEmptyState({
    title,
    message,
    className,
}: CompactEmptyStateProps) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const colors = useThemeColors();

    return (
        <View
            className={cn(
                "flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5",
                className,
            )}
        >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Inbox
                    size={18}
                    color={colors.mutedForeground}
                    strokeWidth={2.2}
                />
            </View>

            <View className="min-w-0 flex-1 gap-0.5">
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                            fontWeight: "600" as const,
                            color: uiColors.foreground,
                            fontSize: typography.label.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {title.trim()}
                    </Text>
                </Host>

                {message ? (
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            numberOfLines={2}
                            textStyle={{
                                ...typography.caption,
                                lineHeight: typography.subtext.lineHeight * uiFontScale,
                                color: uiColors.mutedForeground,
                                fontSize:
                                    typography.caption.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {message.trim()}
                        </Text>
                    </Host>
                ) : null}
            </View>
        </View>
    );
}
