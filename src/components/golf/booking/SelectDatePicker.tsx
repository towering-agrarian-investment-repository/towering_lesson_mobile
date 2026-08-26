import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import {
    ErrorState,
    AppText,
    Screen,
    triggerNotificationHaptic,
    triggerSelectionHaptic,
    useThemeColors,
} from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
    useMemberBaySlotGroups,
    useMemberTicketLessonSlots,
} from "@/lib/hook/useReservation";
import { showAppToast } from "@/lib/toast/toast";
import { formatType } from "@/utils/format-enum";
import { formatDateForAPI, formatDateValue } from "@/utils/time-helper";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";

LocaleConfig.locales.en = {
    monthNames: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ],
    monthNamesShort: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
    dayNames: [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    ],
    dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    today: "Today",
};

LocaleConfig.locales.ko = {
    monthNames: [
        "1월", "2월", "3월", "4월", "5월", "6월",
        "7월", "8월", "9월", "10월", "11월", "12월",
    ],
    monthNamesShort: [
        "1월", "2월", "3월", "4월", "5월", "6월",
        "7월", "8월", "9월", "10월", "11월", "12월",
    ],
    dayNames: [
        "일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일",
    ],
    dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
    today: "오늘",
};

const LESSON_TICKET_TYPES = ["PRIVATE_LESSON", "GROUP_LESSON", "LESSON_PROGRAM"];
const CALENDAR_WEEKDAY_PLACEHOLDERS = Array.from({ length: 7 }, (_, i) => i);
const CALENDAR_WEEK_PLACEHOLDERS = Array.from({ length: 6 }, (_, i) => i);

function getMonthRange(value: Date) {
    const start = new Date(value.getFullYear(), value.getMonth(), 1);
    const end = new Date(value.getFullYear(), value.getMonth() + 1, 0);

    return {
        startDate: formatDateForAPI(start),
        endDate: formatDateForAPI(end),
    };
}

function isSameMonth(dateString: string, monthDate: Date) {
    const [year, month] = dateString.split("-").map(Number);

    return (
        year === monthDate.getFullYear() &&
        month === monthDate.getMonth() + 1
    );
}

function CalendarLoadingSkeleton() {
    return (
        <View className="mx-6 rounded-xl border border-border bg-card px-4 py-5">
            <View className="mb-5 flex-row items-center justify-between">
                <View className="h-5 w-24 rounded-md bg-muted" />
                <View className="flex-row items-center gap-3">
                    <View className="h-8 w-8 rounded-full bg-muted" />
                    <View className="h-8 w-8 rounded-full bg-muted" />
                </View>
            </View>

            <View className="mb-4 flex-row justify-between">
                {CALENDAR_WEEKDAY_PLACEHOLDERS.map((i) => (
                    <View key={`weekday-${i}`} className="h-3 w-7 rounded-sm bg-muted" />
                ))}
            </View>

            <View className="gap-4">
                {CALENDAR_WEEK_PLACEHOLDERS.map((weekIndex) => (
                    <View key={`week-${weekIndex}`} className="flex-row justify-between">
                        {CALENDAR_WEEKDAY_PLACEHOLDERS.map((dayIndex) => (
                            <View
                                key={`day-${weekIndex}-${dayIndex}`}
                                className="h-9 w-9 rounded-full bg-muted"
                            />
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
}

export default function DateScreen() {
    const { i18n, t } = useTranslation();
    const colors = useThemeColors();

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
    const { runWithNavigationLock } = useNavigationLock();

    const [visibleMonth, setVisibleMonth] = useState(() => {
        const today = new Date();

        return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    const ticketIdNumber = ticketId ? Number(ticketId) : null;

    const isLessonTicket = LESSON_TICKET_TYPES.includes(
        String(ticketType ?? "").toUpperCase(),
    );

    const { startDate, endDate } = useMemo(() => {
        return getMonthRange(visibleMonth);
    }, [visibleMonth]);


    const {
        data: baySlotGroupData,
        refetch: refetchBaySlotGroups,
        isPending: isPendingBaySlotGroups,
        isRefetching: isRefetchingBaySlotGroups,
        isError: isErrorBaySlotGroups,
    } = useMemberBaySlotGroups(startDate, endDate, !isLessonTicket);

    const {
        data: lessonSlotData,
        refetch: refetchLessonSlots,
        isPending: isPendingLessonSlots,
        isRefetching: isRefetchingLessonSlots,
        isError: isErrorLessonSlots,
    } = useMemberTicketLessonSlots(
        ticketIdNumber,
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() + 1,
        isLessonTicket,
    );

    const today = formatDateForAPI(new Date());
    const currentMonthStart = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }, []);

    const canGoToPreviousMonth =
        visibleMonth.getFullYear() > currentMonthStart.getFullYear() ||
        (visibleMonth.getFullYear() === currentMonthStart.getFullYear() &&
            visibleMonth.getMonth() > currentMonthStart.getMonth());

    const availableDates = useMemo(() => {
        const dates = new Set<string>();

        if (isLessonTicket) {
            for (const slot of lessonSlotData?.data ?? []) {
                const date = formatDateForAPI(slot.startTime);
                if (date) {
                    dates.add(date);
                }
            }
        } else {
            for (const group of baySlotGroupData?.data ?? []) {
                const hasAvailableBay = group.baySlots.some(
                    (slot) => slot.slotStatus === "AVAILABLE",
                );

                if (hasAvailableBay) {
                    const date = formatDateForAPI(group.startDateTime);
                    if (date) {
                        dates.add(date);
                    }
                }
            }
        }

        return dates;
    }, [
        baySlotGroupData,
        isLessonTicket,
        lessonSlotData,
    ]);

    const handleDayPress = (day: DateData) => {
        const isPast = day.dateString < today;
        const isCurrentMonth = isSameMonth(day.dateString, visibleMonth);
        const isAvailable = availableDates.has(day.dateString);

        if (isPast || !isAvailable && !isCurrentMonth) {
            return;
        }

        if (isAvailable) {
            triggerSelectionHaptic();

            runWithNavigationLock(() => {
                router.push({
                    pathname: isLessonTicket ? "/select-lesson-slot" : "/select-time",
                    params: isLessonTicket
                        ? {
                            date: day.dateString,
                            ticketId,
                            ticketName,
                            ticketType,
                            notes,
                        }
                        : {
                            date: day.dateString,
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
                date: formatDateValue(day.dateString, "EEE, MMM d"),
            }),
            type: "warning",
            duration: 2500,
            position: "bottom",
        });
    };

    const isInitialLoading = isLessonTicket
        ? !lessonSlotData && isPendingLessonSlots
        : !baySlotGroupData && isPendingBaySlotGroups;

    const isError = isLessonTicket ? isErrorLessonSlots : isErrorBaySlotGroups;

    const handleRefresh = () => {
        if (isLessonTicket) {
            void refetchLessonSlots();
            return;
        }

        void refetchBaySlotGroups();
    };

    const formattedTicketType = formatType(ticketType);
    const bookingContext =
        formattedTicketType !== "-"
            ? formattedTicketType
            : ticketName || t("common.noTicket");
    const calendarLocale = i18n.resolvedLanguage?.toLowerCase().startsWith("ko")
        ? "ko"
        : "en";

    useEffect(() => {
        LocaleConfig.defaultLocale = calendarLocale;
    }, [calendarLocale]);

    return (
        <Screen
            contentClassName="gap-6"
            horizontalPadding={false}
            refreshControl={
                <RefreshControl
                    refreshing={
                        isLessonTicket
                            ? isRefetchingLessonSlots
                            : isRefetchingBaySlotGroups
                    }
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
                    totalSteps={isLessonTicket ? 3 : 4}
                    context={bookingContext}
                    selectionTrail={[bookingContext]}
                />
            </View>

            <View>
                <View>
                    {isInitialLoading ? (
                        <CalendarLoadingSkeleton />
                    ) : isError ? (
                        <View className="min-h-[520px] flex-1 px-6">
                            <ErrorState
                                title={t("booking.failedAvailableDatesTitle")}
                                message={t("booking.failedAvailableDatesMessage")}
                                actionLabel={
                                    isLessonTicket
                                        ? isRefetchingLessonSlots
                                            ? t("common.refreshing")
                                            : t("common.refreshTryAgain")
                                        : isRefetchingBaySlotGroups
                                            ? t("common.refreshing")
                                            : t("common.refreshTryAgain")
                                }
                                onAction={handleRefresh}
                            />
                        </View>
                    ) : (
                        <Calendar
                            key={calendarLocale}
                            style={[s.calendar, { backgroundColor: colors.card }]}
                            minDate={today}
                            disableArrowLeft={!canGoToPreviousMonth}
                            onDayPress={handleDayPress}
                            dayComponent={({ date, state }) => {
                                if (!date) {
                                    return null;
                                }

                                const isPast = date.dateString < today;
                                const isToday = date.dateString === today;
                                const isAvailable = availableDates.has(date.dateString);
                                const isOutsideMonth = state === "disabled";
                                const isAvailableFutureDate = isAvailable && !isPast;

                                return (
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={date.dateString}
                                        onPress={() => {
                                            handleDayPress(date);
                                        }}
                                        className="h-10 w-10 items-center justify-center"
                                    >
                                        <View
                                            className={`h-10 w-10 items-center justify-center rounded-full ${isToday
                                                ? "bg-success/15"
                                                : isAvailableFutureDate
                                                    ? "bg-primary/10"
                                                    : ""
                                                }`}
                                        >
                                            <AppText
                                                variant="body"
                                                className={`${isToday
                                                    ? "font-bold text-success"
                                                    : isPast
                                                    ? "text-muted-foreground opacity-40"
                                                    : isAvailableFutureDate
                                                        ? "font-bold text-primary"
                                                        : isOutsideMonth
                                                            ? "text-muted-foreground/70"
                                                            : "text-foreground"
                                                    }`}
                                            >
                                                {date.day}
                                            </AppText>

                                            {isAvailableFutureDate ? (
                                                <View
                                                    className={`absolute bottom-0.5 h-1.5 w-1.5 rounded-full ${isToday ? "bg-success" : "bg-primary"
                                                        }`}
                                                />
                                            ) : null}
                                        </View>
                                    </Pressable>
                                );
                            }}
                            onMonthChange={(month) => {
                                const nextMonth = new Date(month.year, month.month - 1, 1);

                                if (nextMonth < currentMonthStart) {
                                    setVisibleMonth(currentMonthStart);
                                    return;
                                }

                                setVisibleMonth(nextMonth);
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
                </View>
            </View>
        </Screen>
    );
}

const s = StyleSheet.create({
    calendar: {
        height: 520,
    },
});
