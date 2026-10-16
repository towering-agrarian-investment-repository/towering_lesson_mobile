import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Host, Text } from "@expo/ui";

import { ReactNode } from "react";
import { View } from "react-native";

export function FormFieldShell({
    label,
    errorMessage,
    helperText,
    children,
}: {
    label?: string;
    errorMessage?: string;
    helperText?: string;
    children: ReactNode;
}) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    return (
        <View>
            {label ? (
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                            color: uiColors.foreground + "d9",
                            fontSize: typography.label.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {label}
                    </Text>
                </Host>
            ) : null}

            {children}

            {errorMessage ? (
                <Host
                    matchContents={{ vertical: true }}
                    ignoreSafeArea="all"
                    style={{ width: "100%", marginTop: 4 }}
                >
                    <Text
                        textStyle={{
                            ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                            color: uiColors.danger,
                            fontSize: typography.meta.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {errorMessage}
                    </Text>
                </Host>
            ) : helperText ? (
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                            color: uiColors.mutedForeground,
                            fontSize: typography.caption.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {helperText}
                    </Text>
                </Host>
            ) : null}
        </View>
    );
}
