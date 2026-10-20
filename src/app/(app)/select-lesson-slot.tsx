import { AvailabilityConflictNotice } from "@/components/golf/booking/AvailabilityConflictNotice";
import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import {
  cn,
  EmptyState,
  ErrorState,
  getPressedScaleStyle,
  Screen,
  Skeleton,
} from "@/design-system";
import { NativeText } from "@/design-system/components/NativeText";
import { useTheme } from "@/design-system/utils/theme";
import { formatTicketTypeLabel } from "@/design-system/utils/ticket-type";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { useMemberTicketLessonSlots } from "@/lib/hook/useReservation";
import type { MemberLessonSlotResponse } from "@/types/member-lesson";
import {
  getLessonSlotDisplayName,
  getLessonSpotsLeft,
  isGroupLessonSlot,
  isLessonSlotBookable,
  isLessonSlotFull,
} from "@/utils/lesson-slot";
import {
  formatDateForAPI,
  formatDateValue,
  formatTimeRange,
} from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { UserRound } from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

function formatSlotTime(slot: MemberLessonSlotResponse) {
  return formatTimeRange(slot.startTime, slot.endTime);
}

function getMinutesUntilStart(slot: MemberLessonSlotResponse, now: number) {
  const minutesUntilStart = (new Date(slot.startTime).getTime() - now) / 60000;

  return minutesUntilStart >= 0 ? Math.ceil(minutesUntilStart) : null;
}

function useMinuteTick() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  return now;
}

function ItemSeparator() {
  return <View className="h-3" />;
}

export default function SelectLessonSlotScreen() {
  const { t } = useTranslation();
  const {
    date,
    ticketId,
    ticketName,
    ticketType,
    notes,
    conflictMessage,
    conflictSlotId,
    conflictId,
  } = useLocalSearchParams<{
    date: string;
    ticketId?: string;
    ticketName: string;
    ticketType?: string;
    notes?: string;
    conflictMessage?: string;
    conflictSlotId?: string;
    conflictId?: string;
  }>();

  const router = useRouter();
  const { isLocked, runWithNavigationLock } = useNavigationLock();
  const now = useMinuteTick();
  const [dismissedConflictId, setDismissedConflictId] = useState<string>();
  const isGroupTicket =
    String(ticketType ?? "").toUpperCase() === "GROUP_LESSON";
  const visibleConflictMessage =
    dismissedConflictId === conflictId ? undefined : conflictMessage;

  const selectedDate = new Date(`${date}T12:00:00`);
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;
  const ticketIdNumber = ticketId ? Number(ticketId) : null;

  const { data, isLoading, isError, refetch, isRefetching } =
    useMemberTicketLessonSlots(
      ticketIdNumber,
      year,
      month,
      Boolean(ticketIdNumber),
    );
  const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
    usePullToRefresh(() => refetch({ cancelRefetch: false }));
  const hasLoadError = isError && !data;

  const slots = useMemo(
    () =>
      (data?.data ?? []).filter(
        (slot) => formatDateForAPI(slot.startTime) === date,
      ),
    [data?.data, date],
  );

  const handleSelect = useCallback(
    (slot: MemberLessonSlotResponse) => {
      runWithNavigationLock(() => {
        setDismissedConflictId(conflictId);
        router.push({
          pathname: "/lesson-booking-confirm",
          params: {
            ticketId,
            ticketName,
            ticketType,
            lessonAvailabilityId: String(slot.id),
            lessonName: getLessonSlotDisplayName(slot),
            coachName: slot.coachName ?? "",
            startTime: slot.startTime,
            endTime: slot.endTime,
            date,
            notes,
          },
        });
      });
    },
    [
      conflictId,
      date,
      notes,
      router,
      runWithNavigationLock,
      ticketId,
      ticketName,
      ticketType,
    ],
  );

  const renderSlot = useCallback(
    ({ item: slot }: { item: MemberLessonSlotResponse }) => (
      <LessonSlotCard
        slot={slot}
        now={now}
        isGroupTicket={isGroupTicket}
        wasJustBooked={Boolean(
          visibleConflictMessage && conflictSlotId === String(slot.id),
        )}
        isLocked={isLocked}
        onSelect={handleSelect}
      />
    ),
    [
      conflictSlotId,
      handleSelect,
      isGroupTicket,
      isLocked,
      now,
      visibleConflictMessage,
    ],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: isGroupTicket
            ? t("booking.selectGroupTitle")
            : t("booking.selectSlotTitle"),
        }}
      />

      <Screen maxWidth={960} scroll={false} contentClassName="min-h-0 gap-6">
        <BookingStepHeader
          step={2}
          totalSteps={3}
          context={formatTicketTypeLabel(ticketType, t) || ticketName}
          selectionTrail={[
            formatTicketTypeLabel(ticketType, t) || ticketName,
            formatDateValue(date, "M.d"),
          ]}
        />

        {visibleConflictMessage ? (
          <AvailabilityConflictNotice
            key={conflictId}
            message={visibleConflictMessage}
          />
        ) : null}

        {isLoading ? (
          <View className="items-center justify-center gap-3 py-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </View>
        ) : null}

        {hasLoadError ? (
          <ErrorState
            title={t("booking.failedLessonSlotsTitle")}
            message={t("common.pullToRefreshAndTryAgain")}
            actionLabel={
              isRefetching
                ? t("common.refreshing")
                : t("common.refreshTryAgain")
            }
            onAction={handlePullRefresh}
          />
        ) : null}

        {!isLoading && !hasLoadError && slots.length === 0 ? (
          <EmptyState
            title={
              isGroupTicket
                ? t("booking.noAvailableGroupsTitle")
                : t("booking.noLessonSlotsTitle")
            }
            message={
              isGroupTicket
                ? t("booking.noAvailableGroupsMessage")
                : t("booking.noLessonSlotsMessage")
            }
            actionLabel={t("booking.chooseAnotherDate")}
            onAction={() => {
              runWithNavigationLock(() =>
                router.dismissTo({
                  pathname: "/select-date",
                  params: {
                    ticketId,
                    ticketName,
                    ticketType,
                    notes,
                  },
                }),
              );
            }}
          />
        ) : null}

        {!isLoading && !hasLoadError && slots.length > 0 ? (
          <FlatList
            className="min-h-0 flex-1"
            data={slots}
            keyExtractor={(slot) => String(slot.id)}
            ItemSeparatorComponent={ItemSeparator}
            refreshControl={
              <RefreshControl
                refreshing={isPullRefreshing}
                onRefresh={handlePullRefresh}
              />
            }
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            renderItem={renderSlot}
          />
        ) : null}
      </Screen>
    </>
  );
}

type LessonSlotCardProps = {
  slot: MemberLessonSlotResponse;
  now: number;
  isGroupTicket: boolean;
  wasJustBooked: boolean;
  isLocked: boolean;
  onSelect: (slot: MemberLessonSlotResponse) => void;
};

const LessonSlotCard = memo(function LessonSlotCard({
  slot,
  now,
  isGroupTicket,
  wasJustBooked,
  isLocked,
  onSelect,
}: LessonSlotCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const isGroupSlot = isGroupTicket || isGroupLessonSlot(slot);
  const isBookable = isLessonSlotBookable(slot);
  const disabled = wasJustBooked || isLessonSlotFull(slot);
  const minutesUntilStart = disabled ? null : getMinutesUntilStart(slot, now);
  const startingSoon = minutesUntilStart != null && minutesUntilStart <= 60;
  const lessonTitle = getLessonSlotDisplayName(slot);

  const statusLabel = wasJustBooked
    ? t("booking.justBooked")
    : disabled
      ? isBookable
        ? t("booking.full")
        : t("booking.statusUnavailable")
      : isGroupSlot
        ? t("booking.spotsLeft", { count: getLessonSpotsLeft(slot) })
        : t("booking.statusAvailable");

  const countdownLabel =
    minutesUntilStart == null
      ? null
      : minutesUntilStart < 60
        ? t("booking.startsInMinutes", { count: minutesUntilStart })
        : minutesUntilStart < 1440
          ? t("booking.startsInHours", {
              count: Math.ceil(minutesUntilStart / 60),
            })
          : t("booking.startsInDays", {
              count: Math.ceil(minutesUntilStart / 1440),
            });

  const badgeColor = wasJustBooked
    ? colors.warning
    : disabled
      ? isGroupSlot
        ? colors.danger
        : colors.mutedForeground
      : startingSoon
        ? colors.warning
        : isGroupSlot
          ? colors.ticketGroup
          : colors.primary;

  const bodyColor = disabled
    ? colors.mutedForeground
    : colors.foreground + "bf";
  const coachLabel = slot.coachName || (isGroupSlot ? t("booking.tba") : "");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatSlotTime(slot)}, ${statusLabel}`}
      accessibilityState={{ disabled: disabled || isLocked }}
      disabled={disabled || isLocked}
      className={cn(
        "gap-2.5 border",
        isGroupSlot ? "rounded-2xl p-3.5" : "rounded-xl px-4 py-4",
        wasJustBooked
          ? "border-warning/40 bg-warning/10 opacity-80"
          : disabled
            ? isGroupSlot
              ? "border-border bg-muted/70 opacity-70"
              : "border-muted bg-muted opacity-55"
            : "border-border bg-card",
      )}
      style={({ pressed }) =>
        getPressedScaleStyle(pressed, disabled || isLocked, 0.99)
      }
      onPress={() => onSelect(slot)}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1.5">
          <NativeText
            variant="h3"
            textStyle={{
              color: disabled ? colors.mutedForeground : colors.foreground,
            }}
          >
            {formatSlotTime(slot)}
          </NativeText>

          <NativeText
            variant="meta"
            numberOfLines={isGroupSlot ? 1 : undefined}
            textStyle={{ color: bodyColor }}
          >
            {lessonTitle}
          </NativeText>
        </View>

        {isGroupSlot ? (
          <View className="shrink-0 items-end">
            <NativeText
              variant="caption"
              wrap={false}
              textStyle={{ color: colors.foreground + "99" }}
            >
              {t("booking.spots")}
            </NativeText>
            <NativeText
              variant="meta"
              wrap={false}
              textStyle={{
                color: disabled ? colors.mutedForeground : colors.foreground,
              }}
            >
              {`${slot.bookedCount ?? ""}/${slot.capacity ?? ""}`}
            </NativeText>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center justify-between gap-3">
        {coachLabel ? (
          <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
            <UserRound size={13} color={colors.mutedForeground} />
            <NativeText
              variant="meta"
              numberOfLines={1}
              style={{ flex: 1, minWidth: 0 }}
              textStyle={{ color: bodyColor }}
            >
              {coachLabel}
            </NativeText>
          </View>
        ) : (
          <View className="flex-1" />
        )}

        <NativeText
          variant="badge"
          wrap={false}
          textStyle={{ color: badgeColor }}
        >
          {countdownLabel ?? statusLabel}
        </NativeText>
      </View>

      {isGroupSlot && disabled ? (
        <NativeText variant="caption" color="danger" wrap={false}>
          {isBookable
            ? t("booking.fullViewOnly")
            : t("booking.unavailableViewOnly")}
        </NativeText>
      ) : null}
    </Pressable>
  );
});
