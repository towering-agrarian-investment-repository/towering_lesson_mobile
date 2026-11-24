import { AnimatedPressable, cn } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { colorWithOpacity } from "@/design-system/utils/color";
import { formatTicketTypeLabel, getTicketTypeTone } from "@/design-system/utils/ticket-type";
import { useTheme } from "@/design-system/utils/theme";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { getMemberReservationDetailQueryOptions } from "@/lib/hook/useReservation";
import type { MemberReservationSummaryResponse } from "@/types/member-reservation";
import { formatTimeRange } from "@/utils/time-helper";
import { getReservationStatusColor, getReservationStatusLabel } from "@/utils/status-tone";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
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

type Props = {
    reservation: MemberReservationSummaryResponse;
};

function TodayReservationCard({ reservation }: Props) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const router = useRouter();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const reducedMotion = useReducedMotion();
    const tone = getTicketTypeTone(reservation.ticketType);
    const typeLabel = formatTicketTypeLabel(reservation.ticketType, t);
    const title =
        reservation.bayName ??
        reservation.lessonAvailabilityName ??
        reservation.lessonProgramGroupName ??
        reservation.lessonProgramName ??
        t("reservations.reservationFallbackWithId", { id: reservation.id });
    const backendStatusLabel = getReservationStatusLabel(reservation.reservationStatus, t);
    const statusLabel = backendStatusLabel === "-" ? t("reservations.statusUnavailable") : backendStatusLabel;
    const statusColor = getReservationStatusColor(colors, reservation.reservationStatus);
    const isCheckedIn = reservation.reservationStatus.toUpperCase() === "CHECKED_IN";
    const timeRange = formatTimeRange(reservation.startTime, reservation.endTime);

    return (
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={t("reservations.openLabel", { title })}
            disabled={isLocked}
            className="w-full rounded-2xl border border-border bg-card p-4"
            onPress={() => {
                void queryClient.prefetchQuery(
                    getMemberReservationDetailQueryOptions(reservation.id, reservation.reservationType),
                );
                runWithNavigationLock(() => {
                    router.push({
                        pathname: "/reservation/[id]",
                        params: {
                            id: String(reservation.id),
                            type: reservation.reservationType,
                        },
                    });
                });
            }}
        >
            <View className="gap-3">
                <View className="flex-row items-center justify-between gap-2">
                    <AppText
                        variant="subtext"
                        numberOfLines={1}
                        tabular
                        style={{ flex: 1, minWidth: 0 }}
                        textStyle={{ fontWeight: "700" }}
                    >
                        {timeRange}
                    </AppText>

                    <Animated.View
                        className="shrink-0 rounded-md px-2 py-0.5"
                        style={[
                            {
                                backgroundColor: colorWithOpacity(statusColor, 0.12),
                            },
                            isCheckedIn && !reducedMotion
                                ? {
                                      animationName: LIVE_PULSE_KEYFRAMES,
                                      animationDuration: "1600ms",
                                      animationIterationCount: "infinite",
                                      animationDirection: "alternate",
                                      animationTimingFunction: "ease-in-out",
                                  }
                                : undefined,
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
                        <AppText variant="body" numberOfLines={1} textStyle={{ fontWeight: "600" }}>
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
            </View>
        </AnimatedPressable>
    );
}

export default memo(TodayReservationCard);
