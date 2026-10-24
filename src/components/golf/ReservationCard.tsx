import { AppText } from "@/design-system/components/AppText";
import { AnimatedPressable, triggerSelectionHaptic } from "@/design-system";
import { colorWithOpacity } from "@/design-system/utils/color";
import { getTicketTypeTone } from "@/design-system/utils/ticket-type";
import { useTheme } from "@/design-system/utils/theme";
import type { MemberReservationResponse } from "@/types/member-reservation";
import { fmtTime } from "@/utils/time-helper";
import { getReservationStatusColor, getReservationStatusLabel } from "@/utils/status-tone";
import { BookOpen, ChevronRight, Clock3, Flag, UserRound, UsersRound } from "lucide-react-native";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type Props = {
    reservation: MemberReservationResponse;
    referenceTime: number;
    disabled?: boolean;
    onPress?: (reservation: MemberReservationResponse) => void;
};

function ReservationCard({ reservation, referenceTime, disabled = false, onPress }: Props) {
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const tone = getTicketTypeTone(reservation.ticketType);
    const Icon = tone.name === "bayUsage" ? Flag
        : tone.name === "privateLesson" ? UserRound
            : tone.name === "groupLesson" ? UsersRound : BookOpen;
    const title = reservation.bayName ?? reservation.lessonAvailabilityName
        ?? reservation.lessonProgramGroupName ?? reservation.lessonProgramName
        ?? t("reservations.reservationFallbackWithId", { id: reservation.id });
    const statusLabel = getReservationStatusLabel(reservation.reservationStatus, t);
    const statusColor = getReservationStatusColor(colors, reservation.reservationStatus);
    const startTime = new Date(reservation.startTime).getTime();
    const minutesUntilStart = Math.ceil((startTime - referenceTime) / 60000);
    const isReservedUpcoming = reservation.reservationStatus.toUpperCase() === "RESERVED" && startTime > referenceTime;
    const countdownLabel = isReservedUpcoming
        ? minutesUntilStart < 60
            ? t("booking.startsInMinutes", { count: minutesUntilStart })
            : minutesUntilStart < 1440
                ? t("booking.startsInHours", { count: Math.ceil(minutesUntilStart / 60) })
                : t("booking.startsInDays", { count: Math.ceil(minutesUntilStart / 1440) })
        : null;
    const duration = reservation.durationMinutes > 0
        ? reservation.durationMinutes % 60 === 0
            ? t("reservations.durationHour", {
                value: new Intl.NumberFormat(i18n.language).format(reservation.durationMinutes / 60),
            })
            : t("reservations.durationMinute", {
                value: new Intl.NumberFormat(i18n.language).format(reservation.durationMinutes),
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
            accessibilityLabel={`${title}, ${fmtTime(reservation.startTime)}, ${statusLabel}${countdownLabel ? `, ${countdownLabel}` : ""}`}
            className="min-h-20 flex-row items-center gap-2.5 border-b border-border bg-card px-3 py-3"
        >
            <View className="w-[72px] shrink-0 self-stretch justify-center border-r border-border pr-2">
                <AppText variant="body" numberOfLines={1} textStyle={{ fontWeight: "700" }}>
                    {fmtTime(reservation.startTime)}
                </AppText>
                {duration ? (
                    <AppText variant="meta" color="mutedForeground" numberOfLines={1}>
                        {duration}
                    </AppText>
                ) : null}
            </View>
            <View className="min-w-0 flex-1 gap-1.5">
                <View className="flex-row items-center gap-2.5">
                    <View className={`h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.badgeSolidClassName}`}>
                        <Icon size={20} color={colors.primaryForeground} strokeWidth={2.3} />
                    </View>
                    <View className="min-w-0 flex-1 justify-center gap-1">
                        <AppText variant="label" numberOfLines={2} textStyle={{ fontWeight: "700" }}>{title}</AppText>
                        <View className="self-start rounded-full px-2 py-1"
                            style={{ backgroundColor: colorWithOpacity(statusColor, 0.12) }}>
                            <AppText variant="badge" wrap={false} numberOfLines={1}
                                textStyle={{ color: statusColor }}>{statusLabel}</AppText>
                        </View>
                    </View>
                    <ChevronRight size={17} color={colors.mutedForeground} strokeWidth={2} />
                </View>
                {countdownLabel ? (
                    <View className="flex-row items-center gap-1.5">
                        <Clock3 size={13} color={colors.primary} strokeWidth={2.3} />
                        <AppText variant="badge" numberOfLines={2}
                            style={{ flex: 1, minWidth: 0 }}
                            textStyle={{ color: colors.primary, fontWeight: "600" }}>
                            {countdownLabel}
                        </AppText>
                    </View>
                ) : null}
            </View>
        </AnimatedPressable>
    );
}

export default memo(ReservationCard);
