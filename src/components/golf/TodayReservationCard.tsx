import {
    AppText as Text,
    getPressedScaleStyle,
    useThemeColors,
} from "@/design-system";
import { getMemberReservationDetailQueryOptions } from "@/lib/hook/useReservation";
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
                className="self-start rounded-xl border border-border bg-muted px-5 py-4"
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
                <View className="gap-1">
                    <Text
                        variant="label"
                        className="text-base font-semibold text-foreground"
                        numberOfLines={1}
                    >
                        {title}
                    </Text>

                    <View className="flex-row items-center justify-between gap-3">
                        <Text
                            className="text-sm text-muted-foreground"
                            numberOfLines={1}
                        >
                            {timeLabel}
                        </Text>

                        <ChevronRight size={16} color={colors.mutedForeground} />
                    </View>
                </View>
            </Pressable>
        </Link>
    );
}

export default memo(TodayReservationCard);
