import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import {
    getPressedScaleStyle,
    triggerSelectionHaptic,
    useThemeColors,
} from "@/design-system";
import { cn } from "@/design-system/utils/cn";
import { useTheme } from "@/design-system/utils/theme";
import { getTicketTypeTone } from "@/design-system/utils/ticket-type";
import { typography } from "@/design-system/utils/typography";
import type {
    MemberReservationResponse,
    MemberReservationSummaryResponse,
} from "@/types/member-reservation";
import { fmtTime } from "@/utils/time-helper";
import { Host, Text } from "@expo/ui";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react-native";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

type Props = {
    reservation: MemberReservationResponse | MemberReservationSummaryResponse;
    disabled?: boolean;
    onPress?: (
        reservation:
            MemberReservationResponse | MemberReservationSummaryResponse,
    ) => void;
};

function ReservationCard({ reservation, disabled = false, onPress }: Props) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const colors = useThemeColors();
    const startDate = new Date(reservation.startTime);
    const endDate = new Date(reservation.endTime);
    const [referenceTime] = useState(() => Date.now());
    const tone = getTicketTypeTone(reservation.ticketType);
    const minutesUntilStart = Math.ceil(
        (startDate.getTime() - referenceTime) / 60000,
    );
    const reservationStatus = String(
        reservation.reservationStatus,
    ).toUpperCase();
    const isReservedUpcoming =
        reservationStatus === "RESERVED" && minutesUntilStart >= 0;
    const isStartingSoon = isReservedUpcoming && minutesUntilStart <= 60;
    const countdownLabel =
        reservationStatus === "RESERVED" && minutesUntilStart >= 0
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
                        : reservationStatus === "RESERVED" && minutesUntilStart < 0
                            ? t("reservations.sessionTimePassed")
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
            : minutesUntilStart < 0
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

                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        style={{ flex: 1, minWidth: 0 }}
                    >
                        <Text
                            numberOfLines={1}
                            textStyle={{
                                ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                color: uiColors.foreground,
                                fontWeight: "500" as const,
                                fontSize:
                                    typography.label.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {title}
                        </Text>
                    </Host>
                </View>

                <View className="flex-row items-center gap-3">
                    <ReservationDateBadge date={startDate} />

                    <View className="min-w-0 flex-1 flex-col justify-center gap-3">
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                textStyle={{
                                    ...typography.body, lineHeight: typography.h3.lineHeight * uiFontScale,
                                    color: uiColors.foreground,
                                    fontSize: typography.subtitle.fontSize * uiFontScale,
                                    fontWeight: "600" as const,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                {fmtTime(startDate) + " - " + fmtTime(endDate)}
                            </Text>
                        </Host>

                        {secondaryLabel ? (
                            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                <Text
                                    numberOfLines={1}
                                    textStyle={{
                                        ...typography.badge, lineHeight: typography.badge.lineHeight * uiFontScale,
                                        color: secondaryColor,
                                        fontSize:
                                            typography.badge.fontSize *
                                            uiFontScale,
                                    }}
                                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                    {secondaryLabel}
                                </Text>
                            </Host>
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

function ReservationDateBadge({ date }: { date: Date }) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    return (
        <View className="h-[82px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            <View className="flex-1 items-center justify-center px-2">
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        numberOfLines={1}
                        textStyle={{ textAlign: "center",
                            ...typography.badge, lineHeight: typography.badge.lineHeight * uiFontScale,
                            color: uiColors.mutedForeground,
                            fontSize: typography.badge.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                        {format(date, "MMM").toUpperCase()}
                    </Text>
                </Host>

                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        numberOfLines={1}
                        textStyle={{ textAlign: "center",
                            ...typography.h2, lineHeight: typography.h2.lineHeight * uiFontScale,
                            color: uiColors.foreground,
                            fontSize: typography.h2.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                        {format(date, "dd")}
                    </Text>
                </Host>
            </View>
        </View>
    );
}

export default memo(ReservationCard, areReservationCardsEqual);
