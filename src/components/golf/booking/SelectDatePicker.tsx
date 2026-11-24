import { AppText } from "@/design-system/components/AppText";
import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import {
    AnimatedPressable,
    cn,
    CompactEmptyState,
    EmptyState,
    ErrorState,
    Screen,
    triggerNotificationHaptic,
    triggerSelectionHaptic,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { formatTicketTypeLabel, isBookableTicketType } from "@/design-system/utils/ticket-type";
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
import { showAppToast } from "@/design-system/components/AppToast";
import { isLessonSlotBookedByMember, isLessonSlotFull } from "@/utils/lesson-slot";
import { formatDateForAPI, formatDateWeekday } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    AccessibilityInfo,
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    useWindowDimensions,
    View,
    type FlatListProps,
    type ListRenderItemInfo,
} from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { useReducedMotion } from "react-native-reanimated";

const LESSON_TICKET_TYPES = ["PRIVATE_LESSON", "GROUP_LESSON"];
const CALENDAR_BASE_MIN_HEIGHT = 368;
const MONTHS_PER_YEAR = 12;
const MONTH_VIEWABILITY = { itemVisiblePercentThreshold: 60 };

type VisibleMonth = { year: number; month: number };

function pad(value: number) {
    return String(value).padStart(2, "0");
}

function parseMonth(dateString: string): VisibleMonth {
    const [year, month] = dateString.split("-").map(Number);

    return { year, month };
}

function getMonthIndex({ year, month }: VisibleMonth) {
    return year * MONTHS_PER_YEAR + month - 1;
}

// Built from plain numbers so the device time zone never shifts the range.
function getMonthRange({ year, month }: VisibleMonth) {
    const lastDay = new Date(year, month, 0).getDate();

    return {
        startDate: `${year}-${pad(month)}-01`,
        endDate: `${year}-${pad(month)}-${pad(lastDay)}`,
    };
}

const monthKeyExtractor = (monthStart: string) => monthStart;

type DayCellProps = {
    dateString: string;
    day: number;
    today: string;
    dateFormatter: Intl.DateTimeFormat;
    isAvailabilityKnown: boolean;
    isAvailable: boolean;
    isSelected: boolean;
    onPress: (dateString: string) => void;
};

const DayCell = memo(function DayCell({
    dateString,
    day,
    today,
    dateFormatter,
    isAvailabilityKnown,
    isAvailable,
    isSelected,
    onPress,
}: DayCellProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    const isPast = dateString < today;
    const isToday = dateString === today;
    const isDisabled = isPast || !isAvailabilityKnown;
    const isAvailableFuture = isAvailable && !isPast;
    const dateLabel = dateFormatter.format(new Date(`${dateString}T12:00:00`));
    const statusLabel =
        isAvailabilityKnown || isPast
            ? `, ${t(isAvailableFuture ? "booking.legendAvailable" : "booking.legendUnavailable")}`
            : "";

    const textColor = isSelected
        ? colors.primary
        : isToday
          ? colors.success
          : isAvailableFuture
            ? colors.primary
            : colors.mutedForeground;

    const textOpacity =
        isSelected || isToday || isAvailableFuture ? 1 : isPast ? 0.35 : isAvailabilityKnown ? 0.7 : 0.5;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${dateLabel}${statusLabel}${isToday ? ` (${t("booking.legendToday")})` : ""}`}
            accessibilityState={{ disabled: isDisabled, selected: isSelected }}
            disabled={isDisabled}
            hitSlop={4}
            onPress={() => onPress(dateString)}
            className="h-11 w-11 items-center justify-center"
            style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
        >
            <View
                className={cn(
                    "h-11 w-11 items-center justify-center rounded-full",
                    isSelected
                        ? "border-2 border-primary bg-primary/15"
                        : isToday
                          ? isAvailableFuture
                              ? "bg-success/15"
                              : "border border-success"
                          : isAvailableFuture
                            ? "bg-primary/10"
                            : undefined,
                )}
            >
                <AppText
                    variant="body"
                    align="center"
                    tabular
                    wrap={false}
                    maxFontSizeMultiplier={1.35}
                    style={{ opacity: textOpacity }}
                    textStyle={{
                        color: textColor,
                        ...(isToday || isAvailableFuture || isSelected ? { fontWeight: "700" as const } : null),
                    }}
                >
                    {String(day)}
                </AppText>

                {isAvailableFuture ? (
                    <View
                        className={cn("absolute bottom-1 h-1 w-1 rounded-full", isToday ? "bg-success" : "bg-primary")}
                    />
                ) : null}
            </View>
        </Pressable>
    );
});

export default function DateScreen() {
    const { colors, resolvedScheme, primaryColorPreference } = useTheme();
    const { i18n, t } = useTranslation();
    const { fontScale } = useWindowDimensions();
    const reducedMotion = useReducedMotion();
    const language = i18n.resolvedLanguage ?? i18n.language;
    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(language, {
                month: "long",
                day: "numeric",
                weekday: "short",
            }),
        [language],
    );

    const {
        ticketId,
        ticketName,
        ticketType,
        mode,
        reservationId,
        notes,
        date: initialDate,
    } = useLocalSearchParams<{
        ticketId?: string;
        ticketName: string;
        ticketType?: string;
        mode?: string;
        reservationId?: string;
        notes?: string;
        date?: string;
    }>();

    const router = useRouter();
    const queryClient = useQueryClient();
    const { runWithNavigationLock } = useNavigationLock();
    const { data: memberResponse } = useGetMemberProfile();
    const memberId = memberResponse?.data.id;

    const today = formatDateForAPI(new Date());
    const currentMonth = parseMonth(today);
    const currentMonthIndex = getMonthIndex(currentMonth);

    const [selectedMonth, setSelectedMonth] = useState<VisibleMonth>(() =>
        initialDate ? parseMonth(initialDate) : currentMonth,
    );
    const visibleMonth = getMonthIndex(selectedMonth) >= currentMonthIndex ? selectedMonth : currentMonth;
    const visibleMonthIndex = getMonthIndex(visibleMonth);
    const [selectedDate, setSelectedDate] = useState<string | null>(initialDate ?? null);
    const [calendarWidth, setCalendarWidth] = useState(0);
    const calendarRef = useRef<FlatList<string>>(null);
    const pageIndex = visibleMonthIndex - currentMonthIndex;
    // Grow the range before the last page while keeping previously rendered offsets stable.
    const pageCount = (Math.floor((pageIndex + 1) / MONTHS_PER_YEAR) + 1) * MONTHS_PER_YEAR + 1;
    const monthPages = useMemo(
        () =>
            Array.from({ length: pageCount }, (_, index) => {
                const monthIndex = currentMonthIndex + index;
                const year = Math.floor(monthIndex / MONTHS_PER_YEAR);
                const month = (monthIndex % MONTHS_PER_YEAR) + 1;
                return `${year}-${pad(month)}-01`;
            }),
        [currentMonthIndex, pageCount],
    );

    const ticketIdNumber = Number(ticketId);
    const hasTicketId = Number.isSafeInteger(ticketIdNumber) && ticketIdNumber > 0;

    const normalizedTicketType = String(ticketType ?? "").toUpperCase();
    const isLessonTicket = LESSON_TICKET_TYPES.includes(normalizedTicketType);
    const isUnsupportedTicket = Boolean(normalizedTicketType) && !isBookableTicketType(normalizedTicketType);

    const { startDate, endDate } = useMemo(() => getMonthRange(visibleMonth), [visibleMonth]);
    const lastVisibleMonthStart = useRef(startDate);

    const {
        data: baySlotGroupData,
        refetch: refetchBaySlotGroups,
        isPending: isPendingBaySlotGroups,
        isPlaceholderData: isPlaceholderBaySlotGroups,
        isRefetching: isRefetchingBaySlotGroups,
        isError: isErrorBaySlotGroups,
    } = useMemberBaySlotGroups(ticketIdNumber, startDate, endDate, !isLessonTicket && !isUnsupportedTicket);

    const {
        data: lessonSlotData,
        refetch: refetchLessonSlots,
        isPending: isPendingLessonSlots,
        isPlaceholderData: isPlaceholderLessonSlots,
        isRefetching: isRefetchingLessonSlots,
        isError: isErrorLessonSlots,
    } = useMemberTicketLessonSlots(ticketIdNumber, visibleMonth.year, visibleMonth.month, isLessonTicket);

    const data = isLessonTicket ? lessonSlotData : baySlotGroupData;
    const isPlaceholderData = isLessonTicket ? isPlaceholderLessonSlots : isPlaceholderBaySlotGroups;
    const isAvailabilityPending = isPlaceholderData || (isLessonTicket ? isPendingLessonSlots : isPendingBaySlotGroups);
    const isAvailabilityKnown = data !== undefined && !isPlaceholderData;
    const hasLoadError = (isLessonTicket ? isErrorLessonSlots : isErrorBaySlotGroups) && !isAvailabilityKnown;
    const isRefetching = isLessonTicket ? isRefetchingLessonSlots : isRefetchingBaySlotGroups;

    const handleVisibleMonthChange = useCallback<NonNullable<FlatListProps<string>["onViewableItemsChanged"]>>(
        ({ viewableItems }) => {
            const monthStart = viewableItems[0]?.item;
            if (!monthStart || monthStart === lastVisibleMonthStart.current) return;

            lastVisibleMonthStart.current = monthStart;
            triggerSelectionHaptic();
            setSelectedMonth(parseMonth(monthStart));
            AccessibilityInfo.announceForAccessibility(
                new Intl.DateTimeFormat(language, {
                    month: "long",
                    year: "numeric",
                }).format(new Date(`${monthStart}T12:00:00`)),
            );
        },
        [language],
    );

    const getMonthLayout = useCallback(
        (_: ArrayLike<string> | null | undefined, index: number) => ({
            length: calendarWidth,
            offset: calendarWidth * index,
            index,
        }),
        [calendarWidth],
    );

    const scrollToMonth = useCallback(
        (index: number) => {
            if (index >= 0 && index < pageCount) {
                calendarRef.current?.scrollToIndex({ index, animated: !reducedMotion });
            }
        },
        [pageCount, reducedMotion],
    );

    useEffect(() => {
        if (!hasTicketId || isUnsupportedTicket) {
            return;
        }

        const followingMonth: VisibleMonth =
            visibleMonth.month === 12
                ? { year: visibleMonth.year + 1, month: 1 }
                : { year: visibleMonth.year, month: visibleMonth.month + 1 };

        if (isLessonTicket) {
            void queryClient.prefetchQuery(
                getMemberTicketLessonSlotsQueryOptions(ticketIdNumber, followingMonth.year, followingMonth.month),
            );
        } else {
            const followingRange = getMonthRange(followingMonth);
            void queryClient.prefetchQuery(
                getMemberBaySlotGroupsQueryOptions(ticketIdNumber, followingRange.startDate, followingRange.endDate),
            );
        }
    }, [
        hasTicketId,
        isLessonTicket,
        isUnsupportedTicket,
        queryClient,
        ticketIdNumber,
        visibleMonth.month,
        visibleMonth.year,
    ]);

    const availableDates = useMemo(() => {
        const dates = new Set<string>();
        if (!isAvailabilityKnown) return dates;

        if (isLessonTicket) {
            for (const slot of lessonSlotData?.data ?? []) {
                if (isLessonSlotFull(slot) || isLessonSlotBookedByMember(slot, memberId)) {
                    continue;
                }
                const date = formatDateForAPI(slot.startTime);
                if (date >= startDate && date <= endDate) {
                    dates.add(date);
                }
            }
        } else {
            for (const group of baySlotGroupData?.data ?? []) {
                if (group.totalReservableBaySlots > 0) {
                    const date = formatDateForAPI(group.startDateTime);
                    if (date >= startDate && date <= endDate) {
                        dates.add(date);
                    }
                }
            }
        }

        return dates;
    }, [baySlotGroupData, endDate, isAvailabilityKnown, isLessonTicket, lessonSlotData, memberId, startDate]);

    const handleDayPress = useCallback(
        (dateString: string) => {
            if (!isAvailabilityKnown || dateString < today || dateString < startDate || dateString > endDate) {
                return;
            }

            if (availableDates.has(dateString)) {
                triggerSelectionHaptic();
                setSelectedDate(dateString);

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
                                        (group) => formatDateForAPI(group.startDateTime) === dateString,
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
                    date: formatDateWeekday(dateString),
                }),
                type: "warning",
                duration: 2500,
                position: "bottom",
            });
        },
        [
            availableDates,
            baySlotGroupData,
            endDate,
            isAvailabilityKnown,
            isLessonTicket,
            mode,
            notes,
            queryClient,
            reservationId,
            router,
            runWithNavigationLock,
            startDate,
            t,
            ticketId,
            ticketIdNumber,
            ticketName,
            ticketType,
            today,
        ],
    );

    const renderDay = useCallback(
        ({ date }: { date?: DateData }) => {
            if (!date) {
                return null;
            }

            return (
                <DayCell
                    dateString={date.dateString}
                    day={date.day}
                    today={today}
                    dateFormatter={dateFormatter}
                    isAvailabilityKnown={
                        isAvailabilityKnown && date.dateString >= startDate && date.dateString <= endDate
                    }
                    isAvailable={availableDates.has(date.dateString)}
                    isSelected={selectedDate === date.dateString}
                    onPress={handleDayPress}
                />
            );
        },
        [availableDates, dateFormatter, endDate, handleDayPress, isAvailabilityKnown, selectedDate, startDate, today],
    );

    const calendarMinHeight = Math.round(CALENDAR_BASE_MIN_HEIGHT * Math.min(Math.max(fontScale, 1), 1.4));

    const calendarTheme = useMemo(
        () => ({
            calendarBackground: colors.card,
            monthTextColor: colors.foreground,
            textMonthFontWeight: "700" as const,
            textSectionTitleColor: colors.mutedForeground,
            textSectionTitleDisabledColor: colors.mutedForeground,
            textDayHeaderFontWeight: "600" as const,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.primaryForeground,
            todayTextColor: colors.primary,
            textDisabledColor: colors.mutedForeground,
            dayTextColor: colors.mutedForeground,
            "stylesheet.calendar.main": {
                week: {
                    marginTop: 6,
                    marginBottom: 6,
                    flexDirection: "row",
                    justifyContent: "space-between",
                },
            },
        }),
        [colors],
    );

    const renderMonth = useCallback(
        ({ item, index }: ListRenderItemInfo<string>) => (
            <Calendar
                current={item}
                style={{ width: calendarWidth, minHeight: calendarMinHeight }}
                minDate={today}
                disableMonthChange
                hideExtraDays
                disableArrowLeft={index === 0}
                onPressArrowLeft={() => scrollToMonth(index - 1)}
                onPressArrowRight={() => scrollToMonth(index + 1)}
                dayComponent={renderDay}
                renderArrow={(direction) =>
                    direction === "left" ? (
                        <ChevronLeft size={20} color={index === 0 ? colors.mutedForeground : colors.primary} />
                    ) : (
                        <ChevronRight size={20} color={colors.primary} />
                    )
                }
                theme={calendarTheme}
            />
        ),
        [
            calendarMinHeight,
            calendarTheme,
            calendarWidth,
            colors.mutedForeground,
            colors.primary,
            renderDay,
            scrollToMonth,
            today,
        ],
    );

    const { refreshing: isPullRefreshing, onRefresh: handleRefresh } = usePullToRefresh(() =>
        isLessonTicket ? refetchLessonSlots({ cancelRefetch: false }) : refetchBaySlotGroups({ cancelRefetch: false }),
    );

    const ticketTypeLabel = formatTicketTypeLabel(ticketType, t);
    const trimmedTicketName = ticketName?.trim();
    const bookingContext =
        ticketTypeLabel && trimmedTicketName && trimmedTicketName !== ticketTypeLabel
            ? `${ticketTypeLabel} · ${trimmedTicketName}`
            : ticketTypeLabel || trimmedTicketName || t("common.noTicket");
    const calendarLocale = applyCalendarLocale(i18n.resolvedLanguage);

    if (!hasTicketId || isUnsupportedTicket) {
        return (
            <Screen>
                <EmptyState
                    title={t(hasTicketId ? "common.notAvailable" : "bookingConfirmation.ticketInfoMissing")}
                    actionLabel={t("tickets.sectionTitle")}
                    onAction={() => runWithNavigationLock(() => router.dismissTo("/tickets"))}
                />
            </Screen>
        );
    }

    return (
        <Screen
            contentClassName="gap-6"
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
            <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                    <BookingStepHeader
                        step={1}
                        totalSteps={3}
                        context={bookingContext}
                        selectionTrail={[bookingContext]}
                    />
                </View>

                {pageIndex > 0 ? (
                    <AnimatedPressable
                        accessibilityRole="button"
                        accessibilityLabel={t("booking.legendToday")}
                        haptic="selection"
                        hitSlop={8}
                        className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5"
                        onPress={() => scrollToMonth(0)}
                    >
                        <AppText variant="caption" color="primary" wrap={false} textStyle={{ fontWeight: "600" }}>
                            {t("booking.legendToday")}
                        </AppText>
                    </AnimatedPressable>
                ) : null}
            </View>

            <View className={hasLoadError ? "grow gap-4" : "gap-4"}>
                <View
                    className="overflow-hidden rounded-2xl border border-border bg-card py-2"
                    style={{ minHeight: calendarMinHeight + 16 }}
                    onLayout={(event) => setCalendarWidth(event.nativeEvent.layout.width)}
                >
                    {calendarWidth > 0 ? (
                        <FlatList
                            key={`${calendarWidth}-${currentMonthIndex}-${calendarLocale}-${resolvedScheme}-${primaryColorPreference}`}
                            ref={calendarRef}
                            data={monthPages}
                            renderItem={renderMonth}
                            keyExtractor={monthKeyExtractor}
                            getItemLayout={getMonthLayout}
                            initialScrollIndex={pageIndex}
                            initialNumToRender={2}
                            maxToRenderPerBatch={2}
                            windowSize={3}
                            viewabilityConfig={MONTH_VIEWABILITY}
                            onViewableItemsChanged={handleVisibleMonthChange}
                            showsHorizontalScrollIndicator={false}
                            horizontal
                            pagingEnabled
                            nestedScrollEnabled
                        />
                    ) : null}
                </View>

                {isAvailabilityPending ? (
                    <View accessibilityLiveRegion="polite" className="flex-row items-center justify-center gap-2">
                        {reducedMotion ? null : <ActivityIndicator color={colors.primary} size="small" />}
                        <AppText variant="caption" color="mutedForeground" align="center" style={{ flexShrink: 1 }}>
                            {t("booking.refreshingAvailability")}
                        </AppText>
                    </View>
                ) : hasLoadError ? (
                    <ErrorState
                        title={t("booking.failedAvailableDatesTitle")}
                        message={t("booking.failedAvailableDatesMessage")}
                        actionLabel={t("common.refreshTryAgain")}
                        actionPending={isRefetching || isPullRefreshing}
                        onAction={handleRefresh}
                    />
                ) : isAvailabilityKnown && availableDates.size === 0 ? (
                    <CompactEmptyState
                        title={t("booking.noAvailableDatesTitle", {
                            defaultValue: "No available dates this month",
                        })}
                    />
                ) : null}

                {isAvailabilityKnown ? (
                    <View className="flex-row flex-wrap items-center justify-center gap-x-5 gap-y-2">
                        <View className="flex-row items-center gap-1.5">
                            <View className="h-3.5 w-3.5 items-center justify-center rounded-full bg-primary/15">
                                <View className="h-1.5 w-1.5 rounded-full bg-primary" />
                            </View>
                            <AppText variant="caption" color="mutedForeground" wrap={false}>
                                {t("booking.legendAvailable")}
                            </AppText>
                        </View>

                        <View className="flex-row items-center gap-1.5">
                            <View className="h-3.5 w-3.5 items-center justify-center rounded-full bg-success/15">
                                <View className="h-1.5 w-1.5 rounded-full bg-success" />
                            </View>
                            <AppText variant="caption" color="mutedForeground" wrap={false}>
                                {t("booking.legendToday")}
                            </AppText>
                        </View>

                        <View className="flex-row items-center gap-1.5">
                            <View className="h-3.5 w-3.5 rounded-full border border-border bg-muted" />
                            <AppText variant="caption" color="mutedForeground" wrap={false}>
                                {t("booking.legendUnavailable")}
                            </AppText>
                        </View>
                    </View>
                ) : null}
            </View>
        </Screen>
    );
}
