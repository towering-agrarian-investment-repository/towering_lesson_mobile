import { getNativeButtonStyle, getNativeButtonTextStyle } from "@/design-system/utils/native-button-styles";
import { useTheme } from "@/design-system/utils/theme";
import { Button, Host, RNHostView, Row, Spacer, Text } from "@expo/ui";
import { defaultMinSize, fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { contentShape, frame, shapes } from "@expo/ui/swift-ui/modifiers";
import LogOut from "lucide-react-native/icons/log-out";
import { useTranslation } from "react-i18next";

const isIOS = process.env.EXPO_OS === "ios";
const signOutButtonSize = isIOS
    ? [frame({ maxWidth: Infinity, minHeight: 56 })]
    : [fillMaxWidth(), defaultMinSize({ minHeight: 56 })];
const signOutTextSize = isIOS
    ? [frame({ maxWidth: Infinity, minHeight: 56, alignment: "center" }), contentShape(shapes.rectangle())]
    : [fillMaxWidth()];

export function ProfileSignOutButton({ isSigningOut, onPress }: { isSigningOut: boolean; onPress: () => void }) {
    const { colors, fontScale } = useTheme();
    const { t } = useTranslation();

    return (
        <Host
            matchContents={{ vertical: true }}
            ignoreSafeArea="all"
            seedColor={colors.danger}
            style={{ width: "100%" }}
            accessibilityState={{
                disabled: isSigningOut,
                busy: isSigningOut,
            }}
        >
            <Button
                style={{
                    ...getNativeButtonStyle(colors, "text", isSigningOut),
                    backgroundColor: colors.danger,
                }}
                modifiers={signOutButtonSize}
                variant="text"
                disabled={isSigningOut}
                onPress={onPress}
            >
                <Row spacing={8} alignment="center" style={{ paddingHorizontal: 16 }} modifiers={signOutTextSize}>
                    <Spacer flexible />
                    <RNHostView matchContents>
                        <LogOut size={18} color={colors.primaryForeground} />
                    </RNHostView>
                    <Text
                        textStyle={{
                            ...getNativeButtonTextStyle(colors, "filled", fontScale, colors.danger),
                            color: colors.primaryForeground,
                        }}
                    >
                        {isSigningOut ? t("profile.loggingOut") : t("profile.logOut")}
                    </Text>
                    <Spacer flexible />
                </Row>
            </Button>
        </Host>
    );
}
