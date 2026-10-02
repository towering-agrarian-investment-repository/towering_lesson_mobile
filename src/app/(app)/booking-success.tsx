import {
    AppText,
    Badge,
    Button,
    Divider,
    Screen,
    useThemeColors,
} from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { useMemberTickets } from "@/lib/hook/useTicket";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { formatDateForDisplay, formatTimeRange } from "@/utils/time-helper";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
                <AppText variant="caption" className="font-medium text-muted-foreground">
                    {label}
                </AppText>
                <AppText variant="body" selectable className="font-semibold text-foreground">
                    {value}
                </AppText>
            </View>
        </View>
    );
}

export default function BookingSuccessScreen() {
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
    const parsedRemainingCount = ticketRemainingCount == null
        ? null
        : Number(ticketRemainingCount);
    const remainingCount = parsedRemainingCount != null &&
        Number.isFinite(parsedRemainingCount)
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
    const usageLabel = isUnlimited || ticket?.isUnlimited
        ? t("tickets.unlimitedUsage")
        : totalCount != null
            ? t("tickets.usage", {
                used: remainingCount != null
                    ? Math.max(0, totalCount - remainingCount)
                    : ticket?.usedCount ?? 0,
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
    const timeValue = startTime || endTime
        ? formatTimeRange(startTime, endTime)
        : null;
    const bayValue = type === "bay"
        ? bayName || (bayId ? t("reservations.bayWithId", { id: bayId }) : null)
        : null;

    const footer = (
        <View className="pb-4 pt-4">
            <Button
                title={t("activity.done")}
                size="lg"
                disabled={isLocked}
                onPress={handleGoHome}
            />
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
                <View className="items-center gap-3">
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-success">
                        <Check size={34} color={colors.primaryForeground} strokeWidth={3} />
                    </View>

                    <View className="items-center gap-2">
                        <AppText
                            variant="h1"
                            selectable
                            className="text-center text-2xl text-foreground"
                        >
                            {successTitle}
                        </AppText>

                        <AppText
                            variant="muted"
                            selectable
                            className="max-w-sm text-center leading-6"
                        >
                            {successMessage}
                        </AppText>
                    </View>

                    <View className="pt-1">
                        <Badge label={reservationTypeLabel} variant="success" />
                    </View>
                </View>

                <Divider />

                <View className="gap-5">
                    <BookingDetailRow
                        icon={<CalendarDays size={20} color={colors.mutedForeground} />}
                        label={t("bookingConfirmation.dateLabel")}
                        value={dateValue}
                    />
                    <BookingDetailRow
                        icon={<Clock3 size={20} color={colors.mutedForeground} />}
                        label={t("bookingConfirmation.timeLabel")}
                        value={timeValue}
                    />
                    {type === "bay" ? (
                        <BookingDetailRow
                            icon={<MapPin size={20} color={colors.mutedForeground} />}
                            label={t("reservations.bayLabel")}
                            value={bayValue}
                        />
                    ) : (
                        <>
                            <BookingDetailRow
                                icon={<MapPin size={20} color={colors.mutedForeground} />}
                                label={t("reservations.lessonLabel")}
                                value={reservationName}
                            />
                            <BookingDetailRow
                                icon={<UserRound size={20} color={colors.mutedForeground} />}
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
                            <AppText
                                variant="caption"
                                className="font-semibold text-muted-foreground"
                            >
                                {t("bookingConfirmation.ticketLabel")}
                            </AppText>
                            <AppText
                                variant="label"
                                selectable
                                className="text-base font-bold text-foreground"
                            >
                                {ticketName}
                                {usageLabel ? (
                                    <AppText
                                        variant="caption"
                                        className="font-medium text-muted-foreground"
                                        style={{ fontVariant: ["tabular-nums"] }}
                                    >
                                        {" ("}
                                        {usageLabel}
                                        {")"}
                                    </AppText>
                                ) : null}
                            </AppText>
                        </View>
                    </>
                ) : null}
            </Screen>
        </>
    );
}
