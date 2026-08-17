import { AppText, Button, Screen } from "@/design-system";
import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { openStore, type AppUpdateState } from "@/lib/update/app-update";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

type AppUpdateGateProps = {
    state: AppUpdateState;
    force: boolean;
    onContinue?: () => void;
};

export function AppUpdateGate({ state, force, onContinue }: AppUpdateGateProps) {
    const { t } = useTranslation();
    const title = force ? t("appUpdate.updateRequired") : t("appUpdate.updateAvailable");
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
                <View className="items-center gap-3">
                    <AppText variant="h2" className="text-center">
                        {title}
                    </AppText>
                    <AppText variant="muted" className="text-center">
                        {description}
                    </AppText>
                </View>

                <Button
                    title={t("appUpdate.updateApp")}
                    onPress={() => {
                        void openStore(state);
                    }}
                />

                {!force && onContinue ? (
                    <Button title={t("appUpdate.continue")} variant="secondary" onPress={onContinue} />
                ) : null}

                <View className="gap-1">
                    <AppText variant="caption" className="text-center">
                        {t("appUpdate.installedVersion", { version: state.installedVersion })}
                    </AppText>
                    {state.latestVersion ? (
                        <AppText variant="caption" className="text-center">
                            {t("appUpdate.newVersion", { version: state.latestVersion })}
                        </AppText>
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
                <AppText variant="muted">{t("appUpdate.checking")}</AppText>
            </View>
        </Screen>
    );
}
