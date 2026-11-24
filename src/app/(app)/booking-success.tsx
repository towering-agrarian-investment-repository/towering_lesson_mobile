import { AppText } from "@/design-system/components/AppText";
import { ActionButton, Badge, Divider, Screen } from "@/design-system";
import { typography } from "@/design-system/utils/typography";
import { useTheme } from "@/design-system/utils/theme";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { formatDateForDisplay, formatTimeRange } from "@/utils/time-helper";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { CalendarDays, Check, Clock3, MapPin, UserRound } from "lucide-react-native";
import { useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, View } from "react-native";

type BookingSuccessParams = {
    type?: "bay" | "lesson";
    mode?: "booking" | "reschedule";
    reservationId?: string;
    ticketName?: string;
    ticketTotalCount?: string;
    ticketUsedCount?: string;
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

function BookingDetailRow({ icon, label, value }: { icon: ReactNode; label: string; value?: string | null }) {
    if (!value) {
        return null;
    }

    return (
        <View className="flex-row items-center gap-4 py-1">
            <View className="w-6 items-center">{icon}</View>
            <View className="min-w-0 flex-1 gap-1">
                <AppText variant="caption" color="mutedForeground">
                    {label}
                </AppText>
                <AppText variant="body" textStyle={{ fontWeight: "600" as const }}>
                    {value}
                </AppText>
            </View>
        </View>
    );
}

export default function BookingSuccessScreen() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const {
        type,
        mode,
        reservationId,
        ticketName,
        ticketTotalCount,
        ticketUsedCount,
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
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const parseFiniteParam = (value?: string) => {
        if (value == null) return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };
    const totalCount = parseFiniteParam(ticketTotalCount);
    const usedCount = parseFiniteParam(ticketUsedCount);
    const remainingCount = parseFiniteParam(ticketRemainingCount);
    const isUnlimited = ticketIsUnlimited === "true";
    const usageLabel = isUnlimited
        ? t("tickets.unlimitedUsage")
        : totalCount != null
          ? t("tickets.usage", {
                used: usedCount ?? (remainingCount != null ? Math.max(0, totalCount - remainingCount) : 0),
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

    const parsedReservationId = parseFiniteParam(reservationId);
    const handleViewReservation = useCallback(() => {
        if (isLocked || parsedReservationId == null) {
            return;
        }

        runWithNavigationLock(() => {
            router.replace({
                pathname: "/reservation/[id]",
                params: {
                    id: String(parsedReservationId),
                    type: type ?? "bay",
                },
            });
        });
    }, [isLocked, parsedReservationId, router, runWithNavigationLock, type]);

    useFocusEffect(
        useCallback(() => {
            if (process.env.EXPO_OS !== "android") {
                return;
            }

            const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
                handleGoHome();
                return true;
            });

            return () => subscription.remove();
        }, [handleGoHome]),
    );

    const reservationTypeLabel =
        type === "bay"
            ? t("reservations.bayLabel")
            : type === "lesson"
              ? t("reservations.lessonLabel")
              : t("reservations.fallback");
    const successTitle = isReschedule ? t("reservations.rescheduledTitle") : t("reservations.confirmedTitle");
    const successMessage = isReschedule ? t("reservations.rescheduledMessage") : t("reservations.confirmedMessage");
    const dateValue = date ? formatDateForDisplay(date) : null;
    const timeValue = startTime || endTime ? formatTimeRange(startTime, endTime) : null;
    const bayValue = type === "bay" ? bayName || (bayId ? t("reservations.bayWithId", { id: bayId }) : null) : null;

    const footer = (
        <View className="gap-3">
            <ActionButton label={t("activity.done")} disabled={isLocked} haptic="selection" onPress={handleGoHome} />
            {parsedReservationId != null ? (
                <ActionButton
                    label={t("reservations.viewReservation")}
                    appearance="outlined"
                    disabled={isLocked}
                    onPress={handleViewReservation}
                />
            ) : null}
        </View>
    );

    return (
        <Screen headerShown={false} contentClassName="grow gap-6 py-6" footer={footer}>
            <View className="w-full items-center gap-3">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-success">
                    <Check size={34} color={colors.primaryForeground} strokeWidth={3} />
                </View>

                <View className="w-full items-center gap-2">
                    <AppText
                        variant="h1"
                        align="center"
                        textStyle={{ lineHeight: typography.h2.lineHeight, fontSize: typography.h2.fontSize }}
                    >
                        {successTitle}
                    </AppText>

                    <AppText
                        variant="body"
                        color="mutedForeground"
                        align="center"
                        style={{ maxWidth: 384 }}
                        textStyle={{ lineHeight: typography.body.lineHeight }}
                    >
                        {successMessage}
                    </AppText>
                </View>

                <View className="pt-1">
                    <Badge label={reservationTypeLabel} variant="success" />
                </View>
            </View>

            <Divider />

            <View className="gap-4">
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

            {type === "bay" ? (
                <AppText variant="caption" color="mutedForeground">
                    {t("bookingConfirmation.bayRequestDisclaimer")}
                </AppText>
            ) : null}

            {ticketName ? (
                <>
                    <Divider />
                    <View className="gap-3 py-1">
                        <AppText variant="caption" color="mutedForeground" textStyle={{ fontWeight: "600" as const }}>
                            {t("bookingConfirmation.ticketLabel")}
                        </AppText>
                        <AppText
                            variant="label"
                            textStyle={{
                                lineHeight: typography.body.lineHeight,
                                fontSize: typography.body.fontSize,
                                fontWeight: "700" as const,
                            }}
                        >
                            {ticketName + (usageLabel ? ` (${usageLabel})` : "")}
                        </AppText>
                    </View>
                </>
            ) : null}
        </Screen>
    );
}
