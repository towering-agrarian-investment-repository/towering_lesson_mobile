import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Host, Text } from "@expo/ui";

import { useTranslation } from "react-i18next";
import { View } from "react-native";

type AvailabilityConflictNoticeProps = {
    message: string;
};

export function AvailabilityConflictNotice({
    message,
}: AvailabilityConflictNoticeProps) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();

    return (
        <View
            accessibilityRole="alert"
            className="gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-4"
        >
            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                <Text
                    textStyle={{
                        ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                        color: uiColors.warning,
                        fontSize: typography.label.fontSize * uiFontScale,
                    }}
                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                    {t("booking.timeNoLongerAvailableTitle")}
                </Text>
            </Host>
            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                <Text
                    textStyle={{
                        ...typography.body, lineHeight: typography.body.lineHeight * uiFontScale,
                        color: uiColors.foreground,
                        fontSize: typography.body.fontSize * uiFontScale,
                    }}
                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                    {message}
                </Text>
            </Host>
            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                <Text
                    textStyle={{
                        ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                        color: uiColors.mutedForeground,
                        fontSize: typography.caption.fontSize * uiFontScale,
                    }}
                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                    {t("booking.availabilityRefreshedMessage")}
                </Text>
            </Host>
        </View>
    );
}
