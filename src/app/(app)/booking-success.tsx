import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { Badge, Divider, Screen, useThemeColors } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { useMemberTickets } from "@/lib/hook/useTicket";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { formatDateForDisplay, formatTimeRange } from "@/utils/time-helper";
import { Button, Host, Text } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import {
    Stack,
    useFocusEffect,
    useLocalSearchParams,
    useRouter,
} from "expo-router";
import {
    CalendarDays,
    Check,
    Clock3,
    MapPin,
    UserRound,
} from "lucide-react-native";
import { useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, View } from "react-native";

type BookingSuccessParams = {
    type?: "bay" | "lesson";
    mode?: "booking" | "reschedule";
    ticketId?: string;
    ticketName?: string;
    ticketRemainingCount?: string;
    ticketIsUnlimited?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    bayName?: string;
    bayId?: string;
    reservationName?: string;
    coachName?: string;
};

function BookingDetailRow({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value?: string | null;
}) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    if (!value) {
        return null;
    }

    return (
        <View className="flex-row items-center gap-4 py-1">
            <View className="w-6 items-center">{icon}</View>
            <View className="min-w-0 flex-1 gap-1">
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                            fontWeight: "500" as const,
                            color: uiColors.mutedForeground,
                            fontSize: typography.caption.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {label}
                    </Text>
                </Host>
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.body, lineHeight: typography.body.lineHeight * uiFontScale,
                            fontWeight: "600" as const,
                            color: uiColors.foreground,
                            fontSize: typography.body.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {value}
                    </Text>
                </Host>
            </View>
        </View>
    );
}

export default function BookingSuccessScreen() {
    const {
        colors: uiColors,
        resolvedScheme: uiScheme,
        fontScale: uiFontScale,
    } = useTheme();
    const { t } = useTranslation();
    const {
        type,
        mode,
        ticketId,
        ticketName,
        ticketRemainingCount,
        ticketIsUnlimited,
        date,
        startTime,
        endTime,
        bayName,
        bayId,
        reservationName,
        coachName,
    } = useLocalSearchParams<BookingSuccessParams>();
    const router = useRouter();
    const colors = useThemeColors();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const parsedRemainingCount =
        ticketRemainingCount == null ? null : Number(ticketRemainingCount);
    const remainingCount =
        parsedRemainingCount != null && Number.isFinite(parsedRemainingCount)
            ? parsedRemainingCount
            : null;
    const isUnlimited = ticketIsUnlimited === "true";
    const { data: memberResponse } = useGetMemberProfile();
    // Include fully used tickets so the final booking can still show total usage.
    const { data: ticketsResponse } = useMemberTickets(
        ticketId && !isUnlimited ? memberResponse?.data?.id : undefined,
        [],
    );
    const ticket = ticketsResponse?.data?.find(
        (item) => String(item.id) === ticketId,
    );
    const totalCount = ticket?.totalCount;
    const usageLabel =
        isUnlimited || ticket?.isUnlimited
            ? t("tickets.unlimitedUsage")
            : totalCount != null
                ? t("tickets.usage", {
                    used:
                        remainingCount != null
                            ? Math.max(0, totalCount - remainingCount)
                            : (ticket?.usedCount ?? 0),
                    total: totalCount,
                })
                : null;
    const isReschedule = mode === "reschedule";

    const handleGoHome = useCallback(() => {
        if (isLocked) {
            return;
        }

        runWithNavigationLock(() => {
            router.dismissTo("/(app)/(tabs)");
        });
    }, [isLocked, router, runWithNavigationLock]);

    useFocusEffect(
        useCallback(() => {
            if (process.env.EXPO_OS !== "android") {
                return;
            }

            const subscription = BackHandler.addEventListener(
                "hardwareBackPress",
                () => {
                    handleGoHome();
                    return true;
                },
            );

            return () => subscription.remove();
        }, [handleGoHome]),
    );

    const reservationTypeLabel =
        type === "bay"
            ? t("reservations.bayLabel")
            : type === "lesson"
                ? t("reservations.lessonLabel")
                : t("reservations.fallback");
    const successTitle = isReschedule
        ? t("reservations.rescheduledTitle")
        : t("reservations.confirmedTitle");
    const successMessage = isReschedule
        ? t("reservations.rescheduledMessage")
        : t("reservations.confirmedMessage");
    const dateValue = date ? formatDateForDisplay(date) : null;
    const timeValue =
        startTime || endTime ? formatTimeRange(startTime, endTime) : null;
    const bayValue =
        type === "bay"
            ? bayName ||
            (bayId ? t("reservations.bayWithId", { id: bayId }) : null)
            : null;

    const footer = (
        <View className="pb-4 pt-4">
            <Host
                matchContents={{ vertical: true }}
                ignoreSafeArea="all"
                colorScheme={uiScheme}
                seedColor={uiColors.primary}
                accessibilityLabel={t("activity.done")}
                accessibilityState={{ disabled: isLocked, busy: false }}
                style={{ width: "100%" }}>
                <Button
                    modifiers={
                        process.env.EXPO_OS === "ios"
                            ? [frame({ maxWidth: Infinity, minHeight: 56 })]
                            : [
                                fillMaxWidth(),
                                defaultMinSize({ minHeight: 56 }),
                            ]
                    }
                    variant="text"
                    disabled={isLocked}
                    onPress={handleGoHome}
                    style={{
                        ...getNativeButtonStyle(
                            uiColors,
                            "filled",
                            isLocked,
                            uiColors.primary,
                        ), ...{ borderRadius: 12 }
                    }}
                >
                    <Text
                        modifiers={
                            process.env.EXPO_OS === "ios"
                                ? [frame({ maxWidth: Infinity, minHeight: 56 })]
                                : [fillMaxWidth()]
                        }
                        textStyle={{
                            ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                            textAlign: "center",
                            color: uiColors.primaryForeground,
                            fontSize: typography.label.fontSize * uiFontScale,
                        }}
                    >
                        {t("activity.done")}
                    </Text>
                </Button>
            </Host>
        </View>
    );

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                    gestureEnabled: false,
                    fullScreenGestureEnabled: false,
                }}
            />

            <Screen
                headerShown={false}
                contentClassName="grow gap-7 py-8"
                footer={footer}
            >
                <View className="w-full items-center gap-3">
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-success">
                        <Check
                            size={34}
                            color={colors.primaryForeground}
                            strokeWidth={3}
                        />
                    </View>

                    <View className="w-full items-center gap-2">
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                textStyle={{
                                    ...typography.h1, lineHeight: typography.h2.lineHeight * uiFontScale,
                                    textAlign: "center" as const,
                                    fontSize: typography.h2.fontSize * uiFontScale,
                                    color: uiColors.foreground,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                                {successTitle}
                            </Text>
                        </Host>

                        <Host
                            matchContents={{ vertical: true }}
                            ignoreSafeArea="all"
                            style={{ maxWidth: 384, width: "100%" }}
                        >
                            <Text
                                textStyle={{
                                    ...typography.muted,
                                    color: uiColors.mutedForeground,
                                    textAlign: "center" as const,
                                    lineHeight: typography.body.lineHeight * uiFontScale,
                                    fontSize:
                                        typography.muted.fontSize * uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                                {successMessage}
                            </Text>
                        </Host>
                    </View>

                    <View className="pt-1">
                        <Badge label={reservationTypeLabel} variant="success" />
                    </View>
                </View>

                <Divider />

                <View className="gap-5">
                    <BookingDetailRow
                        icon={
                            <CalendarDays
                                size={20}
                                color={colors.mutedForeground}
                            />
                        }
                        label={t("bookingConfirmation.dateLabel")}
                        value={dateValue}
                    />
                    <BookingDetailRow
                        icon={
                            <Clock3 size={20} color={colors.mutedForeground} />
                        }
                        label={t("bookingConfirmation.timeLabel")}
                        value={timeValue}
                    />
                    {type === "bay" ? (
                        <BookingDetailRow
                            icon={
                                <MapPin
                                    size={20}
                                    color={colors.mutedForeground}
                                />
                            }
                            label={t("reservations.bayLabel")}
                            value={bayValue}
                        />
                    ) : (
                        <>
                            <BookingDetailRow
                                icon={
                                    <MapPin
                                        size={20}
                                        color={colors.mutedForeground}
                                    />
                                }
                                label={t("reservations.lessonLabel")}
                                value={reservationName}
                            />
                            <BookingDetailRow
                                icon={
                                    <UserRound
                                        size={20}
                                        color={colors.mutedForeground}
                                    />
                                }
                                label={t("reservations.coachLabel")}
                                value={coachName}
                            />
                        </>
                    )}
                </View>

                {ticketName ? (
                    <>
                        <Divider />
                        <View className="gap-3 py-1">
                            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                <Text
                                    textStyle={{
                                        ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                        fontWeight: "600" as const,
                                        color: uiColors.mutedForeground,
                                        fontSize:
                                            typography.caption.fontSize *
                                            uiFontScale,
                                    }}
                                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                    {t("bookingConfirmation.ticketLabel")}
                                </Text>
                            </Host>
                            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                <Text
                                    textStyle={{
                                        ...typography.label, lineHeight: typography.body.lineHeight * uiFontScale,
                                        fontSize: typography.body.fontSize * uiFontScale,
                                        fontWeight: "700" as const,
                                        color: uiColors.foreground,
                                    }}
                                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                    {ticketName +
                                        (usageLabel ? ` (${usageLabel})` : "")}
                                </Text>
                            </Host>
                        </View>
                    </>
                ) : null}
            </Screen>
        </>
    );
}
