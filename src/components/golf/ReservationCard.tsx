import {
    AppText,
    Card,
    getPressedScaleStyle,
    useThemeColors,
} from "@/design-system";
import {
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import type {
    MemberReservationResponse,
    MemberReservationSummaryResponse,
} from "@/types/member-reservation";
import { fmtTime } from "@/utils/time-helper";
import { format } from "date-fns";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

type Props = {
    reservation: MemberReservationResponse | MemberReservationSummaryResponse;
    disabled?: boolean;
    onPress?: (
        reservation: MemberReservationResponse | MemberReservationSummaryResponse,
    ) => void;
};

function ReservationCard({ reservation, disabled = false, onPress }: Props) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const startDate = new Date(reservation.startTime);
    const endDate = new Date(reservation.endTime);
    const tone = getTicketTypeTone(reservation.ticketType);
    const minutesUntilStart = Math.ceil(
        (startDate.getTime() - Date.now()) / 60000,
    );
    const reservationStatus = String(reservation.reservationStatus).toUpperCase();
    const isReservedUpcoming = reservationStatus === "RESERVED" && minutesUntilStart >= 0;
    const isStartingSoon = minutesUntilStart >= 0 && minutesUntilStart <= 60;
    const countdownLabel =
        minutesUntilStart >= 0
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
                : reservationStatus === "CANCELLED" || reservationStatus === "CANCELED"
                    ? t("reservations.reservationCancelled")
                    : reservationStatus === "NO_SHOW"
                        ? t("reservations.markedAbsent")
                        : reservationStatus === "RESERVED" && minutesUntilStart < 0
                            ? t("reservations.sessionTimePassed")
                            : null;
    const secondaryLabel = countdownLabel ?? statusLabel;
    const secondaryClassName = countdownLabel
            ? isStartingSoon
                ? "text-warning"
                : "text-primary"
        : reservationStatus === "CHECKED_IN" || reservationStatus === "COMPLETED"
            ? "text-success"
            : reservationStatus === "CANCELLED" || reservationStatus === "CANCELED"
                ? "text-danger"
                : reservationStatus === "NO_SHOW"
                    ? "text-warning"
                    : "text-muted-foreground";
    // Keep the card surface calm. Status and ticket type are communicated by
    // the small dot and the supporting label instead of coloring the whole card.
    const cardBackgroundClassName =
        reservationStatus === "RESERVED" && minutesUntilStart < 0
            ? "bg-muted/80"
            : isReservedUpcoming
                ? "bg-primary/20"
                : "bg-card";
    const arrowBackgroundClassName = "bg-muted";
    const arrowColor = colors.mutedForeground;
    const cardTextClassName = "text-foreground";

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

        onPress?.(reservation);
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={({ pressed }) => getPressedScaleStyle(pressed, disabled, 0.99)}
        >
            <Card
                className={`flex-col gap-3 overflow-hidden rounded-2xl border-border p-5 ${cardBackgroundClassName}`}
            >
                <View className="flex-row items-center gap-3">
                    <View className={`h-2.5 w-2.5 rounded-full ${tone.dotClassName}`} />

                    <AppText
                        variant="label"
                        className={`min-w-0 flex-1 font-medium ${cardTextClassName}`}
                        numberOfLines={1}
                    >
                        {title}
                    </AppText>

                </View>

                <View className="flex-row items-center gap-3">
                    <ReservationDateBadge date={startDate} isReservedUpcoming={isReservedUpcoming} />

                    <View className="min-w-0 flex-1 flex-col justify-center gap-3">
                        <AppText
                            variant="body"
                            className={`text-lg font-semibold ${cardTextClassName}`}
                        >
                            {fmtTime(startDate)} - {fmtTime(endDate)}
                        </AppText>

                        {secondaryLabel ? (
                            <AppText
                                variant="badge"
                                className={secondaryClassName}
                                numberOfLines={1}
                            >
                                {secondaryLabel}
                            </AppText>
                        ) : null}
                    </View>

                    <View className={`h-9 w-9 items-center justify-center rounded-full ${arrowBackgroundClassName}`}>
                        <ChevronRight
                            size={18}
                            color={arrowColor}
                            strokeWidth={2.3}
                        />
                    </View>
                </View>
            </Card>
        </Pressable>
    );
}

function areReservationCardsEqual(prev: Props, next: Props) {
    const previousReservation = prev.reservation;
    const nextReservation = next.reservation;

    return (
        prev.disabled === next.disabled &&
        prev.onPress === next.onPress &&
        previousReservation.id === nextReservation.id &&
        previousReservation.reservationType === nextReservation.reservationType &&
        previousReservation.ticketType === nextReservation.ticketType &&
        previousReservation.startTime === nextReservation.startTime &&
        previousReservation.endTime === nextReservation.endTime &&
        previousReservation.bayName === nextReservation.bayName &&
        previousReservation.lessonAvailabilityName ===
            nextReservation.lessonAvailabilityName &&
        previousReservation.lessonProgramGroupName ===
            nextReservation.lessonProgramGroupName &&
        previousReservation.lessonProgramName === nextReservation.lessonProgramName
    );
}

function ReservationDateBadge({
    date,
    isReservedUpcoming,
}: {
    date: Date;
    isReservedUpcoming: boolean;
}) {
    return (
        <View
            className="h-[82px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
        >
            <View className="flex-1 items-center justify-center px-2">
                <AppText
                    variant="badge"
                    className="text-muted-foreground"
                    numberOfLines={1}
                >
                    {format(date, "MMM").toUpperCase()}
                </AppText>

                <AppText
                    variant="h2"
                    className="text-foreground"
                    numberOfLines={1}
                    style={{ fontVariant: ["tabular-nums"] }}
                >
                    {format(date, "dd")}
                </AppText>
            </View>
        </View>
    );
}

export default memo(ReservationCard, areReservationCardsEqual);
