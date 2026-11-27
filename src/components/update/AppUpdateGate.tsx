import { AppText } from "@/design-system/components/AppText";
import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { ActionButton, Screen } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { openStore, type AppUpdateState } from "@/lib/update/app-update";
import Download from "lucide-react-native/icons/download";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type AppUpdateGateProps = {
    state: AppUpdateState;
    force: boolean;
    onContinue?: () => void;
    isCheckingAgain: boolean;
    onCheckAgain: () => Promise<boolean>;
};

export function AppUpdateGate({ state, force, onContinue, isCheckingAgain, onCheckAgain }: AppUpdateGateProps) {
    const { colors: uiColors } = useTheme();
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
            setStoreOpenFailed(!(await openStore(state)));
        } finally {
            openingStore.current = false;
            setIsOpeningStore(false);
        }
    };
    const handleCheckAgain = async () => {
        setCheckFailed(false);
        setCheckFailed(!(await onCheckAgain()));
    };
    const updateLabel = isOpeningStore
        ? t("appUpdate.openingStore")
        : storeOpenFailed
          ? t("common.refreshTryAgain")
          : t("appUpdate.updateApp");
    const title = force ? t("appUpdate.updateRequired") : t("appUpdate.updateAvailable");
    const description =
        state.message ?? (force ? t("appUpdate.updateRequiredMessage") : t("appUpdate.updateAvailableMessage"));

    return (
        <Screen headerShown={false} contentClassName="grow">
            <View className="items-center pt-4">
                <HappyGolfLogo width={148} height={35} primaryColor={uiColors.primary} accentColor={uiColors.warning} />
            </View>

            <View className="flex-1 justify-center gap-6">
                <View className="w-full items-center gap-3">
                    <View
                        className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"
                        accessible={false}
                    >
                        <Download size={28} color={uiColors.primary} strokeWidth={2} />
                    </View>
                    <AppText variant="h2" align="center">
                        {title}
                    </AppText>
                    <AppText variant="body" color="mutedForeground" align="center">
                        {description}
                    </AppText>
                </View>

                <View className="gap-2">
                    <ActionButton
                        label={updateLabel}
                        disabled={isOpeningStore}
                        loading={isOpeningStore}
                        onPress={() => {
                            void handleOpenStore();
                        }}
                    />

                    {storeOpenFailed ? (
                        <AppText variant="subtext" color="danger" align="center">
                            {t("appUpdate.openStoreError")}
                        </AppText>
                    ) : null}

                    <ActionButton
                        label={isCheckingAgain ? t("appUpdate.checking") : t("appUpdate.checkAgain")}
                        accessibilityLabel={t("appUpdate.checkAgain")}
                        appearance="text"
                        tone="primary"
                        disabled={isCheckingAgain}
                        loading={isCheckingAgain}
                        onPress={() => {
                            void handleCheckAgain();
                        }}
                    />

                    {checkFailed ? (
                        <AppText variant="subtext" color="danger" align="center">
                            {t("appUpdate.checkFailed")}
                        </AppText>
                    ) : null}
                </View>

                {!force && onContinue ? (
                    <ActionButton label={t("appUpdate.continue")} appearance="outlined" onPress={onContinue} />
                ) : null}

                <View className="gap-1">
                    <AppText variant="caption" color="mutedForeground" align="center">
                        {t("appUpdate.installedVersion", {
                            version: state.installedVersion,
                        })}
                    </AppText>
                    {state.latestVersion ? (
                        <View className="flex-row flex-wrap items-center justify-center gap-1">
                            <AppText variant="caption" color="mutedForeground" wrap={false}>
                                {t("appUpdate.newVersion", { version: "" }).trimEnd()}
                            </AppText>
                            <AppText variant="caption" color="primary" wrap={false} textStyle={{ fontWeight: "700" }}>
                                {state.latestVersion}
                            </AppText>
                        </View>
                    ) : null}
                </View>
            </View>
        </Screen>
    );
}
