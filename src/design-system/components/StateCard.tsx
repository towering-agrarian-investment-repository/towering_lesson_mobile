import { NativeText } from "./NativeText";
import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { useTheme } from "@/design-system/utils/theme";
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
    const { colors, resolvedScheme: uiScheme, fontScale: uiFontScale } = useTheme();

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
                <NativeText variant="h3" color="danger" align="center">
                    {title}
                </NativeText>
                <NativeText variant="subtext" color="mutedForeground" align="center" style={{ marginTop: 12 }}>
                    {message}
                </NativeText>
                {actionLabel && onAction ? (
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        colorScheme={uiScheme}
                        seedColor={colors.primary}
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
                                    colors,
                                    "filled",
                                    false,
                                    colors.primary,
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
                                    color: colors.primaryForeground,
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
    const { colors, resolvedScheme: uiScheme, fontScale: uiFontScale } = useTheme();

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
                <NativeText variant="h3" align="center">
                    {title}
                </NativeText>
                {message ? (
                    <NativeText variant="subtext" color="mutedForeground" align="center" style={{ marginTop: 12 }}>
                        {message}
                    </NativeText>
                ) : null}
                {actionLabel && onAction ? (
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        colorScheme={uiScheme}
                        seedColor={colors.primary}
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
                                    colors,
                                    "filled",
                                    false,
                                    colors.primary,
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
                                    color: colors.primaryForeground,
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
