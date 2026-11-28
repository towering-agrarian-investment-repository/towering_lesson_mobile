import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import { AvailabilityConflictNotice } from "@/components/golf/booking/AvailabilityConflictNotice";
import { EmptyState, ErrorState, AnimatedPressable, Screen, Skeleton } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { formatTicketTypeLabel } from "@/design-system/utils/ticket-type";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import type { MemberBaySlotGroupResponse } from "@/types/member-bay";
import { formatDateShort, formatTimeRange } from "@/utils/time-helper";
import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, View } from "react-native";

function ItemSeparator() {
    return <View className="h-3" />;
}

const slotGroupKeyExtractor = (group: MemberBaySlotGroupResponse) => String(group.id);
const SLOT_LIST_CONTENT_STYLE = { paddingBottom: 24 } as const;

export default function TimeScreen() {
    const { t } = useTranslation();
    const { date, ticketId, ticketName, ticketType, mode, reservationId, notes, conflictMessage, conflictId } =
        useLocalSearchParams<{
            date: string;
            ticketId?: string;
            ticketName: string;
            ticketType?: string;
            mode?: string;
            reservationId?: string;
            notes?: string;
            conflictMessage?: string;
            conflictId?: string;
        }>();

    const router = useRouter();
    const isFocused = useIsFocused();
    const { runWithNavigationLock } = useNavigationLock();
    const [dismissedConflictId, setDismissedConflictId] = useState<string>();
    const ticketIdNumber = Number(ticketId);
    const hasTicketId = Number.isSafeInteger(ticketIdNumber) && ticketIdNumber > 0;
    const originalReservationId = Number(reservationId);
    const hasRescheduleContext = Number.isSafeInteger(originalReservationId) && originalReservationId > 0;
    const isRescheduleMode = mode === "reschedule";

    const {
        data,
        isLoading: isSlotLoading,
        isPlaceholderData,
        isError,
        refetch,
        isRefetching,
    } = useMemberBaySlotGroups(ticketIdNumber, date, date, {
        enabled: Boolean(date) && (!isRescheduleMode || hasRescheduleContext),
        refetchOnWindowFocus: isFocused,
        rescheduleReservationId: isRescheduleMode && hasRescheduleContext ? originalReservationId : undefined,
    });
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        refetch({ cancelRefetch: false }),
    );
    const isLoading = isSlotLoading || isPlaceholderData;
    const hasLoadError = isError && !data;

    const slotGroups = data?.data ?? [];
    const bookingContext = formatTicketTypeLabel(ticketType, t) || ticketName;

    const handleSelect = useCallback(
        (group: MemberBaySlotGroupResponse) => {
            runWithNavigationLock(() => {
                setDismissedConflictId(conflictId);
                router.push({
                    pathname: "/bay-booking-confirm",
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
        },
        [conflictId, date, mode, notes, reservationId, router, runWithNavigationLock, ticketId, ticketName, ticketType],
    );

    const renderItem = useCallback(
        ({ item }: { item: MemberBaySlotGroupResponse }) => <TimeSlotCard group={item} onSelect={handleSelect} />,
        [handleSelect],
    );

    if (!hasTicketId || (isRescheduleMode && !hasRescheduleContext)) {
        return (
            <Screen>
                <EmptyState
                    title={t(
                        hasTicketId
                            ? "bookingConfirmation.reservationInfoMissing"
                            : "bookingConfirmation.ticketInfoMissing",
                    )}
                    actionLabel={t("tickets.sectionTitle")}
                    onAction={() => runWithNavigationLock(() => router.dismissTo("/tickets"))}
                />
            </Screen>
        );
    }

    return (
        <Screen scroll={false} contentClassName="min-h-0 gap-6">
            <BookingStepHeader
                step={2}
                totalSteps={3}
                context={bookingContext}
                selectionTrail={[bookingContext, formatDateShort(date)]}
            />
            {conflictMessage && dismissedConflictId !== conflictId ? (
                <AvailabilityConflictNotice message={conflictMessage} />
            ) : null}
            {isLoading ? (
                <View className="items-center justify-center gap-3 py-2">
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton key={index} className="h-14 w-full rounded-xl" />
                    ))}
                </View>
            ) : null}

            {hasLoadError ? (
                <ErrorState
                    title={t("booking.failedAvailableTimesTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            ) : null}

            {!isLoading && !hasLoadError && slotGroups.length === 0 ? (
                <EmptyState
                    title={t("booking.noAvailableTimesTitle")}
                    message={t("booking.noAvailableTimesMessage")}
                    actionLabel={t("booking.chooseAnotherDate")}
                    onAction={() => {
                        runWithNavigationLock(() =>
                            router.dismissTo({
                                pathname: "/select-date",
                                params: {
                                    date,
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

            {!isLoading && !hasLoadError && slotGroups.length > 0 ? (
                <FlatList
                    className="min-h-0 flex-1"
                    data={slotGroups}
                    keyExtractor={slotGroupKeyExtractor}
                    renderItem={renderItem}
                    ItemSeparatorComponent={ItemSeparator}
                    refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
                    contentContainerStyle={SLOT_LIST_CONTENT_STYLE}
                    showsVerticalScrollIndicator={false}
                />
            ) : null}
        </Screen>
    );
}

type TimeSlotCardProps = {
    group: MemberBaySlotGroupResponse;
    onSelect: (group: MemberBaySlotGroupResponse) => void;
};

const TimeSlotCard = memo(function TimeSlotCard({ group, onSelect }: TimeSlotCardProps) {
    const { t } = useTranslation();
    const timeRange = formatTimeRange(group.startDateTime, group.endDateTime);
    const availabilityLabel = t("booking.baysAvailable", { count: group.totalReservableBaySlots });

    return (
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={`${timeRange}, ${availabilityLabel}`}
            haptic="selection"
            className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-4"
            onPress={() => onSelect(group)}
        >
            <View className="min-w-0 flex-1 gap-1">
                <AppText variant="h3">{timeRange}</AppText>

                <AppText variant="subtext" color="mutedForeground">
                    {availabilityLabel}
                </AppText>
            </View>

            <View className="rounded-full bg-primary/10 px-3 py-1.5">
                <AppText variant="badge" color="primary" wrap={false}>
                    {t("booking.select")}
                </AppText>
            </View>
        </AnimatedPressable>
    );
});
