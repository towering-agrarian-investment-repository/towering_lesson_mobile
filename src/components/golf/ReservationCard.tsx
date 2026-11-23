import { AppText } from "@/design-system/components/AppText";
import { AnimatedPressable, cn, Skeleton, triggerSelectionHaptic } from "@/design-system";
import { colorWithOpacity } from "@/design-system/utils/color";
import {
    formatTicketTypeLabel,
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import { useTheme } from "@/design-system/utils/theme";
import type {
    MemberReservationResponse,
    MemberReservationSummaryResponse,
} from "@/types/member-reservation";
import { formatTimeRange } from "@/utils/time-helper";
import {
    getReservationStatusColor,
    getReservationStatusLabel,
} from "@/utils/status-tone";
import { ChevronRight } from "lucide-react-native";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { TicketTypeIcon } from "./TicketTypeIcon";

const LIVE_PULSE_KEYFRAMES = {
    from: { opacity: 1 },
    to: { opacity: 0.55 },
};

type ReservationCardItem = MemberReservationSummaryResponse & {
    durationMinutes?: number;
};

type Props<T extends ReservationCardItem = MemberReservationResponse> = {
    reservation: T;
    referenceTime?: number;
    disabled?: boolean;
    onPress?: (reservation: T) => void;
};

function ReservationCard<T extends ReservationCardItem = MemberReservationResponse>({
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
    const title = reservation.bayName ?? reservation.lessonAvailabilityName
        ?? reservation.lessonProgramGroupName ?? reservation.lessonProgramName
        ?? t("reservations.reservationFallbackWithId", { id: reservation.id });
    const statusLabel = getReservationStatusLabel(reservation.reservationStatus, t);
    const statusColor = getReservationStatusColor(colors, reservation.reservationStatus);
    const isCheckedIn = reservation.reservationStatus.toUpperCase() === "CHECKED_IN";
    const timeRange = formatTimeRange(reservation.startTime, reservation.endTime);
    const startTime = new Date(reservation.startTime).getTime();
    const endTime = new Date(reservation.endTime).getTime();
    const minutesUntilStart =
        referenceTime != null ? Math.ceil((startTime - referenceTime) / 60000) : 0;
    const isReservedUpcoming =
        referenceTime != null &&
        reservation.reservationStatus.toUpperCase() === "RESERVED" &&
        startTime > referenceTime;
    const isStartingSoon = isReservedUpcoming && minutesUntilStart <= 60;
    const livePulseStyle = !reducedMotion
        ? {
              animationName: LIVE_PULSE_KEYFRAMES,
              animationDuration: "1600ms",
              animationIterationCount: "infinite" as const,
              animationDirection: "alternate" as const,
              animationTimingFunction: "ease-in-out" as const,
          }
        : undefined;
    const countdownLabel = isReservedUpcoming
        ? minutesUntilStart < 60
            ? t("booking.startsInMinutes", { count: minutesUntilStart })
            : minutesUntilStart < 1440
                ? t("booking.startsInHours", { count: Math.ceil(minutesUntilStart / 60) })
                : t("booking.startsInDays", { count: Math.ceil(minutesUntilStart / 1440) })
        : null;
    const durationMinutes =
        reservation.durationMinutes ??
        (Number.isFinite(startTime) && Number.isFinite(endTime) && endTime > startTime
            ? Math.round((endTime - startTime) / 60000)
            : 0);
    const duration = durationMinutes > 0
        ? durationMinutes % 60 === 0
            ? t("reservations.durationHour", {
                value: new Intl.NumberFormat(i18n.language).format(durationMinutes / 60),
            })
            : t("reservations.durationMinute", {
                value: new Intl.NumberFormat(i18n.language).format(durationMinutes),
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
            accessibilityLabel={`${title}, ${timeRange}, ${statusLabel}${countdownLabel ? `, ${countdownLabel}` : ""}`}
            className="rounded-2xl border border-border bg-card p-4"
        >
            <View className="gap-3">
                <View className="flex-row items-center justify-between gap-2">
                    <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
                        <AppText
                            variant="meta"
                            numberOfLines={1}
                            textStyle={{
                                fontWeight: "700",
                                fontVariant: ["tabular-nums"],
                            }}
                        >
                            {timeRange}
                        </AppText>
                        {duration ? (
                            <AppText
                                variant="caption"
                                color="mutedForeground"
                                wrap={false}
                            >
                                {`· ${duration}`}
                            </AppText>
                        ) : null}
                    </View>

                    {statusLabel !== "-" ? (
                        <Animated.View
                            className="shrink-0 rounded-md px-2 py-0.5"
                            style={[
                                {
                                    backgroundColor: colorWithOpacity(
                                        statusColor,
                                        0.12,
                                    ),
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
                        className={cn(
                            "h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            tone.badgeClassName,
                        )}
                    >
                        <TicketTypeIcon
                            type={reservation.ticketType}
                            size={19}
                            color={colors[tone.color]}
                            strokeWidth={2.2}
                        />
                    </View>

                    <View className="min-w-0 flex-1 gap-0.5">
                        <AppText
                            variant="body"
                            numberOfLines={2}
                            textStyle={{ fontWeight: "600" }}
                        >
                            {title}
                        </AppText>
                        {typeLabel ? (
                            <AppText
                                variant="caption"
                                color="mutedForeground"
                                numberOfLines={1}
                            >
                                {typeLabel}
                            </AppText>
                        ) : null}
                    </View>

                    <ChevronRight
                        size={18}
                        color={colors.mutedForeground}
                        strokeWidth={2}
                    />
                </View>

                {countdownLabel ? (
                    <View className="border-t border-border/60 pt-2.5">
                        <Animated.View
                            style={isStartingSoon ? livePulseStyle : undefined}
                        >
                            <AppText
                                variant="caption"
                                color="primary"
                                numberOfLines={1}
                                textStyle={{ fontWeight: "600" }}
                            >
                                {countdownLabel}
                            </AppText>
                        </Animated.View>
                    </View>
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
