import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import {
    ErrorState,
    MotionView,
    Screen,
    triggerNotificationHaptic,
    triggerSelectionHaptic,
    useTheme,
    useThemeColors,
} from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
    getMemberBaySlotGroupsQueryOptions,
    useMemberBaySlotGroups,
    useMemberTicketLessonSlots,
} from "@/lib/hook/useReservation";
import { showAppToast } from "@/lib/toast/toast";
import { formatType } from "@/utils/format-enum";
import { formatDateForAPI, formatDateValue } from "@/utils/time-helper";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, StyleSheet, View } from "react-native";
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

function getDatesForCalendarGrid(value: Date) {
    const year = value.getFullYear();
    const month = value.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startOffset = firstDayOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, i) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + i);

        const d = String(date.getDate()).padStart(2, "0");
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const y = date.getFullYear();

        return `${y}-${m}-${d}`;
    });
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
    const { resolvedScheme } = useTheme();

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

    const [visibleMonth, setVisibleMonth] = useState(() => {
        const today = new Date();

        return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    const ticketIdNumber = ticketId ? Number(ticketId) : null;

    const isLessonTicket = LESSON_TICKET_TYPES.includes(
        String(ticketType ?? "").toUpperCase(),
    );

    const { startDate, endDate } = useMemo(() => {
        const prevMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
        const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);

        return {
            startDate: getMonthRange(prevMonth).startDate,
            endDate: getMonthRange(nextMonth).endDate,
        };
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

    const availableDates = useMemo(() => {
        const dates = new Set<string>();

        if (isLessonTicket) {
            for (const slot of lessonSlotData?.data ?? []) {
                dates.add(slot.startTime.split("T")[0]);
            }
        } else {
            for (const group of baySlotGroupData?.data ?? []) {
                const hasAvailableBay = group.baySlots.some(
                    (slot) => slot.slotStatus === "AVAILABLE",
                );

                if (hasAvailableBay) {
                    dates.add(group.startDateTime.split("T")[0]);
                }
            }
        }

        return dates;
    }, [baySlotGroupData, isLessonTicket, lessonSlotData]);

    const markedDates = useMemo(() => {
        const gridDates = getDatesForCalendarGrid(visibleMonth);

        return gridDates.reduce<Record<string, object>>((acc, dateString) => {
            const isPast = dateString < today;
            const isBookable = availableDates.has(dateString) && !isPast;

            if (isBookable) {
                acc[dateString] = {
                    customStyles: {
                        container: {
                            borderRadius: 999,
                            backgroundColor: colors.primary + "1A",
                        },
                        text: {
                            color: colors.primary,
                            fontWeight: "700",
                        },
                    },
                };
            }

            return acc;
        }, {});
    }, [availableDates, colors.primary, today, visibleMonth]);

    const handleDayPress = (day: DateData) => {
        const isPast = day.dateString < today;
        const isCurrentMonth = isSameMonth(day.dateString, visibleMonth);
        const isAvailable = availableDates.has(day.dateString);

        if (isPast || !isAvailable && !isCurrentMonth) {
            return;
        }

        if (isAvailable) {
            triggerSelectionHaptic();

            if (!isLessonTicket) {
                void queryClient.prefetchQuery(
                    getMemberBaySlotGroupsQueryOptions(day.dateString, day.dateString),
                );
            }

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

    LocaleConfig.defaultLocale = calendarLocale;

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
                />
            </View>

            <MotionView delayMs={90}>
                <View>
                    {isInitialLoading ? (
                        <CalendarLoadingSkeleton />
                    ) : isError ? (
                        <View className="px-6">
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
                            markedDates={markedDates}
                            markingType="custom"
                            onDayPress={handleDayPress}
                            onMonthChange={(month) => {
                                setVisibleMonth(new Date(month.year, month.month - 1, 1));
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
                                monthTextColor:
                                    resolvedScheme === "dark"
                                        ? colors.primary
                                        : colors.mutedForeground,
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
            </MotionView>
        </Screen>
    );
}

const s = StyleSheet.create({
    calendar: {
        height: 520,
    },
});
