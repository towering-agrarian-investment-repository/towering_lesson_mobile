import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import {
    AppText,
    EmptyState,
    ErrorState,
    Screen,
    Skeleton,
    triggerSelectionHaptic,
} from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import type { BaySlotGroupScheduleResponse } from "@/types/member-bay";
import { getBaySlotAvailability } from "@/utils/bay-slot";
import { formatType } from "@/utils/format-enum";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    Pressable,
    RefreshControl,
    View,
} from "react-native";

function getAvailableBayCount(group: BaySlotGroupScheduleResponse) {
    return group.baySlots.filter(
        (slot) => !getBaySlotAvailability(slot).isDisabled,
    ).length;
}

export default function TimeScreen() {
    const { t } = useTranslation();
    const { date, ticketId, ticketName, ticketType, mode, reservationId, notes } = useLocalSearchParams<{
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
        useMemberBaySlotGroups(
            date,
            date,
            Boolean(date),
        );

    const slotGroups = (data?.data ?? []).filter(
        (group) => getAvailableBayCount(group) > 0,
    );
    const bookingContext = formatType(ticketType) !== "-"
        ? formatType(ticketType)
        : ticketName;

    const handleSelect = (group: BaySlotGroupScheduleResponse) => {
        triggerSelectionHaptic();
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
        <Screen
            scroll={false}
            contentClassName="min-h-0 gap-6"
        >
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
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
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
                        router.back();
                    }}
                />
            ) : null}

            {!isLoading && !isError && slotGroups.length > 0 ? (
                <FlatList
                    className="min-h-0 flex-1"
                    data={slotGroups}
                    keyExtractor={(group) => String(group.id)}
                    renderItem={({ item: group }) => (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={formatTimeRange(
                                group.startDateTime,
                                group.endDateTime,
                            )}
                            className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-4"
                            style={({ pressed }) => ({
                                transform: [{ scale: pressed && !isLocked ? 0.992 : 1 }],
                            })}
                            onPress={() => handleSelect(group)}
                            disabled={isLocked}
                        >
                            <View className="min-w-0 flex-1 gap-1">
                                <AppText variant="h3" className="text-foreground">
                                    {formatTimeRange(
                                        group.startDateTime,
                                        group.endDateTime,
                                    )}
                                </AppText>

                                <AppText variant="meta" className="text-foreground/75">
                                    {t("booking.baysAvailable", {
                                        count: getAvailableBayCount(group),
                                    })}
                                </AppText>
                            </View>

                            <View className="rounded-full bg-primary/10 px-3 py-1.5">
                                <AppText variant="badge" className="text-primary">
                                    {t("booking.select")}
                                </AppText>
                            </View>
                        </Pressable>
                    )}
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
