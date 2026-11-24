import { PendingBottomSheet } from "@/design-system/components/PendingBottomSheet";
import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Button, Column, RNHostView, Row, Spacer, Text } from "@expo/ui";
import { defaultMinSize, fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { contentShape, frame, shapes } from "@expo/ui/swift-ui/modifiers";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";

const isIOS = process.env.EXPO_OS === "ios";
const fullWidth = isIOS ? [frame({ maxWidth: Infinity })] : [fillMaxWidth()];
const buttonSize = isIOS
    ? [frame({ maxWidth: Infinity, minHeight: 48 })]
    : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })];
const buttonInnerSize = isIOS
    ? [frame({ maxWidth: Infinity, minHeight: 48 }), contentShape(shapes.rectangle())]
    : [fillMaxWidth()];

export function DeleteAllNotificationsSheet({
    isPresented,
    isDeleting,
    onDismiss,
    onConfirm,
}: {
    isPresented: boolean;
    isDeleting: boolean;
    onDismiss: () => void;
    onConfirm: () => void;
}) {
    const { colors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();

    return (
        <PendingBottomSheet
            isPresented={isPresented}
            onDismiss={onDismiss}
            dismissDisabled={false}
            containerColor={colors.card}
            contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
        >
            <Column spacing={20} modifiers={fullWidth}>
                <Column spacing={8} modifiers={fullWidth}>
                    <Text
                        textStyle={{
                            ...typography.h3,
                            lineHeight: typography.h3.lineHeight * uiFontScale,
                            color: colors.danger,
                            fontSize: typography.h3.fontSize * uiFontScale,
                        }}
                    >
                        {t("notice.deleteAllTitle")}
                    </Text>
                    <Text
                        textStyle={{
                            ...typography.body,
                            lineHeight: typography.body.lineHeight * uiFontScale,
                            color: colors.mutedForeground,
                            fontSize: typography.body.fontSize * uiFontScale,
                        }}
                    >
                        {t("notice.deleteAllMessage")}
                    </Text>
                </Column>

                <Column spacing={12} modifiers={fullWidth}>
                    <Button
                        variant="text"
                        disabled={isDeleting}
                        onPress={onConfirm}
                        style={getNativeButtonStyle(colors, "filled", isDeleting, colors.danger)}
                        modifiers={buttonSize}
                    >
                        <Row spacing={8} alignment="center" modifiers={buttonInnerSize}>
                            <Spacer flexible />
                            {isDeleting ? (
                                <RNHostView matchContents>
                                    <ActivityIndicator color={colors.primaryForeground} />
                                </RNHostView>
                            ) : null}
                            <Text
                                textStyle={{
                                    textAlign: "center",
                                    ...typography.label,
                                    lineHeight: typography.label.lineHeight * uiFontScale,
                                    fontWeight: "600",
                                    color: colors.primaryForeground,
                                    fontSize: typography.label.fontSize * uiFontScale,
                                }}
                            >
                                {t("notice.deleteAll")}
                            </Text>
                            <Spacer flexible />
                        </Row>
                    </Button>

                    <Button
                        variant="text"
                        disabled={isDeleting}
                        onPress={onDismiss}
                        style={getNativeButtonStyle(colors, "text", isDeleting)}
                        modifiers={buttonSize}
                    >
                        <Text
                            modifiers={buttonInnerSize}
                            textStyle={{
                                ...typography.label,
                                lineHeight: typography.label.lineHeight * uiFontScale,
                                fontWeight: "600",
                                color: colors.foreground,
                                fontSize: typography.label.fontSize * uiFontScale,
                                textAlign: "center",
                            }}
                        >
                            {t("common.cancel")}
                        </Text>
                    </Button>
                </Column>
            </Column>
        </PendingBottomSheet>
    );
}
