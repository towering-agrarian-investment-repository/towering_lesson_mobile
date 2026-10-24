import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import {
  EmptyState,
  ErrorState,
  getPressedScaleStyle,
  Screen,
  Skeleton,
} from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { formatTicketTypeLabel } from "@/design-system/utils/ticket-type";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import type { BaySlotGroupScheduleResponse } from "@/types/member-bay";
import { getBaySlotAvailability } from "@/utils/bay-slot";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

type TimeSlotItem = {
  group: BaySlotGroupScheduleResponse;
  availableBayCount: number;
};

function getAvailableBayCount(group: BaySlotGroupScheduleResponse) {
  return group.baySlots.filter(
    (slot) => !getBaySlotAvailability(slot).isDisabled,
  ).length;
}

function ItemSeparator() {
  return <View className="h-3" />;
}

export default function TimeScreen() {
  const { t } = useTranslation();
  const { date, ticketId, ticketName, ticketType, mode, reservationId, notes } =
    useLocalSearchParams<{
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
  const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
    usePullToRefresh(() => refetch({ cancelRefetch: false }));
  const hasLoadError = isError && !data;

  const slotGroups = useMemo<TimeSlotItem[]>(
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

  const handleSelect = useCallback(
    (group: BaySlotGroupScheduleResponse) => {
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
    },
    [
      date,
      mode,
      notes,
      reservationId,
      router,
      runWithNavigationLock,
      ticketId,
      ticketName,
      ticketType,
    ],
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

  return (
    <Screen scroll={false} contentClassName="min-h-0 gap-6">
      <BookingStepHeader
        step={2}
        totalSteps={4}
        context={bookingContext}
        selectionTrail={[bookingContext, formatDateValue(date, "M.d")]}
      />
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
          actionLabel={
            isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")
          }
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
          keyExtractor={({ group }) => String(group.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={ItemSeparator}
          refreshControl={
            <RefreshControl
              refreshing={isPullRefreshing}
              onRefresh={handlePullRefresh}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      ) : null}
    </Screen>
  );
}

type TimeSlotCardProps = {
  group: BaySlotGroupScheduleResponse;
  availableBayCount: number;
  isLocked: boolean;
  onSelect: (group: BaySlotGroupScheduleResponse) => void;
};

const TimeSlotCard = memo(function TimeSlotCard({
  group,
  availableBayCount,
  isLocked,
  onSelect,
}: TimeSlotCardProps) {
  const { t } = useTranslation();
  const timeRange = formatTimeRange(group.startDateTime, group.endDateTime);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={timeRange}
      accessibilityState={{ disabled: isLocked }}
      className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-4"
      style={({ pressed }) => getPressedScaleStyle(pressed, isLocked, 0.99)}
      onPress={() => onSelect(group)}
      disabled={isLocked}
    >
      <View className="min-w-0 flex-1 gap-1">
        <AppText variant="h3">{timeRange}</AppText>

        <AppText
          variant="meta"
          className="text-foreground/75"
        >
          {t("booking.baysAvailable", {
            count: availableBayCount,
          })}
        </AppText>
      </View>

      <View className="rounded-full bg-primary/10 px-3 py-1.5">
        <AppText variant="badge" color="primary" wrap={false}>
          {t("booking.select")}
        </AppText>
      </View>
    </Pressable>
  );
});
