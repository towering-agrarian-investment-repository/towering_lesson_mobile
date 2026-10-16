import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { Screen } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { openStore, type AppUpdateState } from "@/lib/update/app-update";
import { Button, Host, Text } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

type AppUpdateGateProps = {
    state: AppUpdateState;
    force: boolean;
    onContinue?: () => void;
};

export function AppUpdateGate({
    state,
    force,
    onContinue,
}: AppUpdateGateProps) {
    const {
        colors: uiColors,
        resolvedScheme: uiScheme,
        fontScale: uiFontScale,
    } = useTheme();
    const { t } = useTranslation();
    const title = force
        ? t("appUpdate.updateRequired")
        : t("appUpdate.updateAvailable");
    const description =
        state.message ??
        (force
            ? t("appUpdate.updateRequiredMessage")
            : t("appUpdate.updateAvailableMessage"));

    return (
        <Screen scroll={false} headerShown={false} contentClassName="flex-1">
            <View className="items-center pt-4">
                <HappyGolfLogo width={148} height={35} />
            </View>

            <View className="flex-1 justify-center gap-6">
                <View className="w-full items-center gap-3">
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={{
                                ...typography.h2, lineHeight: typography.h2.lineHeight * uiFontScale,
                                color: uiColors.foreground,
                                textAlign: "center" as const,
                                fontSize: typography.h2.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                            {title}
                        </Text>
                    </Host>
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={{
                                ...typography.muted, lineHeight: typography.muted.lineHeight * uiFontScale,
                                color: uiColors.mutedForeground,
                                textAlign: "center" as const,
                                fontSize:
                                    typography.muted.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                            {description}
                        </Text>
                    </Host>
                </View>

                <Host
                    matchContents={{ vertical: true }}
                    ignoreSafeArea="all"
                    colorScheme={uiScheme}
                    seedColor={uiColors.primary}
                    accessibilityLabel={t("appUpdate.updateApp")}
                    accessibilityState={{ disabled: false, busy: false }}
                    style={{ width: "100%" }}>
                    <Button
                        modifiers={
                            process.env.EXPO_OS === "ios"
                                ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                                : [
                                    fillMaxWidth(),
                                    defaultMinSize({ minHeight: 48 }),
                                ]
                        }
                        variant="text"
                        disabled={false}
                        onPress={() => {
                            void openStore(state);
                        }}
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
                            {t("appUpdate.updateApp")}
                        </Text>
                    </Button>
                </Host>

                {!force && onContinue ? (
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        colorScheme={uiScheme}
                        seedColor={uiColors.primary}
                        accessibilityLabel={t("appUpdate.continue")}
                        accessibilityState={{ disabled: false, busy: false }}
                        style={{ width: "100%" }}>
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
                            onPress={onContinue}
                            style={{
                                ...getNativeButtonStyle(
                                    uiColors,
                                    "outlined",
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
                                    color: uiColors.foreground,
                                    fontSize:
                                        typography.label.fontSize * uiFontScale,
                                }}
                            >
                                {t("appUpdate.continue")}
                            </Text>
                        </Button>
                    </Host>
                ) : null}

                <View className="gap-1">
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={{
                                ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                color: uiColors.mutedForeground,
                                textAlign: "center" as const,
                                fontSize:
                                    typography.caption.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                            {t("appUpdate.installedVersion", {
                                version: state.installedVersion,
                            })}
                        </Text>
                    </Host>
                    {state.latestVersion ? (
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                textStyle={{
                                    ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                    color: uiColors.mutedForeground,
                                    textAlign: "center" as const,
                                    fontSize:
                                        typography.caption.fontSize *
                                        uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                                {t("appUpdate.newVersion", {
                                    version: state.latestVersion,
                                })}
                            </Text>
                        </Host>
                    ) : null}
                </View>
            </View>
        </Screen>
    );
}

export function AppUpdateCheckingScreen() {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();

    return (
        <Screen scroll={false} headerShown={false} contentClassName="flex-1">
            <View className="items-center pt-4">
                <HappyGolfLogo width={148} height={35} />
            </View>
            <View className="flex-1 items-center justify-center gap-3">
                <ActivityIndicator />
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{ textAlign: "center",
                            ...typography.muted, lineHeight: typography.muted.lineHeight * uiFontScale,
                            color: uiColors.mutedForeground,
                            fontSize: typography.muted.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                        {t("appUpdate.checking")}
                    </Text>
                </Host>
            </View>
        </Screen>
    );
}
