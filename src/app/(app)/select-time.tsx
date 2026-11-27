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
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, View } from "react-native";

type TimeSlotItem = {
    group: MemberBaySlotGroupResponse;
    availableBayCount: number;
};

function ItemSeparator() {
    return <View className="h-3" />;
}

const slotGroupKeyExtractor = ({ group }: { group: MemberBaySlotGroupResponse }) => String(group.id);
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
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const [dismissedConflictId, setDismissedConflictId] = useState<string>();
    const ticketIdNumber = Number(ticketId);
    const hasTicketId = Number.isSafeInteger(ticketIdNumber) && ticketIdNumber > 0;

    const { data, isLoading, isError, refetch, isRefetching } = useMemberBaySlotGroups(
        ticketIdNumber,
        date,
        date,
        Boolean(date),
    );
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        refetch({ cancelRefetch: false }),
    );
    const hasLoadError = isError && !data;

    const allSlotGroups = useMemo<TimeSlotItem[]>(
        () =>
            (data?.data ?? []).map((group) => ({
                group,
                availableBayCount: group.totalReservableBaySlots,
            })),
        [data?.data],
    );
    const fullSlotCount = allSlotGroups.filter((item) => item.availableBayCount <= 0).length;
    const [showFullTimes, setShowFullTimes] = useState(false);
    const slotGroups = useMemo(
        () => (showFullTimes ? allSlotGroups : allSlotGroups.filter((item) => item.availableBayCount > 0)),
        [allSlotGroups, showFullTimes],
    );
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
        ({ item }: { item: TimeSlotItem }) => (
            <TimeSlotCard
                group={item.group}
                availableBayCount={item.availableBayCount}
                isLocked={isLocked}
                onSelect={handleSelect}
            />
        ),
        [handleSelect, isLocked],
    );

    if (!hasTicketId) {
        return (
            <Screen>
                <EmptyState
                    title={t("bookingConfirmation.ticketInfoMissing")}
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

            {!isLoading && !hasLoadError && slotGroups.length === 0 && fullSlotCount === 0 ? (
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

            {!isLoading && !hasLoadError && fullSlotCount > 0 ? (
                <AnimatedPressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: showFullTimes }}
                    className="min-h-12 items-center justify-center rounded-xl bg-muted px-4"
                    onPress={() => setShowFullTimes((current) => !current)}
                >
                    <AppText variant="label" color="primary" wrap={false}>
                        {showFullTimes
                            ? t("booking.hideFullTimes")
                            : t("booking.showFullTimes", { count: fullSlotCount })}
                    </AppText>
                </AnimatedPressable>
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
    availableBayCount: number;
    isLocked: boolean;
    onSelect: (group: MemberBaySlotGroupResponse) => void;
};

const TimeSlotCard = memo(function TimeSlotCard({ group, availableBayCount, isLocked, onSelect }: TimeSlotCardProps) {
    const { t } = useTranslation();
    const timeRange = formatTimeRange(group.startDateTime, group.endDateTime);
    const isFull = availableBayCount <= 0;
    const isDisabled = isLocked || isFull;

    return (
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={`${timeRange}, ${isFull ? t("booking.full") : t("booking.baysAvailable", { count: availableBayCount })}`}
            accessibilityState={{ disabled: isDisabled }}
            haptic={isFull ? false : "selection"}
            className={
                isFull
                    ? "flex-row items-center justify-between rounded-2xl border border-muted bg-muted px-4 py-4 opacity-60"
                    : "flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-4"
            }
            onPress={() => onSelect(group)}
            disabled={isDisabled}
        >
            <View className="min-w-0 flex-1 gap-1">
                <AppText variant="h3" color={isFull ? "mutedForeground" : "foreground"}>
                    {timeRange}
                </AppText>

                <AppText variant="subtext" color="mutedForeground">
                    {t("booking.baysAvailable", {
                        count: availableBayCount,
                    })}
                </AppText>
            </View>

            <View
                className={
                    isFull
                        ? "rounded-full bg-muted-foreground/10 px-3 py-1.5"
                        : "rounded-full bg-primary/10 px-3 py-1.5"
                }
            >
                <AppText variant="badge" color={isFull ? "mutedForeground" : "primary"} wrap={false}>
                    {isFull ? t("booking.full") : t("booking.select")}
                </AppText>
            </View>
        </AnimatedPressable>
    );
});
