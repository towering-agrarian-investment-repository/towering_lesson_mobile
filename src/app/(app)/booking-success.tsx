import { NativeText } from "@/design-system/components/NativeText";
import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { Badge, Divider, Screen } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { useMemberTicketById } from "@/lib/hook/useTicket";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import type { TicketListItemResponse } from "@/types/member-ticket";
import { useQueryClient } from "@tanstack/react-query";
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

    if (!value) {
        return null;
    }

    return (
        <View className="flex-row items-center gap-4 py-1">
            <View className="w-6 items-center">{icon}</View>
            <View className="min-w-0 flex-1 gap-1">
                <NativeText variant="caption" color="mutedForeground" textStyle={{ fontWeight: "500" as const }}>
                    {label}
                </NativeText>
                <NativeText variant="body" textStyle={{ fontWeight: "600" as const }}>
                    {value}
                </NativeText>
            </View>
        </View>
    );
}

export default function BookingSuccessScreen() {
    const { colors, resolvedScheme: uiScheme, fontScale: uiFontScale } = useTheme();
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
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const parsedRemainingCount =
        ticketRemainingCount == null ? null : Number(ticketRemainingCount);
    const remainingCount =
        parsedRemainingCount != null && Number.isFinite(parsedRemainingCount)
            ? parsedRemainingCount
            : null;
    const isUnlimited = ticketIsUnlimited === "true";
    const { data: memberResponse } = useGetMemberProfile();
    const numericTicketId = ticketId ? Number(ticketId) : undefined;
    const selectedTicket = numericTicketId
        ? queryClient.getQueryData<TicketListItemResponse>(["member", "selected-ticket", numericTicketId])
        : undefined;
    // A reschedule may reach this screen without a ticket selected from a list.
    const { data: loadedTicket } = useMemberTicketById(
        ticketId && !isUnlimited && !selectedTicket ? memberResponse?.data?.id : undefined,
        numericTicketId,
    );
    const ticket = selectedTicket ?? loadedTicket;
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
        <View>
            <Host
                matchContents={{ vertical: true }}
                ignoreSafeArea="all"
                colorScheme={uiScheme}
                seedColor={colors.primary}
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
                            colors,
                            "filled",
                            isLocked,
                            colors.primary,
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
                            color: colors.primaryForeground,
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
                        <NativeText
                            variant="h1"
                            align="center"
                            textStyle={{ lineHeight: typography.h2.lineHeight, fontSize: typography.h2.fontSize }}
                        >
                            {successTitle}
                        </NativeText>

                        <NativeText
                            variant="muted"
                            color="mutedForeground"
                            align="center"
                            style={{ maxWidth: 384 }}
                            textStyle={{ lineHeight: typography.body.lineHeight }}
                        >
                            {successMessage}
                        </NativeText>
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
                            <NativeText variant="caption" color="mutedForeground" textStyle={{ fontWeight: "600" as const }}>
                                {t("bookingConfirmation.ticketLabel")}
                            </NativeText>
                            <NativeText
                                variant="label"
                                textStyle={{ lineHeight: typography.body.lineHeight, fontSize: typography.body.fontSize, fontWeight: "700" as const }}
                            >
                                {ticketName +
                                    (usageLabel ? ` (${usageLabel})` : "")}
                            </NativeText>
                        </View>
                    </>
                ) : null}
            </Screen>
        </>
    );
}
