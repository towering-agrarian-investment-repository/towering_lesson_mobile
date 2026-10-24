import { AvailabilityConflictNotice } from "@/components/golf/booking/AvailabilityConflictNotice";
import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import {
  cn,
  EmptyState,
  ErrorState,
  AnimatedPressable,
  Screen,
  Skeleton,
} from "@/design-system";
import { NativeText } from "@/design-system/components/NativeText";
import { useTheme } from "@/design-system/utils/theme";
import { formatTicketTypeLabel } from "@/design-system/utils/ticket-type";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import type { BaySlotScheduleResponse } from "@/types/member-bay";
import { getBaySlotAvailability } from "@/utils/bay-slot";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

const GRID_COLUMNS = 3;
const LOADING_ITEMS = Array.from({ length: 6 }, (_, index) => index);

function chunkItems<T>(items: T[], size: number) {
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

function BayGrid<T>({
  items,
  keyExtractor,
  renderItem,
}: {
  items: T[];
  keyExtractor: (item: T) => string | number;
  renderItem: (item: T) => ReactNode;
}) {
  const rows = useMemo(() => chunkItems(items, GRID_COLUMNS), [items]);

  return (
    <View className="gap-3">
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-3">
          {row.map((item) => (
            <View key={keyExtractor(item)} className="flex-1">
              {renderItem(item)}
            </View>
          ))}

          {Array.from(
            { length: GRID_COLUMNS - row.length },
            (_, fillerIndex) => (
              <View
                key={`filler-${rowIndex}-${fillerIndex}`}
                className="flex-1"
              />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

function BayCardSkeleton() {
  return (
    <View className="rounded-xl border border-border bg-card px-3 py-4">
      <View className="items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </View>
    </View>
  );
}

type BayCardProps = {
  bay: BaySlotScheduleResponse;
  wasJustBooked: boolean;
  isLocked: boolean;
  onSelect: (bay: BaySlotScheduleResponse) => void;
};

const BayCard = memo(function BayCard({
  bay,
  wasJustBooked,
  isLocked,
  onSelect,
}: BayCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const {
    isBlocked,
    isReserved,
    isDisabled: isUnavailable,
  } = getBaySlotAvailability(bay);
  const isDisabled = isUnavailable || wasJustBooked;

  const statusLabel = wasJustBooked
    ? t("booking.justBooked")
    : isBlocked
      ? t("booking.statusBlocked")
      : isReserved
        ? t("booking.statusBooked")
        : isDisabled
          ? t("booking.statusUnavailable")
          : t("booking.statusAvailable");

  const badgeColor = wasJustBooked
    ? colors.warning
    : !isDisabled
      ? colors.primary
      : colors.mutedForeground;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${bay.bayName}, ${statusLabel}`}
      accessibilityState={{ disabled: isDisabled || isLocked }}
      className={cn(
        "items-center gap-2 rounded-2xl border px-3 py-4",
        wasJustBooked
          ? "border-warning/40 bg-warning/10 opacity-80"
          : !isDisabled
            ? "border-border bg-card"
            : "border-muted bg-muted opacity-55",
      )}
      onPress={() => onSelect(bay)}
      disabled={isDisabled || isLocked}
    >
      <NativeText
        variant="label"
        align="center"
        wrap={false}
        textStyle={{
          color: !isDisabled ? colors.foreground : colors.mutedForeground,
        }}
      >
        {bay.bayName}
      </NativeText>

      <View
        className={cn(
          "rounded-full px-2.5 py-1",
          wasJustBooked
            ? "bg-warning/15"
            : !isDisabled
              ? "bg-primary/10"
              : "bg-muted",
        )}
      >
        <NativeText
          variant="badge"
          align="center"
          wrap={false}
          textStyle={{ color: badgeColor }}
        >
          {statusLabel}
        </NativeText>
      </View>
    </AnimatedPressable>
  );
});

export default function BayScreen() {
  const { t } = useTranslation();
  const {
    date,
    ticketId,
    ticketName,
    ticketType,
    slotGroupId,
    startTime,
    endTime,
    mode,
    reservationId,
    notes,
    conflictMessage,
    conflictSlotId,
    conflictId,
  } = useLocalSearchParams<{
    date: string;
    ticketId?: string;
    ticketName: string;
    ticketType?: string;
    slotGroupId?: string;
    startTime?: string;
    endTime?: string;
    mode?: string;
    reservationId?: string;
    notes?: string;
    conflictMessage?: string;
    conflictSlotId?: string;
    conflictId?: string;
  }>();

  const router = useRouter();
  const { isLocked, runWithNavigationLock } = useNavigationLock();
  const [dismissedConflictId, setDismissedConflictId] = useState<string>();

  const { data, isLoading, isError, refetch, isRefetching } =
    useMemberBaySlotGroups(date, date, Boolean(date));
  const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
    usePullToRefresh(() => refetch({ cancelRefetch: false }));
  const hasLoadError = isError && !data;

  const slotGroup = (data?.data ?? []).find(
    (group) => String(group.id) === slotGroupId,
  );
  const visibleConflictMessage =
    dismissedConflictId === conflictId ? undefined : conflictMessage;
  const bookingContext = formatTicketTypeLabel(ticketType, t) || ticketName;

  const handleSelect = useCallback(
    (baySlot: BaySlotScheduleResponse) => {
      if (!slotGroup) return;

      runWithNavigationLock(() => {
        setDismissedConflictId(conflictId);
        router.push({
          pathname: "/bay-booking-confirm",
          params: {
            date,
            ticketId,
            ticketName,
            ticketType,
            slotGroupId: String(slotGroup.id),
            baySlotId: String(baySlot.id),
            bayName: baySlot.bayName,
            startTime: slotGroup.startDateTime,
            endTime: slotGroup.endDateTime,
            mode,
            reservationId,
            notes,
          },
        });
      });
    },
    [
      conflictId,
      date,
      mode,
      notes,
      reservationId,
      router,
      runWithNavigationLock,
      slotGroup,
      ticketId,
      ticketName,
      ticketType,
    ],
  );

  return (
    <Screen
      contentClassName="gap-6"
      refreshControl={
        <RefreshControl
          refreshing={isPullRefreshing}
          onRefresh={handlePullRefresh}
        />
      }
    >
      <BookingStepHeader
        step={3}
        totalSteps={4}
        context={bookingContext}
        selectionTrail={[
          bookingContext,
          formatDateValue(date, "M.d"),
          formatTimeRange(
            startTime ?? slotGroup?.startDateTime,
            endTime ?? slotGroup?.endDateTime,
          ),
        ]}
      />

      {visibleConflictMessage ? (
        <AvailabilityConflictNotice
          key={conflictId}
          message={visibleConflictMessage}
        />
      ) : null}

      {isLoading ? (
        <BayGrid
          items={LOADING_ITEMS}
          keyExtractor={(item) => item}
          renderItem={() => <BayCardSkeleton />}
        />
      ) : null}

      {hasLoadError ? (
        <ErrorState
          title={t("booking.failedBaysTitle")}
          message={t("common.pullToRefreshAndTryAgain")}
          actionLabel={
            isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")
          }
          actionPending={isRefetching || isPullRefreshing}
          onAction={handlePullRefresh}
        />
      ) : null}

      {!isLoading && !hasLoadError && !slotGroup ? (
        <EmptyState
          title={t("booking.timeNoLongerAvailableTitle")}
          message={t("booking.timeNoLongerAvailableMessage")}
          actionLabel={t("booking.chooseAnotherTime")}
          onAction={() => {
            runWithNavigationLock(() =>
              router.dismissTo({
                pathname: "/select-time",
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

      {!isLoading && !hasLoadError && slotGroup ? (
        <BayGrid
          items={slotGroup.baySlots}
          keyExtractor={(bay) => bay.id}
          renderItem={(bay) => (
            <BayCard
              bay={bay}
              wasJustBooked={Boolean(
                visibleConflictMessage && conflictSlotId === String(bay.id),
              )}
              isLocked={isLocked}
              onSelect={handleSelect}
            />
          )}
        />
      ) : null}
    </Screen>
  );
}
