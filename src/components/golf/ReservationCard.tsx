import { NativeText } from "@/design-system/components/NativeText";
import {
    getPressedScaleStyle,
    triggerSelectionHaptic,
} from "@/design-system";
import { cn } from "@/design-system/utils/cn";
import { useTheme } from "@/design-system/utils/theme";
import { getTicketTypeTone } from "@/design-system/utils/ticket-type";
import { typography } from "@/design-system/utils/typography";
import type {
    MemberReservationResponse,
} from "@/types/member-reservation";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { ChevronRight } from "lucide-react-native";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

type Props = {
    reservation: MemberReservationResponse;
    referenceTime: number;
    disabled?: boolean;
    onPress?: (reservation: MemberReservationResponse) => void;
};

function ReservationCard({ reservation, referenceTime, disabled = false, onPress }: Props) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const startTime = new Date(reservation.startTime).getTime();
    const endTime = new Date(reservation.endTime).getTime();
    const tone = getTicketTypeTone(reservation.ticketType);
    const minutesUntilStart = Math.ceil(
        (startTime - referenceTime) / 60000,
    );
    const reservationStatus = String(
        reservation.reservationStatus,
    ).toUpperCase();
    const isReservedUpcoming =
        reservationStatus === "RESERVED" && startTime > referenceTime;
    const isStartingSoon = isReservedUpcoming && minutesUntilStart <= 60;
    const countdownLabel =
        isReservedUpcoming
            ? minutesUntilStart < 60
                ? t("booking.startsInMinutes", { count: minutesUntilStart })
                : minutesUntilStart < 1440
                    ? t("booking.startsInHours", {
                        count: Math.ceil(minutesUntilStart / 60),
                    })
                    : t("booking.startsInDays", {
                        count: Math.ceil(minutesUntilStart / 1440),
                    })
            : null;
    const statusLabel =
        reservationStatus === "CHECKED_IN"
            ? t("reservations.checkedIn")
            : reservationStatus === "COMPLETED"
                ? t("reservations.sessionCompleted")
                : reservationStatus === "CANCELLED" ||
                    reservationStatus === "CANCELED"
                    ? t("reservations.reservationCancelled")
                    : reservationStatus === "NO_SHOW"
                        ? t("reservations.markedAbsent")
                        : reservationStatus === "RESERVED" && startTime <= referenceTime
                            ? endTime > referenceTime
                                ? t("reservations.awaitingCheckIn")
                                : t("reservations.sessionTimePassed")
                            : null;
    const secondaryLabel = countdownLabel ?? statusLabel;
    const secondaryColor = countdownLabel
        ? isStartingSoon
            ? colors.warning
            : colors.primary
        : reservationStatus === "CHECKED_IN" ||
            reservationStatus === "COMPLETED"
            ? colors.success
            : reservationStatus === "CANCELLED" ||
                reservationStatus === "CANCELED"
                ? colors.danger
                : reservationStatus === "NO_SHOW"
                    ? colors.warning
                    : colors.mutedForeground;
    // Keep the card surface calm. Status and ticket type are communicated by
    // the small dot and the supporting label instead of coloring the whole card.
    const cardBackgroundClassName =
        reservationStatus !== "RESERVED"
            ? "bg-muted/80"
            : startTime <= referenceTime
                ? "bg-muted/80"
                : "bg-primary/20";
    const arrowBackgroundClassName = "bg-muted";
    const arrowColor = colors.mutedForeground;

    const title =
        reservation.bayName ??
        reservation.lessonAvailabilityName ??
        reservation.lessonProgramGroupName ??
        reservation.lessonProgramName ??
        t("reservations.reservationFallbackWithId", { id: reservation.id });

    const handlePress = () => {
        if (disabled) {
            return;
        }

        triggerSelectionHaptic();
        onPress?.(reservation);
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={({ pressed }) =>
                getPressedScaleStyle(pressed, disabled, 0.99)
            }
        >
            <View
                className={cn(
                    "rounded-xl border border-border bg-card p-5",
                    `flex-col gap-3 overflow-hidden rounded-2xl border-border p-5 ${cardBackgroundClassName}`,
                )}
            >
                <View className="flex-row items-center gap-3">
                    <View
                        className={`h-2.5 w-2.5 rounded-full ${tone.dotClassName}`}
                    />

                    <NativeText
                        variant="label"
                        numberOfLines={1}
                        style={{ flex: 1, minWidth: 0 }}
                        textStyle={{ fontWeight: "500" as const }}
                    >
                        {title}
                    </NativeText>
                </View>

                <View className="flex-row items-center gap-3">
                    <ReservationDateBadge date={reservation.startTime} />

                    <View className="min-w-0 flex-1 flex-col justify-center gap-3">
                        <NativeText
                            variant="body"
                            textStyle={{ lineHeight: typography.h3.lineHeight, fontSize: typography.subtitle.fontSize, fontWeight: "600" as const }}
                        >
                            {formatTimeRange(reservation.startTime, reservation.endTime)}
                        </NativeText>

                        {secondaryLabel ? (
                            <NativeText variant="badge" numberOfLines={1} textStyle={{ color: secondaryColor }}>
                                {secondaryLabel}
                            </NativeText>
                        ) : null}
                    </View>

                    <View
                        className={`h-9 w-9 items-center justify-center rounded-full ${arrowBackgroundClassName}`}
                    >
                        <ChevronRight
                            size={18}
                            color={arrowColor}
                            strokeWidth={2.3}
                        />
                    </View>
                </View>
            </View>
        </Pressable>
    );
}

function areReservationCardsEqual(prev: Props, next: Props) {
    const previousReservation = prev.reservation;
    const nextReservation = next.reservation;

    return (
        prev.disabled === next.disabled &&
        prev.referenceTime === next.referenceTime &&
        prev.onPress === next.onPress &&
        previousReservation.id === nextReservation.id &&
        previousReservation.reservationType ===
        nextReservation.reservationType &&
        previousReservation.reservationStatus ===
        nextReservation.reservationStatus &&
        previousReservation.ticketType === nextReservation.ticketType &&
        previousReservation.startTime === nextReservation.startTime &&
        previousReservation.endTime === nextReservation.endTime &&
        previousReservation.bayName === nextReservation.bayName &&
        previousReservation.lessonAvailabilityName ===
        nextReservation.lessonAvailabilityName &&
        previousReservation.lessonProgramGroupName ===
        nextReservation.lessonProgramGroupName &&
        previousReservation.lessonProgramName ===
        nextReservation.lessonProgramName
    );
}

function ReservationDateBadge({ date }: { date: string }) {

    return (
        <View className="h-[82px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            <View className="flex-1 items-center justify-center px-2">
                <NativeText variant="badge" color="mutedForeground" align="center" numberOfLines={1}>
                    {formatDateValue(date, "MMM").toUpperCase()}
                </NativeText>

                <NativeText variant="h2" align="center" numberOfLines={1}>
                    {formatDateValue(date, "dd")}
                </NativeText>
            </View>
        </View>
    );
}

export default memo(ReservationCard, areReservationCardsEqual);
