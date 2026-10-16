import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import { EmptyState, ErrorState, Screen, Skeleton } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { formatTicketTypeLabel } from "@/design-system/utils/ticket-type";
import { typography } from "@/design-system/utils/typography";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import type { BaySlotGroupScheduleResponse } from "@/types/member-bay";
import { getBaySlotAvailability } from "@/utils/bay-slot";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { Host, Text } from "@expo/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

function getAvailableBayCount(group: BaySlotGroupScheduleResponse) {
    return group.baySlots.filter(
        (slot) => !getBaySlotAvailability(slot).isDisabled,
    ).length;
}

export default function TimeScreen() {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const {
        date,
        ticketId,
        ticketName,
        ticketType,
        mode,
        reservationId,
        notes,
    } = useLocalSearchParams<{
        date: string;
        ticketId?: string;
        ticketName: string;
        ticketType?: string;
        mode?: string;
        reservationId?: string;
        notes?: string;
    }>();

    const router = useRouter();
    const { isLocked, runWithNavigationLock } = useNavigationLock();

    const { data, isLoading, isError, refetch, isRefetching } =
        useMemberBaySlotGroups(date, date, Boolean(date));

    const slotGroups = useMemo(
        () =>
            (data?.data ?? [])
                .map((group) => ({
                    group,
                    availableBayCount: getAvailableBayCount(group),
                }))
                .filter((item) => item.availableBayCount > 0),
        [data?.data],
    );
    const bookingContext = formatTicketTypeLabel(ticketType, t) || ticketName;

    const handleSelect = (group: BaySlotGroupScheduleResponse) => {
        runWithNavigationLock(() => {
            router.push({
                pathname: "/select-bay",
                params: {
                    date,
                    ticketId,
                    ticketName,
                    ticketType,
                    slotGroupId: String(group.id),
                    startTime: group.startDateTime,
                    endTime: group.endDateTime,
                    mode,
                    reservationId,
                    notes,
                },
            });
        });
    };

    return (
        <Screen maxWidth={960} scroll={false} contentClassName="min-h-0 gap-6">
            <BookingStepHeader
                step={2}
                totalSteps={4}
                context={bookingContext}
                selectionTrail={[bookingContext, formatDateValue(date, "M.d")]}
            />
            {isLoading ? (
                <View className="items-center justify-center gap-3 py-2">
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton
                            key={index}
                            className="h-14 w-full rounded-xl"
                        />
                    ))}
                </View>
            ) : null}

            {isError ? (
                <ErrorState
                    title={t("booking.failedAvailableTimesTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={
                        isRefetching
                            ? t("common.refreshing")
                            : t("common.refreshTryAgain")
                    }
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : null}

            {!isLoading && !isError && slotGroups.length === 0 ? (
                <EmptyState
                    title={t("booking.noAvailableTimesTitle")}
                    message={t("booking.noAvailableTimesMessage")}
                    actionLabel={t("booking.chooseAnotherDate")}
                    onAction={() => {
                        runWithNavigationLock(() =>
                            router.dismissTo({
                                pathname: "/select-date",
                                params: {
                                    ticketId,
                                    ticketName,
                                    ticketType,
                                    mode,
                                    reservationId,
                                    notes,
                                },
                            }),
                        );
                    }}
                />
            ) : null}

            {!isLoading && !isError && slotGroups.length > 0 ? (
                <FlatList
                    className="min-h-0 flex-1"
                    data={slotGroups}
                    keyExtractor={({ group }) => String(group.id)}
                    renderItem={({ item }) => {
                        const { group, availableBayCount } = item;

                        return (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={formatTimeRange(
                                    group.startDateTime,
                                    group.endDateTime,
                                )}
                                className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-4"
                                onPress={() => handleSelect(group)}
                                disabled={isLocked}
                            >
                                <View className="min-w-0 flex-1 gap-1">
                                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                        <Text
                                            textStyle={{
                                                ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale,
                                                color: uiColors.foreground,
                                                fontSize:
                                                    typography.h3.fontSize *
                                                    uiFontScale,
                                            }}
                                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                            {formatTimeRange(
                                                group.startDateTime,
                                                group.endDateTime,
                                            )}
                                        </Text>
                                    </Host>

                                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                        <Text
                                            textStyle={{
                                                ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                                                color:
                                                    uiColors.foreground + "bf",
                                                fontSize:
                                                    typography.meta.fontSize *
                                                    uiFontScale,
                                            }}
                                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                            {t("booking.baysAvailable", {
                                                count: availableBayCount,
                                            })}
                                        </Text>
                                    </Host>
                                </View>

                                <View className="rounded-full bg-primary/10 px-3 py-1.5">
                                    <Host matchContents ignoreSafeArea="all">
                                        <Text
                                            textStyle={{
                                                ...typography.badge, lineHeight: typography.badge.lineHeight * uiFontScale,
                                                color: uiColors.primary,
                                                fontSize:
                                                    typography.badge.fontSize *
                                                    uiFontScale,
                                            }}
                                        >
                                            {t("booking.select")}
                                        </Text>
                                    </Host>
                                </View>
                            </Pressable>
                        );
                    }}
                    ItemSeparatorComponent={() => <View className="h-3" />}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => {
                                void refetch();
                            }}
                        />
                    }
                    contentContainerStyle={{ paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={8}
                    maxToRenderPerBatch={8}
                    windowSize={7}
                />
            ) : null}
        </Screen>
    );
}
