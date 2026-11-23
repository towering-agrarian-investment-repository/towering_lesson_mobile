import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import {
  cn,
  CompactEmptyState,
  EmptyState,
  ErrorState,
  Screen,
  Skeleton,
  triggerNotificationHaptic,
  triggerSelectionHaptic,
} from "@/design-system";
import { NativeText } from "@/design-system/components/NativeText";
import { useTheme } from "@/design-system/utils/theme";
import { formatTicketTypeLabel } from "@/design-system/utils/ticket-type";
import { applyCalendarLocale } from "@/lib/calendar-locale";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import {
  getMemberBaySlotGroupsQueryOptions,
  getMemberTicketLessonSlotsQueryOptions,
  useMemberBaySlotGroups,
  useMemberTicketLessonSlots,
} from "@/lib/hook/useReservation";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { showAppToast } from "@/lib/toast/toast";
import { isLessonSlotBookedByMember, isLessonSlotFull } from "@/utils/lesson-slot";
import { formatDateForAPI, formatDateValue } from "@/utils/time-helper";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

const LESSON_TICKET_TYPES = ["PRIVATE_LESSON", "GROUP_LESSON"];
const CALENDAR_WEEKDAY_PLACEHOLDERS = Array.from({ length: 7 }, (_, i) => i);
const CALENDAR_WEEK_PLACEHOLDERS = Array.from({ length: 6 }, (_, i) => i);

type VisibleMonth = { year: number; month: number };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseMonth(dateString: string): VisibleMonth {
  const [year, month] = dateString.split("-").map(Number);

  return { year, month };
}

// Built from plain numbers so the device time zone never shifts the range.
function getMonthRange({ year, month }: VisibleMonth) {
  const lastDay = new Date(year, month, 0).getDate();

  return {
    startDate: `${year}-${pad(month)}-01`,
    endDate: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
}

function isSameMonth(dateString: string, { year, month }: VisibleMonth) {
  const parsed = parseMonth(dateString);

  return parsed.year === year && parsed.month === month;
}

function CalendarLoadingSkeleton() {
  return (
    <View className="px-6">
      <View className="gap-5 rounded-xl border border-border bg-card px-4 py-5">
        <View className="flex-row items-center justify-between">
          <Skeleton className="h-5 w-24 rounded-md" />
          <View className="flex-row items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </View>
        </View>

        <View className="flex-row justify-between">
          {CALENDAR_WEEKDAY_PLACEHOLDERS.map((i) => (
            <Skeleton key={`weekday-${i}`} className="h-3 w-7 rounded-sm" />
          ))}
        </View>

        <View className="gap-4">
          {CALENDAR_WEEK_PLACEHOLDERS.map((weekIndex) => (
            <View key={`week-${weekIndex}`} className="flex-row justify-between">
              {CALENDAR_WEEKDAY_PLACEHOLDERS.map((dayIndex) => (
                <Skeleton
                  key={`day-${weekIndex}-${dayIndex}`}
                  className="h-9 w-9 rounded-full"
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

type DayCellProps = {
  dateString: string;
  day: number;
  today: string;
  isOutsideMonth: boolean;
  isAvailable: boolean;
  onPress: (dateString: string) => void;
};

const DayCell = memo(function DayCell({
  dateString,
  day,
  today,
  isOutsideMonth,
  isAvailable,
  onPress,
}: DayCellProps) {
  const { colors } = useTheme();

  const isPast = dateString < today;
  const isToday = dateString === today;
  const isAvailableFuture = isAvailable && !isPast;

  const textColor = isToday
    ? colors.success
    : isPast
      ? colors.mutedForeground
      : isAvailableFuture
        ? colors.primary
        : isOutsideMonth
          ? colors.mutedForeground + "b3"
          : colors.foreground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dateString}
      onPress={() => onPress(dateString)}
      className="min-h-10 min-w-10 items-center justify-center"
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      <View
        className={cn(
          "min-h-10 min-w-10 items-center justify-center rounded-full px-1",
          isToday
            ? "bg-success/15"
            : isAvailableFuture
              ? "bg-primary/10"
              : undefined,
        )}
      >
        <NativeText
          variant="body"
          align="center"
          style={{ minWidth: 40, opacity: isPast && !isToday ? 0.4 : 1 }}
          textStyle={{
            color: textColor,
            ...(isToday || isAvailableFuture
              ? { fontWeight: "700" as const }
              : null),
          }}
        >
          {String(day)}
        </NativeText>

        {isAvailableFuture ? (
          <View
            className={cn(
              "absolute bottom-0.5 h-1.5 w-1.5 rounded-full",
              isToday ? "bg-success" : "bg-primary",
            )}
          />
        ) : null}
      </View>
    </Pressable>
  );
});

export default function DateScreen() {
  const { colors, resolvedScheme, primaryColorPreference } = useTheme();
  const { i18n, t } = useTranslation();

  const { ticketId, ticketName, ticketType, mode, reservationId, notes } =
    useLocalSearchParams<{
      ticketId?: string;
      ticketName: string;
      ticketType?: string;
      mode?: string;
      reservationId?: string;
      notes?: string;
    }>();

  const router = useRouter();
  const queryClient = useQueryClient();
  const { runWithNavigationLock } = useNavigationLock();
  const { data: memberResponse } = useGetMemberProfile();
  const memberId = memberResponse?.data.id;

  const today = formatDateForAPI(new Date());
  const currentMonth = parseMonth(today);
  const currentMonthIndex = currentMonth.year * 12 + currentMonth.month;

  const [visibleMonth, setVisibleMonth] = useState<VisibleMonth>(() =>
    parseMonth(formatDateForAPI(new Date())),
  );

  const ticketIdNumber = Number(ticketId);
  const hasTicketId = Number.isSafeInteger(ticketIdNumber) && ticketIdNumber > 0;

  const isLessonTicket = LESSON_TICKET_TYPES.includes(
    String(ticketType ?? "").toUpperCase(),
  );

  const { startDate, endDate } = useMemo(
    () => getMonthRange(visibleMonth),
    [visibleMonth],
  );

  const {
    data: baySlotGroupData,
    refetch: refetchBaySlotGroups,
    isPending: isPendingBaySlotGroups,
    isRefetching: isRefetchingBaySlotGroups,
    isError: isErrorBaySlotGroups,
  } = useMemberBaySlotGroups(ticketIdNumber, startDate, endDate, !isLessonTicket);

  const {
    data: lessonSlotData,
    refetch: refetchLessonSlots,
    isPending: isPendingLessonSlots,
    isRefetching: isRefetchingLessonSlots,
    isError: isErrorLessonSlots,
  } = useMemberTicketLessonSlots(
    ticketIdNumber,
    visibleMonth.year,
    visibleMonth.month,
    isLessonTicket,
  );

  const canGoToPreviousMonth =
    visibleMonth.year * 12 + visibleMonth.month > currentMonthIndex;

  const availableDates = useMemo(() => {
    const dates = new Set<string>();

    if (isLessonTicket) {
      for (const slot of lessonSlotData?.data ?? []) {
        if (isLessonSlotFull(slot) || isLessonSlotBookedByMember(slot, memberId)) {
          continue;
        }
        const date = formatDateForAPI(slot.startTime);
        if (date) {
          dates.add(date);
        }
      }
    } else {
      for (const group of baySlotGroupData?.data ?? []) {
        if (group.totalReservableBaySlots > 0) {
          const date = formatDateForAPI(group.startDateTime);
          if (date) {
            dates.add(date);
          }
        }
      }
    }

    return dates;
  }, [baySlotGroupData, isLessonTicket, lessonSlotData, memberId]);

  const handleDayPress = useCallback(
    (dateString: string) => {
      const isPast = dateString < today;
      const isCurrentMonth = isSameMonth(dateString, visibleMonth);
      const isAvailable = availableDates.has(dateString);

      if (isPast || (!isAvailable && !isCurrentMonth)) {
        return;
      }

      if (isAvailable) {
        triggerSelectionHaptic();

        runWithNavigationLock(() => {
          if (!isLessonTicket && baySlotGroupData) {
            const dayQueryOptions = getMemberBaySlotGroupsQueryOptions(
              ticketIdNumber,
              dateString,
              dateString,
            );

            if (!queryClient.getQueryData(dayQueryOptions.queryKey)) {
              queryClient.setQueryData(
                dayQueryOptions.queryKey,
                {
                  ...baySlotGroupData,
                  data: baySlotGroupData.data.filter(
                    (group) =>
                      formatDateForAPI(group.startDateTime) === dateString,
                  ),
                },
                { updatedAt: 0 },
              );
            }

            // Keep the calendar data visible while the selected day refreshes.
            void queryClient.prefetchQuery(dayQueryOptions);
          }

          router.push({
            pathname: isLessonTicket ? "/select-lesson-slot" : "/select-time",
            params: isLessonTicket
              ? {
                  date: dateString,
                  ticketId,
                  ticketName,
                  ticketType,
                  notes,
                }
              : {
                  date: dateString,
                  ticketId,
                  ticketName,
                  ticketType,
                  mode,
                  reservationId,
                  notes,
                },
          });
        });

        return;
      }

      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);
      showAppToast({
        message: t("booking.unavailableDate", {
          date: formatDateValue(dateString, "EEE, MMM d"),
        }),
        type: "warning",
        duration: 2500,
        position: "bottom",
      });
    },
    [
      availableDates,
      baySlotGroupData,
      isLessonTicket,
      mode,
      notes,
      queryClient,
      reservationId,
      router,
      runWithNavigationLock,
      t,
      ticketId,
      ticketIdNumber,
      ticketName,
      ticketType,
      today,
      visibleMonth,
    ],
  );

  const renderDay = useCallback(
    ({ date, state }: { date?: DateData; state?: string }) => {
      if (!date) {
        return null;
      }

      return (
        <DayCell
          dateString={date.dateString}
          day={date.day}
          today={today}
          isOutsideMonth={state === "disabled"}
          isAvailable={availableDates.has(date.dateString)}
          onPress={handleDayPress}
        />
      );
    },
    [availableDates, handleDayPress, today],
  );

  const data = isLessonTicket ? lessonSlotData : baySlotGroupData;
  const isInitialLoading = isLessonTicket
    ? !lessonSlotData && isPendingLessonSlots
    : !baySlotGroupData && isPendingBaySlotGroups;
  const hasLoadError =
    (isLessonTicket ? isErrorLessonSlots : isErrorBaySlotGroups) && !data;
  const isRefetching = isLessonTicket
    ? isRefetchingLessonSlots
    : isRefetchingBaySlotGroups;

  const { refreshing: isPullRefreshing, onRefresh: handleRefresh } =
    usePullToRefresh(() =>
      isLessonTicket
        ? refetchLessonSlots({ cancelRefetch: false })
        : refetchBaySlotGroups({ cancelRefetch: false }),
    );

  const bookingContext =
    formatTicketTypeLabel(ticketType, t) || ticketName || t("common.noTicket");
  const calendarLocale = applyCalendarLocale(i18n.resolvedLanguage);

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
    <Screen
      contentClassName="gap-6"
      horizontalPadding={false}
      refreshControl={
        <RefreshControl
          refreshing={isPullRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
          progressBackgroundColor={colors.card}
          title={t("booking.refreshingAvailability")}
          titleColor={colors.mutedForeground}
        />
      }
    >
      <View className="px-6">
        <BookingStepHeader
          step={1}
          totalSteps={3}
          context={bookingContext}
          selectionTrail={[bookingContext]}
        />
      </View>

      <View className={hasLoadError ? "grow" : undefined}>
        {isInitialLoading ? (
          <CalendarLoadingSkeleton />
        ) : hasLoadError ? (
          <View className="grow px-6">
            <ErrorState
              title={t("booking.failedAvailableDatesTitle")}
              message={t("booking.failedAvailableDatesMessage")}
              actionLabel={
                isRefetching
                  ? t("common.refreshing")
                  : t("common.refreshTryAgain")
              }
              actionPending={isRefetching || isPullRefreshing}
              onAction={handleRefresh}
            />
          </View>
        ) : (
          <Calendar
            key={`${calendarLocale}-${resolvedScheme}-${primaryColorPreference}`}
            style={[s.calendar, { backgroundColor: colors.card }]}
            current={startDate}
            minDate={today}
            disableArrowLeft={!canGoToPreviousMonth}
            onDayPress={(day: DateData) => handleDayPress(day.dateString)}
            dayComponent={renderDay}
            onMonthChange={(month: DateData) => {
              triggerSelectionHaptic();
              const nextIndex = month.year * 12 + month.month;
              const next =
                nextIndex < currentMonthIndex
                  ? currentMonth
                  : { year: month.year, month: month.month };

              setVisibleMonth((prev) =>
                prev.year === next.year && prev.month === next.month
                  ? prev
                  : next,
              );

              if (hasTicketId) {
                const followingMonth: VisibleMonth =
                  next.month === 12
                    ? { year: next.year + 1, month: 1 }
                    : { year: next.year, month: next.month + 1 };

                if (isLessonTicket) {
                  void queryClient.prefetchQuery(
                    getMemberTicketLessonSlotsQueryOptions(
                      ticketIdNumber,
                      followingMonth.year,
                      followingMonth.month,
                    ),
                  );
                } else {
                  const followingRange = getMonthRange(followingMonth);
                  void queryClient.prefetchQuery(
                    getMemberBaySlotGroupsQueryOptions(
                      ticketIdNumber,
                      followingRange.startDate,
                      followingRange.endDate,
                    ),
                  );
                }
              }
            }}
            renderArrow={(dir) => (
              <Ionicons
                name={dir === "left" ? "chevron-back" : "chevron-forward"}
                size={20}
                color={colors.primary}
              />
            )}
            theme={{
              calendarBackground: colors.card,
              monthTextColor: colors.foreground,
              // @ts-ignore react-native-calendars supports this theme property at runtime.
              monthTextFontWeight: "700",
              textSectionTitleColor: colors.foreground,
              textSectionTitleDisabledColor: colors.foreground,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.primaryForeground,
              todayTextColor: colors.primary,
              textDisabledColor: colors.mutedForeground,
              dayTextColor: colors.mutedForeground,
              // @ts-ignore
              "stylesheet.calendar.main": {
                week: {
                  marginTop: 18,
                  marginBottom: 18,
                  flexDirection: "row",
                  justifyContent: "space-between",
                },
              },
            }}
          />
        )}
        {!isInitialLoading && !hasLoadError && availableDates.size === 0 ? (
          <View className="px-6 pt-3">
            <CompactEmptyState
              title={t("booking.noAvailableDatesTitle", {
                defaultValue: "No available dates this month",
              })}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  calendar: {
    minHeight: 520,
  },
});
