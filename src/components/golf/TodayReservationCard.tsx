import { getPressedScaleStyle, triggerSelectionHaptic } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { getTicketTypeTone } from "@/design-system/utils/ticket-type";
import { useTheme } from "@/design-system/utils/theme";
import type { MemberReservationSummaryResponse } from "@/types/member-reservation";
import { formatTimeRange } from "@/utils/time-helper";
import { getReservationStatusColor, getReservationStatusLabel } from "@/utils/status-tone";
import { Link } from "expo-router";
import { BookOpen, ChevronRight, Flag, UserRound, UsersRound } from "lucide-react-native";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

type Props = {
    reservation: MemberReservationSummaryResponse;
};

function TodayReservationCard({ reservation }: Props) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const tone = getTicketTypeTone(reservation.ticketType);
    const Icon = tone.name === "bayUsage" ? Flag
        : tone.name === "privateLesson" ? UserRound
            : tone.name === "groupLesson" ? UsersRound : BookOpen;
    const title = reservation.bayName ?? reservation.lessonAvailabilityName
        ?? reservation.lessonProgramGroupName ?? reservation.lessonProgramName
        ?? t("reservations.reservationFallbackWithId", { id: reservation.id });
    const backendStatusLabel = getReservationStatusLabel(reservation.reservationStatus, t);
    const statusLabel = backendStatusLabel === "-"
        ? t("reservations.statusUnavailable")
        : backendStatusLabel;
    const statusColor = getReservationStatusColor(colors, reservation.reservationStatus);

    return (
        <Link
            href={{
                pathname: "/reservation/[id]",
                params: { id: String(reservation.id), type: reservation.reservationType },
            }}
            asChild
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("reservations.openLabel", { title })}
                className="min-h-16 w-full flex-row items-center gap-3 rounded-xl bg-card px-2 py-2"
                style={({ pressed }) => getPressedScaleStyle(pressed, false, 0.99)}
                onPress={triggerSelectionHaptic}
            >
                <View className={`h-12 w-12 shrink-0 items-center justify-center rounded-lg ${tone.badgeSolidClassName}`}>
                    <Icon size={24} color={colors.primaryForeground} strokeWidth={2.3} />
                </View>
                <View className="min-w-0 flex-1 gap-0.5">
                    <AppText variant="label" numberOfLines={1}>{title}</AppText>
                    <AppText variant="label" numberOfLines={1}
                        textStyle={{ fontWeight: "600" }}>
                        {formatTimeRange(reservation.startTime, reservation.endTime)}
                    </AppText>
                    <AppText variant="subtext" wrap={false}
                        textStyle={{ color: statusColor, fontWeight: "700" }}>
                        {statusLabel}
                    </AppText>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
            </Pressable>
        </Link>
    );
}

export default memo(TodayReservationCard);
