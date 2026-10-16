import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { useTheme, useThemeColors } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Button, Host, Text } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { CircleAlert, Inbox } from "lucide-react-native";
import { View } from "react-native";

export function ErrorState({
    title,
    message,
    actionLabel,
    onAction,
}: {
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    const {
        colors: uiColors,
        resolvedScheme: uiScheme,
        fontScale: uiFontScale,
    } = useTheme();
    const colors = useThemeColors();

    return (
        <StateCardShell>
            <View className="w-full items-center">
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-danger/10">
                    <CircleAlert
                        size={28}
                        color={colors.danger}
                        strokeWidth={2.4}
                    />
                </View>
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale,
                            textAlign: "center" as const,
                            color: uiColors.danger,
                            fontSize: typography.h3.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                        {title}
                    </Text>
                </Host>
                <Host
                    matchContents={{ vertical: true }}
                    ignoreSafeArea="all"
                    style={{ width: "100%", marginTop: 12 }}
                >
                    <Text
                        textStyle={{
                            ...typography.subtext, lineHeight: typography.subtext.lineHeight * uiFontScale,
                            textAlign: "center" as const,
                            color: uiColors.mutedForeground,
                            fontSize: typography.subtext.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                        {message}
                    </Text>
                </Host>
                {actionLabel && onAction ? (
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        colorScheme={uiScheme}
                        seedColor={uiColors.primary}
                        style={{ marginTop: 20, borderRadius: 12, width: "100%" }}
                        accessibilityLabel={actionLabel}
                        accessibilityState={{ disabled: false, busy: false }}
                    >
                        <Button
                            modifiers={
                                process.env.EXPO_OS === "ios"
                                    ? [
                                        frame({
                                            maxWidth: Infinity,
                                            minHeight: 48,
                                        }),
                                    ]
                                    : [
                                        fillMaxWidth(),
                                        defaultMinSize({ minHeight: 48 }),
                                    ]
                            }
                            variant="text"
                            disabled={false}
                            onPress={onAction}
                            style={{
                                ...getNativeButtonStyle(
                                    uiColors,
                                    "filled",
                                    false,
                                    uiColors.primary,
                                ), ...{ borderRadius: 12 }
                            }}
                        >
                            <Text
                                modifiers={
                                    process.env.EXPO_OS === "ios"
                                        ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                                        : [fillMaxWidth()]
                                }
                                textStyle={{
                                    ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                    textAlign: "center",
                                    color: uiColors.primaryForeground,
                                    fontSize:
                                        typography.label.fontSize * uiFontScale,
                                }}
                            >
                                {actionLabel}
                            </Text>
                        </Button>
                    </Host>
                ) : null}
            </View>
        </StateCardShell>
    );
}

export function EmptyState({
    title,
    message,
    actionLabel,
    onAction,
}: {
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    const {
        colors: uiColors,
        resolvedScheme: uiScheme,
        fontScale: uiFontScale,
    } = useTheme();
    const colors = useThemeColors();

    return (
        <StateCardShell>
            <View className="w-full items-center">
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Inbox
                        size={28}
                        color={colors.mutedForeground}
                        strokeWidth={2.2}
                    />
                </View>
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale,
                            textAlign: "center" as const,
                            color: uiColors.foreground,
                            fontSize: typography.h3.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                        {title}
                    </Text>
                </Host>
                {message ? (
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        style={{ width: "100%", marginTop: 12 }}
                    >
                        <Text
                            textStyle={{
                                ...typography.subtext, lineHeight: typography.subtext.lineHeight * uiFontScale,
                                textAlign: "center" as const,
                                color: uiColors.mutedForeground,
                                fontSize:
                                    typography.subtext.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                            {message}
                        </Text>
                    </Host>
                ) : null}
                {actionLabel && onAction ? (
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        colorScheme={uiScheme}
                        seedColor={uiColors.primary}
                        style={{ marginTop: 20, borderRadius: 12, width: "100%" }}
                        accessibilityLabel={actionLabel}
                        accessibilityState={{ disabled: false, busy: false }}
                    >
                        <Button
                            modifiers={
                                process.env.EXPO_OS === "ios"
                                    ? [
                                        frame({
                                            maxWidth: Infinity,
                                            minHeight: 48,
                                        }),
                                    ]
                                    : [
                                        fillMaxWidth(),
                                        defaultMinSize({ minHeight: 48 }),
                                    ]
                            }
                            variant="text"
                            disabled={false}
                            onPress={onAction}
                            style={{
                                ...getNativeButtonStyle(
                                    uiColors,
                                    "filled",
                                    false,
                                    uiColors.primary,
                                ), ...{ borderRadius: 12 }
                            }}
                        >
                            <Text
                                modifiers={
                                    process.env.EXPO_OS === "ios"
                                        ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                                        : [fillMaxWidth()]
                                }
                                textStyle={{
                                    ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                    textAlign: "center",
                                    color: uiColors.primaryForeground,
                                    fontSize:
                                        typography.label.fontSize * uiFontScale,
                                }}
                            >
                                {actionLabel}
                            </Text>
                        </Button>
                    </Host>
                ) : null}
            </View>
        </StateCardShell>
    );
}

function StateCardShell({ children }: { children: React.ReactNode }) {
    return (
        <View className="grow items-center justify-center bg-background px-6 py-5">
            {children}
        </View>
    );
}
