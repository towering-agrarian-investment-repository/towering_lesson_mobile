import { AppText } from "@/design-system/components/AppText";
import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import { TicketPausePeriods } from "@/components/golf/TicketPausePeriods";
import {
    AnimatedPressable,
    cn,
    CompactEmptyState,
    EmptyState,
    ErrorState,
    Screen,
    SCREEN_HORIZONTAL_PADDING,
    SCREEN_MAX_WIDTH,
    triggerNotificationHaptic,
    triggerSelectionHaptic,
} from "@/design-system";
import { useTheme, type ThemeColors } from "@/design-system/utils/theme";
import { formatTicketTypeLabel, isBookableTicketType } from "@/design-system/utils/ticket-type";
import { formatCalendarMonthTitle, getCalendarLocale, type CalendarLocaleData } from "@/lib/calendar-locale";
import { useDayClock } from "@/lib/hook/useMinuteClock";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import {
    getMemberBaySlotGroupsQueryOptions,
    getMemberTicketLessonSlotsQueryOptions,
    useMemberBaySlotGroups,
    useMemberTicketLessonSlots,
} from "@/lib/hook/useReservation";
import { useMemberTicketById } from "@/lib/hook/useTicket";
import { showAppToast } from "@/design-system/components/AppToast";
import { getTicketPausePeriods, isTicketDatePaused, type TicketPausePeriod } from "@/utils/ticket-pause";
import { formatDateForAPI, formatDateWeekday, formatMonthYear } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { useReducedMotion } from "react-native-reanimated";

const LESSON_TICKET_TYPES = ["PRIVATE_LESSON", "GROUP_LESSON"];
const CALENDAR_BASE_MIN_HEIGHT = 368;
const MONTHS_PER_YEAR = 12;
const DAYS_PER_WEEK = 7;
const MONTH_VIEWABILITY = { itemVisiblePercentThreshold: 60 };
const ARROW_HIT_SLOP = { top: 20, right: 20, bottom: 20, left: 20 };

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

function offsetMonth({ year, month }: VisibleMonth, delta: number): VisibleMonth {
    const total = getMonthIndex({ year, month }) + delta;

    return {
        year: Math.floor(total / MONTHS_PER_YEAR),
        month: (total % MONTHS_PER_YEAR) + 1,
    };
}

// Built from plain numbers so the device time zone never shifts the range.
function getMonthRange({ year, month }: VisibleMonth) {
    const lastDay = new Date(year, month, 0).getDate();

    return {
        startDate: `${year}-${pad(month)}-01`,
        endDate: `${year}-${pad(month)}-${pad(lastDay)}`,
    };
}

function buildMonthWeeks(year: number, month: number): (number | null)[][] {
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const weekCount = Math.ceil((firstWeekday + daysInMonth) / DAYS_PER_WEEK);
    const weeks: (number | null)[][] = [];

    for (let weekIndex = 0; weekIndex < weekCount; weekIndex++) {
        const week: (number | null)[] = [];
        for (let dayIndex = 0; dayIndex < DAYS_PER_WEEK; dayIndex++) {
            const day = weekIndex * DAYS_PER_WEEK + dayIndex - firstWeekday + 1;
            week.push(day >= 1 && day <= daysInMonth ? day : null);
        }
        weeks.push(week);
    }

    return weeks;
}

const monthKeyExtractor = (monthStart: string) => monthStart;
const EMPTY_DATE_SET = new Set<string>();

type DayCellLabels = {
    paused: string;
    available: string;
    unavailable: string;
    today: string;
};

type DayCellProps = {
    dateString: string;
    day: number;
    today: string;
    dateLabel: string;
    labels: DayCellLabels;
    colors: ThemeColors;
    isAvailabilityKnown: boolean;
    isAvailable: boolean;
    isPaused: boolean;
    isSelected: boolean;
    onPress: (dateString: string) => void;
};

const DayCell = memo(function DayCell({
    dateString,
    day,
    today,
    dateLabel,
    labels,
    colors,
    isAvailabilityKnown,
    isAvailable,
    isPaused,
    isSelected,
    onPress,
}: DayCellProps) {
    const isPast = dateString < today;
    const isToday = dateString === today;
    const isDisabled = isPast || isPaused || !isAvailabilityKnown;
    const isAvailableFuture = isAvailable && !isPast && !isPaused;
    const statusLabel = isPaused
        ? `, ${labels.paused}`
        : isAvailabilityKnown || isPast
          ? `, ${isAvailableFuture ? labels.available : labels.unavailable}`
          : "";

    const textColor = isPaused
        ? colors.warning
        : isSelected
          ? colors.primary
          : isToday
            ? colors.success
            : isAvailableFuture
              ? colors.primary
              : colors.mutedForeground;

    const textOpacity =
        isPaused || isSelected || isToday || isAvailableFuture ? 1 : isPast ? 0.35 : isAvailabilityKnown ? 0.7 : 0.5;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${dateLabel}${statusLabel}${isToday ? ` (${labels.today})` : ""}`}
            accessibilityState={{ disabled: isDisabled, selected: isSelected }}
            disabled={isDisabled}
            hitSlop={4}
            onPress={() => onPress(dateString)}
            className="h-11 w-11 items-center justify-center"
            style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
        >
            <View
                style={{ borderRadius: "50%" }}
                className={cn(
                    "h-11 w-11 items-center justify-center",
                    isPaused
                        ? "bg-warning/15"
                        : isSelected
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

type CalendarMonthPageProps = {
    monthStart: string;
    index: number;
    width: number;
    minHeight: number;
    locale: CalendarLocaleData;
    today: string;
    dayCellLabels: DayCellLabels;
    getDateLabel: (dateString: string) => string;
    colors: ThemeColors;
    isAvailabilityKnown: boolean;
    availableDates: Set<string>;
    pausePeriods: TicketPausePeriod[];
    selectedDate: string | null;
    onPressArrow: (targetIndex: number) => void;
    onDayPress: (dateString: string) => void;
};

const CalendarMonthPage = memo(function CalendarMonthPage({
    monthStart,
    index,
    width,
    minHeight,
    locale,
    today,
    dayCellLabels,
    getDateLabel,
    colors,
    isAvailabilityKnown,
    availableDates,
    pausePeriods,
    selectedDate,
    onPressArrow,
    onDayPress,
}: CalendarMonthPageProps) {
    const current = parseMonth(monthStart);
    const monthPrefix = `${current.year}-${pad(current.month)}-`;
    const weeks = useMemo(() => buildMonthWeeks(current.year, current.month), [current.month, current.year]);
    const monthTitle = formatCalendarMonthTitle(current.year, current.month, locale);
    const prevMonth = offsetMonth(current, -1);
    const nextMonth = offsetMonth(current, 1);
    const disableArrowLeft = index === 0;

    return (
        <View
            style={{
                width,
                minHeight,
                paddingLeft: 5,
                paddingRight: 5,
                backgroundColor: colors.card,
            }}
        >
            <View>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        paddingLeft: 10,
                        paddingRight: 10,
                        marginTop: 6,
                        alignItems: "center",
                    }}
                >
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={formatCalendarMonthTitle(prevMonth.year, prevMonth.month, locale)}
                        accessibilityState={{ disabled: disableArrowLeft }}
                        disabled={disableArrowLeft}
                        hitSlop={ARROW_HIT_SLOP}
                        onPress={() => onPressArrow(index - 1)}
                        style={({ pressed }) => ({
                            padding: 10,
                            opacity: !disableArrowLeft && pressed ? 0.5 : 1,
                        })}
                    >
                        <ChevronLeft size={20} color={disableArrowLeft ? colors.mutedForeground : colors.primary} />
                    </Pressable>

                    <AppText
                        variant="subtitle"
                        color="foreground"
                        accessibilityRole="header"
                        align="center"
                        wrap={false}
                        maxFontSizeMultiplier={1.35}
                        style={{ margin: 10 }}
                        textStyle={{ fontWeight: "700" }}
                    >
                        {monthTitle}
                    </AppText>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={formatCalendarMonthTitle(nextMonth.year, nextMonth.month, locale)}
                        hitSlop={ARROW_HIT_SLOP}
                        onPress={() => onPressArrow(index + 1)}
                        style={({ pressed }) => ({
                            padding: 10,
                            opacity: pressed ? 0.5 : 1,
                        })}
                    >
                        <ChevronRight size={20} color={colors.primary} />
                    </Pressable>
                </View>

                <View
                    importantForAccessibility="no-hide-descendants"
                    style={{
                        marginTop: 7,
                        flexDirection: "row",
                        justifyContent: "space-around",
                    }}
                >
                    {locale.dayNamesShort.map((dayName, dayIndex) => (
                        <AppText
                            key={dayIndex}
                            variant="subtext"
                            color="mutedForeground"
                            align="center"
                            numberOfLines={1}
                            maxFontSizeMultiplier={1.35}
                            style={{
                                marginTop: 2,
                                marginBottom: 7,
                                minWidth: 32,
                            }}
                            textStyle={{ fontWeight: "600" }}
                        >
                            {dayName}
                        </AppText>
                    ))}
                </View>
            </View>

            <View style={{ backgroundColor: colors.card }}>
                {weeks.map((week, weekIndex) => (
                    <View
                        key={weekIndex}
                        style={{
                            marginTop: 6,
                            marginBottom: 6,
                            flexDirection: "row",
                            justifyContent: "space-between",
                        }}
                    >
                        {week.map((day, dayIndex) => {
                            if (day === null) {
                                return <View key={dayIndex} style={{ flex: 1 }} />;
                            }

                            const dateString = `${monthPrefix}${pad(day)}`;
                            const isAvailable = availableDates.has(dateString);
                            const isPaused = !isAvailable && isTicketDatePaused(pausePeriods, dateString);

                            return (
                                <View key={dayIndex} style={{ flex: 1, alignItems: "center" }}>
                                    <DayCell
                                        dateString={dateString}
                                        day={day}
                                        today={today}
                                        dateLabel={getDateLabel(dateString)}
                                        labels={dayCellLabels}
                                        colors={colors}
                                        isAvailabilityKnown={isAvailabilityKnown}
                                        isAvailable={isAvailable}
                                        isPaused={isPaused}
                                        isSelected={!isPaused && selectedDate === dateString}
                                        onPress={onDayPress}
                                    />
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>
        </View>
    );
});

function createBookingDateLabelGetter(language: string) {
    const formatter = new Intl.DateTimeFormat(language, {
        month: "long",
        day: "numeric",
        weekday: "short",
    });
    const labels = new Map<string, string>();
    return (dateString: string) => {
        const cached = labels.get(dateString);
        if (cached !== undefined) return cached;
        const label = formatter.format(new Date(`${dateString}T12:00:00`));
        labels.set(dateString, label);
        return label;
    };
}

export default function DateScreen() {
    const { colors } = useTheme();
    const { i18n, t } = useTranslation();
    const { width: windowWidth, fontScale } = useWindowDimensions();
    const isFocused = useIsFocused();
    const dayClock = useDayClock();
    const reducedMotion = useReducedMotion();
    const language = i18n.resolvedLanguage ?? i18n.language;
    const calendarLocale = getCalendarLocale(language);
    const getDateLabel = useMemo(() => createBookingDateLabelGetter(language), [language]);
    const dayCellLabels = useMemo<DayCellLabels>(
        () => ({
            paused: t("booking.datePaused"),
            available: t("booking.legendAvailable"),
            unavailable: t("booking.legendUnavailable"),
            today: t("booking.legendToday"),
        }),
        [t],
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

    const today = formatDateForAPI(dayClock);
    const currentMonth = parseMonth(today);
    const currentMonthIndex = getMonthIndex(currentMonth);

    const [selectedMonth, setSelectedMonth] = useState<VisibleMonth>(() =>
        initialDate ? parseMonth(initialDate) : currentMonth,
    );
    const visibleMonth = getMonthIndex(selectedMonth) >= currentMonthIndex ? selectedMonth : currentMonth;
    const visibleMonthIndex = getMonthIndex(visibleMonth);
    const [selectedDate, setSelectedDate] = useState<string | null>(initialDate ?? null);
    const [calendarWidth, setCalendarWidth] = useState(() =>
        Math.max(0, Math.min(windowWidth, SCREEN_MAX_WIDTH) - SCREEN_HORIZONTAL_PADDING * 2 - 2),
    );
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
    const calendarGeometry = useRef({ width: calendarWidth, firstMonthIndex: currentMonthIndex });
    const realigningCalendar = useRef(false);

    const ticketIdNumber = Number(ticketId);
    const hasTicketId = Number.isSafeInteger(ticketIdNumber) && ticketIdNumber > 0;

    const normalizedTicketType = String(ticketType ?? "").toUpperCase();
    const isLessonTicket = LESSON_TICKET_TYPES.includes(normalizedTicketType);
    const isUnsupportedTicket = Boolean(normalizedTicketType) && !isBookableTicketType(normalizedTicketType);
    const {
        data: ticket,
        isPending: isTicketPending,
        isError: isTicketError,
        isRefetching: isTicketRefetching,
        refetch: refetchTicket,
    } = useMemberTicketById(hasTicketId && !isUnsupportedTicket ? ticketIdNumber : undefined);
    const isRescheduleMode = mode === "reschedule";
    const originalReservationId = Number(reservationId);
    const rescheduleReservationId =
        isRescheduleMode && Number.isSafeInteger(originalReservationId) && originalReservationId > 0
            ? originalReservationId
            : undefined;
    const isRefundedTicket = ticket?.effectiveStatus === "REFUNDED";
    const isIneligibleTicket = !isRescheduleMode && ticket != null && !ticket.canStartBooking;
    const canLoadAvailability =
        hasTicketId && !isUnsupportedTicket && !isIneligibleTicket && (!isRescheduleMode || !!rescheduleReservationId);
    const pausePeriods = useMemo(() => getTicketPausePeriods(ticket?.pauses), [ticket?.pauses]);

    const { startDate, endDate } = useMemo(() => getMonthRange(visibleMonth), [visibleMonth]);
    const visiblePausePeriods = pausePeriods.filter(
        (period) => period.endDate >= startDate && period.startDate <= endDate && period.endDate >= today,
    );
    const lastVisibleMonthStart = useRef(startDate);

    const {
        data: baySlotGroupData,
        refetch: refetchBaySlotGroups,
        isPending: isPendingBaySlotGroups,
        isPlaceholderData: isPlaceholderBaySlotGroups,
        isRefetching: isRefetchingBaySlotGroups,
        isError: isErrorBaySlotGroups,
    } = useMemberBaySlotGroups(ticketIdNumber, startDate, endDate, {
        enabled: canLoadAvailability && !isLessonTicket,
        refetchOnWindowFocus: isFocused,
        rescheduleReservationId,
    });

    const {
        data: lessonSlotData,
        refetch: refetchLessonSlots,
        isPending: isPendingLessonSlots,
        isPlaceholderData: isPlaceholderLessonSlots,
        isRefetching: isRefetchingLessonSlots,
        isError: isErrorLessonSlots,
    } = useMemberTicketLessonSlots(
        ticketIdNumber,
        visibleMonth.year,
        visibleMonth.month,
        canLoadAvailability && isLessonTicket,
        isFocused,
    );

    const data = isLessonTicket ? lessonSlotData : baySlotGroupData;
    const isPlaceholderData = isLessonTicket ? isPlaceholderLessonSlots : isPlaceholderBaySlotGroups;
    const isAvailabilityPending =
        isTicketPending || isPlaceholderData || (isLessonTicket ? isPendingLessonSlots : isPendingBaySlotGroups);
    const isAvailabilityKnown = canLoadAvailability && Boolean(ticket) && data !== undefined && !isPlaceholderData;
    const hasLoadError =
        (isTicketError && !ticket) || ((isLessonTicket ? isErrorLessonSlots : isErrorBaySlotGroups) && !data);
    const isRefetching = isTicketRefetching || (isLessonTicket ? isRefetchingLessonSlots : isRefetchingBaySlotGroups);

    const handleVisibleMonthChange = useCallback<NonNullable<FlatListProps<string>["onViewableItemsChanged"]>>(
        ({ viewableItems }) => {
            const monthStart = viewableItems[0]?.item;
            if (!monthStart || realigningCalendar.current || monthStart === lastVisibleMonthStart.current) return;

            lastVisibleMonthStart.current = monthStart;
            triggerSelectionHaptic();
            setSelectedMonth(parseMonth(monthStart));
            AccessibilityInfo.announceForAccessibility(formatMonthYear(`${monthStart}T12:00:00`, language));
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

    useLayoutEffect(() => {
        const previous = calendarGeometry.current;
        calendarGeometry.current = { width: calendarWidth, firstMonthIndex: currentMonthIndex };
        if (!previous.width || !calendarWidth) return;
        if (previous.width === calendarWidth && previous.firstMonthIndex === currentMonthIndex) return;

        realigningCalendar.current = true;
        lastVisibleMonthStart.current = monthPages[pageIndex];
        calendarRef.current?.scrollToOffset({ offset: calendarWidth * pageIndex, animated: false });
        const frame = requestAnimationFrame(() => {
            realigningCalendar.current = false;
        });
        return () => {
            cancelAnimationFrame(frame);
            realigningCalendar.current = false;
        };
    }, [calendarWidth, currentMonthIndex, monthPages, pageIndex]);

    const scrollToMonth = useCallback(
        (index: number) => {
            if (index >= 0 && index < pageCount) {
                calendarRef.current?.scrollToIndex({ index, animated: !reducedMotion });
            }
        },
        [pageCount, reducedMotion],
    );

    useEffect(() => {
        if (!canLoadAvailability) {
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
                getMemberBaySlotGroupsQueryOptions(
                    ticketIdNumber,
                    followingRange.startDate,
                    followingRange.endDate,
                    rescheduleReservationId,
                ),
            );
        }
    }, [
        canLoadAvailability,
        isLessonTicket,
        queryClient,
        rescheduleReservationId,
        ticketIdNumber,
        visibleMonth.month,
        visibleMonth.year,
    ]);

    const availableDates = useMemo(() => {
        const dates = new Set<string>();
        if (!isAvailabilityKnown) return dates;

        if (isLessonTicket) {
            for (const slot of lessonSlotData?.data ?? []) {
                if (!slot.bookable || slot.bookedByCurrentMember) {
                    continue;
                }
                const date = formatDateForAPI(slot.startTime);
                if (date >= startDate && date <= endDate) {
                    dates.add(date);
                }
            }
        } else {
            for (const group of baySlotGroupData?.data ?? []) {
                const date = formatDateForAPI(group.startDateTime);
                if (date >= startDate && date <= endDate) {
                    dates.add(date);
                }
            }
        }

        return dates;
    }, [baySlotGroupData, endDate, isAvailabilityKnown, isLessonTicket, lessonSlotData, startDate]);

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
                            rescheduleReservationId,
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
            rescheduleReservationId,
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

    const calendarMinHeight = Math.round(CALENDAR_BASE_MIN_HEIGHT * Math.min(Math.max(fontScale, 1), 1.4));

    const renderMonth = useCallback(
        ({ item, index }: ListRenderItemInfo<string>) => {
            const monthPrefix = item.slice(0, 8);
            const isMonthAvailabilityKnown = isAvailabilityKnown && item === startDate;
            return (
                <CalendarMonthPage
                    monthStart={item}
                    index={index}
                    width={calendarWidth}
                    minHeight={calendarMinHeight}
                    locale={calendarLocale}
                    today={today}
                    dayCellLabels={dayCellLabels}
                    getDateLabel={getDateLabel}
                    colors={colors}
                    isAvailabilityKnown={isMonthAvailabilityKnown}
                    availableDates={isMonthAvailabilityKnown ? availableDates : EMPTY_DATE_SET}
                    pausePeriods={pausePeriods}
                    selectedDate={selectedDate?.startsWith(monthPrefix) ? selectedDate : null}
                    onPressArrow={scrollToMonth}
                    onDayPress={handleDayPress}
                />
            );
        },
        [
            availableDates,
            calendarLocale,
            calendarMinHeight,
            calendarWidth,
            colors,
            dayCellLabels,
            getDateLabel,
            handleDayPress,
            isAvailabilityKnown,
            pausePeriods,
            scrollToMonth,
            selectedDate,
            startDate,
            today,
        ],
    );

    const { refreshing: isPullRefreshing, onRefresh: handleRefresh } = usePullToRefresh(() =>
        Promise.all([
            refetchTicket({ cancelRefetch: false }),
            isLessonTicket
                ? refetchLessonSlots({ cancelRefetch: false })
                : refetchBaySlotGroups({ cancelRefetch: false }),
        ]),
    );

    const ticketTypeLabel = formatTicketTypeLabel(ticketType, t);
    const trimmedTicketName = ticketName?.trim();
    const bookingContext =
        ticketTypeLabel && trimmedTicketName && trimmedTicketName !== ticketTypeLabel
            ? `${ticketTypeLabel} · ${trimmedTicketName}`
            : ticketTypeLabel || trimmedTicketName || t("common.noTicket");

    if (!canLoadAvailability) {
        return (
            <Screen>
                <EmptyState
                    title={t(
                        isRefundedTicket
                            ? "tickets.statuses.refunded"
                            : hasTicketId
                              ? "common.notAvailable"
                              : "bookingConfirmation.ticketInfoMissing",
                    )}
                    message={isIneligibleTicket && !isRescheduleMode ? t("tickets.bookingUnavailable") : undefined}
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

            <TicketPausePeriods periods={visiblePausePeriods} />
            <View className={hasLoadError ? "grow gap-4" : "gap-4"}>
                <View
                    className="overflow-hidden rounded-2xl border border-border bg-card py-2"
                    style={{ minHeight: calendarMinHeight + 16 }}
                >
                    {/* Match the paging viewport inside the card's border. */}
                    <View
                        onLayout={(event) => {
                            const nextWidth = event.nativeEvent.layout.width;
                            setCalendarWidth((current) => (Math.abs(nextWidth - current) > 0.5 ? nextWidth : current));
                        }}
                    >
                        {calendarWidth > 0 ? (
                            <FlatList
                                ref={calendarRef}
                                data={monthPages}
                                renderItem={renderMonth}
                                extraData={calendarWidth}
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
                </View>

                {hasLoadError ? (
                    <ErrorState
                        title={t("booking.failedAvailableDatesTitle")}
                        message={t("booking.failedAvailableDatesMessage")}
                        actionLabel={t("common.refreshTryAgain")}
                        actionPending={isRefetching || isPullRefreshing}
                        onAction={handleRefresh}
                    />
                ) : isAvailabilityPending ? (
                    <View accessibilityLiveRegion="polite" className="flex-row items-center justify-center gap-2">
                        {reducedMotion ? null : <ActivityIndicator color={colors.primary} size="small" />}
                        <AppText variant="caption" color="mutedForeground" align="center" style={{ flexShrink: 1 }}>
                            {t("booking.refreshingAvailability")}
                        </AppText>
                    </View>
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
