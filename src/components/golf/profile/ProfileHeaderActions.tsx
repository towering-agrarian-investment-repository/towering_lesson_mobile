import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { useTheme } from "@/design-system/utils/theme";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { Button, Host, Text } from "@expo/ui";
import { defaultMinSize, semantics } from "@expo/ui/jetpack-compose/modifiers";
import { accessibilityLabel, contentShape, frame, shapes } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export function ProfileHeaderActions() {
    const { colors, fontScale, resolvedScheme } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const { isLocked, runWithNavigationLock } = useNavigationLock();

    const editLabel = t("profile.editPersonalInformation");

    return (
        <Host
            matchContents
            ignoreSafeArea="all"
            colorScheme={resolvedScheme}
            style={{ minWidth: 68, minHeight: 48 }}
        >
            <Button
                variant="text"
                disabled={isLocked}
                onPress={() => {
                    runWithNavigationLock(() => router.push("/profile/edit"));
                }}
                style={getNativeButtonStyle(colors, "text", isLocked)}
                modifiers={process.env.EXPO_OS === "ios"
                    ? [accessibilityLabel(editLabel), frame({ minWidth: 68, minHeight: 48 })]
                    : [semantics({ contentDescription: editLabel }), defaultMinSize({ minWidth: 68, minHeight: 48 })]}
            >
                <Text
                    modifiers={process.env.EXPO_OS === "ios"
                        ? [frame({ minWidth: 68, minHeight: 48 }), contentShape(shapes.rectangle())]
                        : undefined}
                    textStyle={{ color: colors.foreground, fontSize: 16 * fontScale, fontWeight: "600", textAlign: "center" }}>
                    {t("profile.editAction")}
                </Text>
            </Button>
        </Host>
    );
}
