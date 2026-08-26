import {
    AppText as Text,
    getPressedScaleStyle,
    useThemeColors,
} from "@/design-system";
import { getMemberReservationDetailQueryOptions } from "@/lib/hook/useReservation";
import { getTicketTypeTone } from "@/design-system/utils/ticket-type";
import { MemberReservationSummaryResponse } from "@/types/member-reservation";
import { formatTimeRange } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

type Props = {
    reservation: MemberReservationSummaryResponse;
};

function TodayReservationCard({ reservation }: Props) {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const colors = useThemeColors();
    const ticketTone = getTicketTypeTone(reservation.ticketType);
    const isBayReservation = reservation.reservationType === "bay";
    const title = isBayReservation
        ? reservation.bayName ?? t("reservations.bayFallback")
        : reservation.lessonAvailabilityName ?? t("reservations.fallback");
    const timeLabel = formatTimeRange(reservation.startTime, reservation.endTime);

    return (
        <Link
            href={{
                pathname: "/reservation/[id]",
                params: {
                    id: String(reservation.id),
                    type: reservation.reservationType,
                },
            }}
            asChild
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={title}
                className={`max-w-full self-start rounded-xl border px-4 py-3 ${ticketTone.borderClassName} ${ticketTone.surfaceClassName}`}
                style={({ pressed }) => getPressedScaleStyle(pressed, false, 0.992)}
                onPressIn={() => {
                    void queryClient.prefetchQuery(
                        getMemberReservationDetailQueryOptions(
                            reservation.id,
                            reservation.reservationType,
                        ),
                    );
                }}
            >
                <View className="min-w-0 flex-row items-center gap-2">
                    <View className="min-w-0 shrink gap-0.5">
                        <Text
                            variant="label"
                            className="font-semibold text-foreground"
                            numberOfLines={1}
                        >
                            {title}
                        </Text>

                        <Text
                            variant="meta"
                            className="text-muted-foreground"
                            numberOfLines={1}
                        >
                            {timeLabel}
                        </Text>
                    </View>

                    <ChevronRight size={15} color={colors.mutedForeground} />
                </View>
            </Pressable>
        </Link>
    );
}

export default memo(TodayReservationCard);
