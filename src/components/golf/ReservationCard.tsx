import { AppText } from "@/design-system/components/AppText";
import { AnimatedPressable, cn, Skeleton, triggerSelectionHaptic } from "@/design-system";
import { colorWithOpacity } from "@/design-system/utils/color";
import { formatTicketTypeLabel, getTicketTypeTone } from "@/design-system/utils/ticket-type";
import { useTheme } from "@/design-system/utils/theme";
import { useMinuteClock } from "@/lib/hook/useMinuteClock";
import type { MemberReservationSummaryResponse } from "@/types/member-reservation";
import { formatTimeRange } from "@/utils/time-helper";
import { getReservationStatusColor, getReservationStatusLabel } from "@/utils/status-tone";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { TicketTypeIcon } from "./TicketTypeIcon";

const LIVE_PULSE_KEYFRAMES = {
    from: { opacity: 1 },
    to: { opacity: 0.55 },
};

const numberFormatCache = new Map<string, Intl.NumberFormat>();

function formatCachedNumber(locale: string, value: number) {
    let formatter = numberFormatCache.get(locale);
    if (!formatter) {
        formatter = new Intl.NumberFormat(locale);
        numberFormatCache.set(locale, formatter);
    }
    return formatter.format(value);
}

function getCountdownInfo(
    startTime: number,
    now: number,
    t: (key: string, options?: Record<string, unknown>) => string,
) {
    if (!Number.isFinite(startTime) || startTime <= now) {
        return null;
    }
    const minutesUntilStart = Math.ceil((startTime - now) / 60000);
    const label =
        minutesUntilStart < 60
            ? t("booking.startsInMinutes", { count: minutesUntilStart })
            : minutesUntilStart < 1440
              ? t("booking.startsInHours", { count: Math.ceil(minutesUntilStart / 60) })
              : t("booking.startsInDays", { count: Math.ceil(minutesUntilStart / 1440) });
    return {
        label,
        isStartingSoon: minutesUntilStart <= 60,
    };
}

function LiveReservationCountdown({
    startTime,
    referenceTime,
    livePulseStyle,
}: {
    startTime: number;
    referenceTime?: number;
    livePulseStyle?: Record<string, unknown>;
}) {
    const { t } = useTranslation();
    const liveNow = useMinuteClock(referenceTime == null);
    const effectiveNow = referenceTime ?? liveNow;
    const info = getCountdownInfo(startTime, effectiveNow, t);

    if (!info) {
        return null;
    }

    return (
        <View className="border-t border-border/60 pt-2.5">
            <Animated.View style={info.isStartingSoon ? livePulseStyle : undefined}>
                <AppText variant="caption" color="primary" numberOfLines={1} textStyle={{ fontWeight: "600" }}>
                    {info.label}
                </AppText>
            </Animated.View>
        </View>
    );
}

type ReservationCardItem = MemberReservationSummaryResponse & {
    durationMinutes?: number;
};

type Props<T extends ReservationCardItem = MemberReservationSummaryResponse> = {
    reservation: T;
    referenceTime?: number;
    disabled?: boolean;
    onPress?: (reservation: T) => void;
};

function ReservationCard<T extends ReservationCardItem = MemberReservationSummaryResponse>({
    reservation,
    referenceTime,
    disabled = false,
    onPress,
}: Props<T>) {
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const reducedMotion = useReducedMotion();
    const tone = getTicketTypeTone(reservation.ticketType);
    const typeLabel = formatTicketTypeLabel(reservation.ticketType, t);
    const title =
        reservation.bayName ??
        reservation.lessonAvailabilityName ??
        reservation.lessonProgramGroupName ??
        reservation.lessonProgramName ??
        t("reservations.reservationFallbackWithId", { id: reservation.id });
    const statusLabel = getReservationStatusLabel(reservation.reservationStatus, t);
    const statusColor = getReservationStatusColor(colors, reservation.reservationStatus);
    const statusUpper = reservation.reservationStatus.toUpperCase();
    const isCheckedIn = statusUpper === "CHECKED_IN";
    const isReservedStatus = statusUpper === "RESERVED";
    const timeRange = formatTimeRange(reservation.startTime, reservation.endTime);
    const startTime = new Date(reservation.startTime).getTime();
    const endTime = new Date(reservation.endTime).getTime();
    const livePulseStyle = !reducedMotion
        ? {
              animationName: LIVE_PULSE_KEYFRAMES,
              animationDuration: "1600ms",
              animationIterationCount: "infinite" as const,
              animationDirection: "alternate" as const,
              animationTimingFunction: "ease-in-out" as const,
          }
        : undefined;
    const staticCountdown =
        isReservedStatus && referenceTime != null
            ? (getCountdownInfo(startTime, referenceTime, t)?.label ?? null)
            : null;
    const durationMinutes =
        reservation.durationMinutes ??
        (Number.isFinite(startTime) && Number.isFinite(endTime) && endTime > startTime
            ? Math.round((endTime - startTime) / 60000)
            : 0);
    const duration =
        durationMinutes > 0
            ? durationMinutes % 60 === 0
                ? t("reservations.durationHour", {
                      value: formatCachedNumber(i18n.language, durationMinutes / 60),
                  })
                : t("reservations.durationMinute", {
                      value: formatCachedNumber(i18n.language, durationMinutes),
                  })
            : null;

    return (
        <AnimatedPressable
            onPress={() => {
                if (disabled) return;
                triggerSelectionHaptic();
                onPress?.(reservation);
            }}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`${title}, ${timeRange}, ${statusLabel}${staticCountdown ? `, ${staticCountdown}` : ""}`}
            className="rounded-2xl border border-border bg-card p-4"
        >
            <View className="gap-3">
                <View className="flex-row items-center justify-between gap-2">
                    <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
                        <AppText variant="subtext" numberOfLines={1} tabular textStyle={{ fontWeight: "700" }}>
                            {timeRange}
                        </AppText>
                        {duration ? (
                            <AppText variant="caption" color="mutedForeground" wrap={false}>
                                {`· ${duration}`}
                            </AppText>
                        ) : null}
                    </View>

                    {statusLabel !== "-" ? (
                        <Animated.View
                            className="shrink-0 rounded-md px-2 py-0.5"
                            style={[
                                {
                                    backgroundColor: colorWithOpacity(statusColor, 0.12),
                                },
                                isCheckedIn ? livePulseStyle : undefined,
                            ]}
                        >
                            <AppText
                                variant="badge"
                                wrap={false}
                                textStyle={{
                                    color: statusColor,
                                    fontWeight: "600",
                                }}
                            >
                                {statusLabel}
                            </AppText>
                        </Animated.View>
                    ) : null}
                </View>

                <View className="flex-row items-center gap-3">
                    <View
                        className={cn("h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone.badgeClassName)}
                    >
                        <TicketTypeIcon
                            type={reservation.ticketType}
                            size={19}
                            color={colors[tone.color]}
                            strokeWidth={2.2}
                        />
                    </View>

                    <View className="min-w-0 flex-1 gap-0.5">
                        <AppText variant="body" numberOfLines={2} textStyle={{ fontWeight: "600" }}>
                            {title}
                        </AppText>
                        {typeLabel ? (
                            <AppText variant="caption" color="mutedForeground" numberOfLines={1}>
                                {typeLabel}
                            </AppText>
                        ) : null}
                    </View>

                    <ChevronRight size={18} color={colors.mutedForeground} strokeWidth={2} />
                </View>

                {isReservedStatus ? (
                    <LiveReservationCountdown
                        startTime={startTime}
                        referenceTime={referenceTime}
                        livePulseStyle={livePulseStyle}
                    />
                ) : null}
            </View>
        </AnimatedPressable>
    );
}

export function ReservationCardSkeleton() {
    return (
        <View className="w-full gap-3 rounded-2xl border border-border bg-card p-4">
            <View className="flex-row items-center justify-between gap-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
            </View>
            <View className="flex-row items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <View className="min-w-0 flex-1 gap-1.5">
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-3.5 w-1/3 rounded-md" />
                </View>
                <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
            </View>
        </View>
    );
}

export default memo(ReservationCard) as typeof ReservationCard;
