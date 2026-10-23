import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { useTheme } from "@/design-system/utils/theme";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { Button, Host, Text } from "@expo/ui";
import { semantics } from "@expo/ui/jetpack-compose/modifiers";
import { accessibilityLabel } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export function ProfileHeaderActions() {
    const { colors, fontScale, resolvedScheme } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const { isLocked, runWithNavigationLock } = useNavigationLock();

    const editLabel = t("profile.editPersonalInformation");

    return (
        <Host ignoreSafeArea="all" colorScheme={resolvedScheme} style={{ width: 68, height: 48 }}>
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
        </Host>
    );
}
