import { NativeText } from "@/design-system/components/NativeText";
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
import { Download } from "lucide-react-native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

type AppUpdateGateProps = {
    state: AppUpdateState;
    force: boolean;
    onContinue?: () => void;
    isCheckingAgain: boolean;
    onCheckAgain: () => Promise<boolean>;
};

export function AppUpdateGate({
    state,
    force,
    onContinue,
    isCheckingAgain,
    onCheckAgain,
}: AppUpdateGateProps) {
    const {
        colors: uiColors,
        resolvedScheme: uiScheme,
        fontScale: uiFontScale,
    } = useTheme();
    const { t } = useTranslation();
    const [isOpeningStore, setIsOpeningStore] = useState(false);
    const [storeOpenFailed, setStoreOpenFailed] = useState(false);
    const [checkFailed, setCheckFailed] = useState(false);
    const openingStore = useRef(false);
    const handleOpenStore = async () => {
        if (openingStore.current) return;
        openingStore.current = true;
        setIsOpeningStore(true);
        setStoreOpenFailed(false);
        try {
            setStoreOpenFailed(!await openStore(state));
        } finally {
            openingStore.current = false;
            setIsOpeningStore(false);
        }
    };
    const handleCheckAgain = async () => {
        setCheckFailed(false);
        setCheckFailed(!await onCheckAgain());
    };
    const updateLabel = isOpeningStore
        ? t("appUpdate.openingStore")
        : storeOpenFailed ? t("common.refreshTryAgain") : t("appUpdate.updateApp");
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
                    <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10" accessible={false}>
                        <Download size={28} color={uiColors.primary} strokeWidth={2} />
                    </View>
                    <NativeText variant="h2" align="center">
                        {title}
                    </NativeText>
                    <NativeText variant="muted" color="mutedForeground" align="center">
                        {description}
                    </NativeText>
                </View>

                <View className="gap-2">
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        colorScheme={uiScheme}
                        seedColor={uiColors.primary}
                        accessibilityLabel={updateLabel}
                        accessibilityState={{ disabled: isOpeningStore, busy: isOpeningStore }}
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
                            disabled={isOpeningStore}
                            onPress={() => {
                                void handleOpenStore();
                            }}
                            style={{
                                ...getNativeButtonStyle(
                                    uiColors,
                                    "filled",
                                    isOpeningStore,
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
                                {updateLabel}
                            </Text>
                        </Button>
                    </Host>

                    {storeOpenFailed ? (
                        <NativeText variant="subtext" color="danger" align="center">
                            {t("appUpdate.openStoreError")}
                        </NativeText>
                    ) : null}

                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        colorScheme={uiScheme}
                        seedColor={uiColors.primary}
                        accessibilityLabel={t("appUpdate.checkAgain")}
                        accessibilityState={{ disabled: isCheckingAgain, busy: isCheckingAgain }}
                        style={{ width: "100%" }}>
                        <Button
                            modifiers={
                                process.env.EXPO_OS === "ios"
                                    ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                                    : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })]
                            }
                            variant="text"
                            disabled={isCheckingAgain}
                            onPress={() => { void handleCheckAgain(); }}
                            style={getNativeButtonStyle(uiColors, "text", isCheckingAgain)}>
                            <Text
                                modifiers={
                                    process.env.EXPO_OS === "ios"
                                        ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                                        : [fillMaxWidth()]
                                }
                                textStyle={{
                                    ...typography.subtext,
                                    lineHeight: typography.subtext.lineHeight * uiFontScale,
                                    fontSize: typography.subtext.fontSize * uiFontScale,
                                    fontWeight: "500",
                                    textAlign: "center",
                                    color: uiColors.primary,
                                }}>
                                {isCheckingAgain ? t("appUpdate.checking") : t("appUpdate.checkAgain")}
                            </Text>
                        </Button>
                    </Host>

                    {checkFailed ? (
                        <NativeText variant="subtext" color="danger" align="center">
                            {t("appUpdate.checkFailed")}
                        </NativeText>
                    ) : null}
                </View>

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
                    <NativeText variant="caption" color="mutedForeground" align="center">
                        {t("appUpdate.installedVersion", {
                            version: state.installedVersion,
                        })}
                    </NativeText>
                    {state.latestVersion ? (
                        <View className="flex-row flex-wrap items-center justify-center gap-1">
                            <NativeText variant="caption" color="mutedForeground" wrap={false}>
                                {t("appUpdate.newVersion", { version: "" }).trimEnd()}
                            </NativeText>
                            <NativeText variant="caption" color="primary" wrap={false} textStyle={{ fontWeight: "700" }}>
                                {state.latestVersion}
                            </NativeText>
                        </View>
                    ) : null}
                </View>
            </View>
        </Screen>
    );
}

export function AppUpdateCheckingScreen() {

    const { t } = useTranslation();

    return (
        <Screen scroll={false} headerShown={false} contentClassName="flex-1">
            <View className="items-center pt-4">
                <HappyGolfLogo width={148} height={35} />
            </View>
            <View className="flex-1 items-center justify-center gap-3">
                <ActivityIndicator />
                <NativeText variant="muted" color="mutedForeground" align="center">
                    {t("appUpdate.checking")}
                </NativeText>
            </View>
        </Screen>
    );
}
