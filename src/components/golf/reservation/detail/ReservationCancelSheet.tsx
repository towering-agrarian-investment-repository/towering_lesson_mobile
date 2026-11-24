import { PendingBottomSheet } from "@/design-system/components/PendingBottomSheet";
import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Button, Column, RNHostView, Row, Spacer, Text } from "@expo/ui";
import { defaultMinSize, fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { contentShape, frame, shapes } from "@expo/ui/swift-ui/modifiers";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";

type ReservationCancelSheetProps = {
    isPresented: boolean;
    isCancelling: boolean;
    isConfirmDisabled: boolean;
    isOnline: boolean;
    title: string;
    dateValue: string;
    timeValue: string;
    showRefundNote: boolean;
    onConfirm: () => void;
    onDismiss: () => void;
};

export function ReservationCancelSheet({
    isPresented,
    isCancelling,
    isConfirmDisabled,
    isOnline,
    title,
    dateValue,
    timeValue,
    showRefundNote,
    onConfirm,
    onDismiss,
}: ReservationCancelSheetProps) {
    const { colors, fontScale } = useTheme();
    const { t } = useTranslation();
    const widthModifiers = process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity })] : [fillMaxWidth()];
    const buttonModifiers =
        process.env.EXPO_OS === "ios"
            ? [frame({ maxWidth: Infinity, minHeight: 48 })]
            : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })];
    const buttonInnerModifiers =
        process.env.EXPO_OS === "ios"
            ? [frame({ maxWidth: Infinity, minHeight: 48 }), contentShape(shapes.rectangle())]
            : [fillMaxWidth()];

    return (
        <PendingBottomSheet
            isPresented={isPresented}
            onDismiss={onDismiss}
            dismissDisabled={isCancelling}
            containerColor={colors.card}
            contentColor={colors.foreground}
            contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
        >
            <Column spacing={20} modifiers={widthModifiers}>
                <Column spacing={8} modifiers={widthModifiers}>
                    <Text
                        textStyle={{
                            ...typography.h3,
                            lineHeight: typography.h3.lineHeight * fontScale,
                            color: colors.danger,
                            fontSize: typography.h3.fontSize * fontScale,
                        }}
                    >
                        {t("reservations.cancelTitle")}
                    </Text>
                    <Text
                        textStyle={{
                            ...typography.body,
                            lineHeight: typography.body.lineHeight * fontScale,
                            color: colors.mutedForeground,
                            fontSize: typography.body.fontSize * fontScale,
                        }}
                    >
                        {t("reservations.cancelMessage")}
                    </Text>
                    {!isOnline ? (
                        <Text
                            textStyle={{
                                ...typography.body,
                                lineHeight: typography.body.lineHeight * fontScale,
                                color: colors.warning,
                                fontSize: typography.body.fontSize * fontScale,
                            }}
                        >
                            {t("common.offlineMessage")}
                        </Text>
                    ) : null}
                </Column>
                <Column spacing={2} modifiers={widthModifiers}>
                    <Text
                        textStyle={{
                            ...typography.label,
                            lineHeight: typography.label.lineHeight * fontScale,
                            color: colors.foreground,
                            fontSize: typography.label.fontSize * fontScale,
                        }}
                    >
                        {title}
                    </Text>
                    <Text
                        textStyle={{
                            ...typography.body,
                            lineHeight: typography.body.lineHeight * fontScale,
                            color: colors.mutedForeground,
                            fontSize: typography.body.fontSize * fontScale,
                        }}
                    >{`${dateValue} · ${timeValue}`}</Text>
                    {showRefundNote ? (
                        <Text
                            textStyle={{
                                ...typography.caption,
                                lineHeight: typography.caption.lineHeight * fontScale,
                                color: colors.mutedForeground,
                                fontSize: typography.caption.fontSize * fontScale,
                            }}
                        >
                            {t("reservations.cancelRefundNote")}
                        </Text>
                    ) : null}
                </Column>
                <Column spacing={12} modifiers={widthModifiers}>
                    <Button
                        variant="text"
                        disabled={isConfirmDisabled}
                        onPress={onConfirm}
                        style={getNativeButtonStyle(colors, "filled", isConfirmDisabled, colors.danger)}
                        modifiers={buttonModifiers}
                    >
                        <Row spacing={8} alignment="center" modifiers={buttonInnerModifiers}>
                            <Spacer flexible />
                            {isCancelling ? (
                                <RNHostView matchContents>
                                    <ActivityIndicator color={colors.dangerForeground} />
                                </RNHostView>
                            ) : null}
                            <Text
                                textStyle={{
                                    textAlign: "center",
                                    ...typography.label,
                                    lineHeight: typography.label.lineHeight * fontScale,
                                    fontWeight: "600",
                                    color: colors.dangerForeground,
                                    fontSize: typography.label.fontSize * fontScale,
                                }}
                            >
                                {t("reservations.cancelTitle")}
                            </Text>
                            <Spacer flexible />
                        </Row>
                    </Button>
                    <Button
                        variant="text"
                        disabled={isCancelling}
                        onPress={onDismiss}
                        style={getNativeButtonStyle(colors, "text", isCancelling)}
                        modifiers={buttonModifiers}
                    >
                        <Text
                            modifiers={buttonInnerModifiers}
                            textStyle={{
                                ...typography.label,
                                lineHeight: typography.label.lineHeight * fontScale,
                                fontWeight: "600",
                                color: colors.foreground,
                                fontSize: typography.label.fontSize * fontScale,
                                textAlign: "center",
                            }}
                        >
                            {t("reservations.keepReservation")}
                        </Text>
                    </Button>
                </Column>
            </Column>
        </PendingBottomSheet>
    );
}
