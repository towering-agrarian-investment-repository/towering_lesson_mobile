import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { useTheme } from "@/design-system/utils/theme";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { showAppToast } from "@/lib/toast/toast";
import { Button, Host, RNHostView, Row, Text } from "@expo/ui";
import { semantics } from "@expo/ui/jetpack-compose/modifiers";
import { accessibilityLabel } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { Moon, Smartphone, Sun } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export function ProfileHeaderActions() {
    const { colors, fontScale, isReady, preference, resolvedScheme, setPreference } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const selectedPreference = useRef(preference);
    useEffect(() => {
        selectedPreference.current = preference;
    }, [preference]);
    const nextPreference = preference === "system" ? "light"
        : preference === "light" ? "dark" : "system";

    const toggleTheme = () => {
        if (!isReady) return;
        const next = selectedPreference.current === "system" ? "light"
            : selectedPreference.current === "light" ? "dark" : "system";
        selectedPreference.current = next;
        void setPreference(next).catch(() => {
            showAppToast({ message: t("common.requestError"), type: "error" });
        });
    };

    const editLabel = t("profile.editPersonalInformation");
    const themeLabel = t(nextPreference === "system" ? "profile.followDeviceSetting"
        : nextPreference === "light" ? "profile.useLightAppearance" : "profile.useDarkAppearance");
    const themeDisabled = !isReady;
    const ThemeIcon = preference === "system" ? Smartphone : preference === "light" ? Sun : Moon;
    const iconClassName = process.env.EXPO_OS === "ios"
        ? "h-12 w-12 items-center justify-center"
        : "h-6 w-6 items-center justify-center";

    return (
        <Host ignoreSafeArea="all" colorScheme={resolvedScheme} style={{ width: 116, height: 48 }}>
            <Row alignment="center">
                <Button
                    variant="text"
                    disabled={isLocked}
                    onPress={() => {
                        runWithNavigationLock(() => router.push("/profile/edit"));
                    }}
                    style={{
                        ...getNativeButtonStyle(colors, "text", isLocked),
                        width: 68,
                        height: 48,
                    }}
                    modifiers={process.env.EXPO_OS === "ios"
                        ? [accessibilityLabel(editLabel)]
                        : [semantics({ contentDescription: editLabel })]}
                >
                    <Text textStyle={{ color: colors.foreground, fontSize: 16 * fontScale, fontWeight: "600", textAlign: "center" }}>
                        {t("profile.editAction")}
                    </Text>
                </Button>
                <Button
                    variant="text"
                    disabled={themeDisabled}
                    onPress={toggleTheme}
                    style={{
                        ...getNativeButtonStyle(colors, "text", themeDisabled),
                        width: 48,
                        height: 48,
                    }}
                    modifiers={process.env.EXPO_OS === "ios"
                        ? [accessibilityLabel(themeLabel)]
                        : [semantics({ contentDescription: themeLabel })]}
                >
                    <RNHostView matchContents>
                        <View
                            accessible={false}
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                            className={iconClassName}
                        >
                            <ThemeIcon size={22} color={colors.foreground} />
                        </View>
                    </RNHostView>
                </Button>
            </Row>
        </Host>
    );
}
