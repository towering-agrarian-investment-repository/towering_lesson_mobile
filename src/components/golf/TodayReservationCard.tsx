import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import {
    getPressedScaleStyle,
    triggerSelectionHaptic,
    useThemeColors,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { getMemberReservationDetailQueryOptions } from "@/lib/hook/useReservation";
import { MemberReservationSummaryResponse } from "@/types/member-reservation";
import { formatTimeRange } from "@/utils/time-helper";
import { Host, Text } from "@expo/ui";
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const colors = useThemeColors();
    const isBayReservation = reservation.reservationType === "bay";
    const title = isBayReservation
        ? (reservation.bayName ?? t("reservations.bayFallback"))
        : (reservation.lessonAvailabilityName ?? t("reservations.fallback"));
    const timeLabel = formatTimeRange(
        reservation.startTime,
        reservation.endTime,
    );

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
                className="w-full bg-card px-4 py-3 active:bg-muted"
                style={({ pressed }) =>
                    getPressedScaleStyle(pressed, false, 0.992)
                }
                onPressIn={() => {
                    void queryClient.prefetchQuery(
                        getMemberReservationDetailQueryOptions(
                            reservation.id,
                            reservation.reservationType,
                        ),
                    );
                }}
                onPress={() => {
                    triggerSelectionHaptic();
                }}
            >
                <View className="min-w-0 flex-row items-center gap-2">
                    <View className="min-w-0 flex-1 gap-0.5">
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                numberOfLines={1}
                                textStyle={{
                                    ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                    fontWeight: "600" as const,
                                    color: uiColors.foreground,
                                    fontSize:
                                        typography.label.fontSize * uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                {title}
                            </Text>
                        </Host>

                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                numberOfLines={1}
                                textStyle={{
                                    ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                                    color: uiColors.mutedForeground,
                                    fontSize:
                                        typography.meta.fontSize * uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                {timeLabel}
                            </Text>
                        </Host>
                    </View>

                    <ChevronRight size={15} color={colors.mutedForeground} />
                </View>
            </Pressable>
        </Link>
    );
}

export default memo(TodayReservationCard);
