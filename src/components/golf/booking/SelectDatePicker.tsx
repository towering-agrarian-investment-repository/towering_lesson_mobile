import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/design-system";
import { useThemeColors } from "@/design-system/utils/theme";
import {
    useMemberBaySlotGroups,
    useMemberTicketLessonSlots,
} from "@/lib/hook/useReservation";
import { showAppToast } from "@/lib/toast/toast";
import { formatDateForAPI, formatDateValue } from "@/utils/time-helper";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";

import { ErrorState } from "@/components/ui/StateCard";

const LESSON_TICKET_TYPES = ["PRIVATE_LESSON", "GROUP_LESSON", "LESSON_PROGRAM"];
const CALENDAR_WEEKDAY_PLACEHOLDERS = Array.from({ length: 7 }, (_, index) => index);
const CALENDAR_WEEK_PLACEHOLDERS = Array.from({ length: 6 }, (_, index) => index);

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

function getDatesForMonth(value: Date) {
    const year = value.getFullYear();
    const month = value.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
        const day = String(index + 1).padStart(2, "0");
        const monthValue = String(month + 1).padStart(2, "0");

        return `${year}-${monthValue}-${day}`;
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
                {CALENDAR_WEEKDAY_PLACEHOLDERS.map((index) => (
                    <View
                        key={`weekday-${index}`}
                        className="h-3 w-7 rounded-sm bg-muted"
                    />
                ))}
            </View>

            <View className="gap-4">
                {CALENDAR_WEEK_PLACEHOLDERS.map((weekIndex) => (
                    <View
                        key={`week-${weekIndex}`}
                        className="flex-row justify-between"
                    >
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
    const colors = useThemeColors();

    const { ticketId, ticketType } = useLocalSearchParams<{
        ticketId?: string;
        ticketType?: string;
    }>();

    const router = useRouter();

    const [visibleMonth, setVisibleMonth] = useState(() => {
        const today = new Date();

        return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    const ticketIdNumber = ticketId ? Number(ticketId) : null;

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
    } = useMemberBaySlotGroups(
        startDate,
        endDate,
        !isLessonTicket,
    );

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
        const monthDates = getDatesForMonth(visibleMonth);

        return monthDates.reduce<Record<string, object>>((acc, dateString) => {
            const isPast = dateString < today;
            const isAvailable = availableDates.has(dateString);
            const isToday = dateString === today;

            acc[dateString] = {
                disableTouchEvent: isPast,
                customStyles: {
                    container: {
                        borderRadius: 999,
                    },
                    text: {
                        color: isAvailable
                            ? colors.primary
                            : colors.mutedForeground,
                        fontWeight: isAvailable || isToday ? "700" : "400",
                    },
                },
            };

            return acc;
        }, {});
    }, [
        availableDates,
        colors.mutedForeground,
        colors.primary,
        today,
        visibleMonth,
    ]);

    const handleAvailableDatePress = (day: DateData) => {
        router.push({
            pathname: isLessonTicket ? "../select-lesson-slot" : "../select-time",
            params: {
                date: day.dateString,
                ticketId,
                ticketType,
            },
        });
    };

    const handleUnavailableDatePress = (dateString: string) => {
        showAppToast({
            message: `Unavailable: ${formatDateValue(dateString, "EEE, MMM d")}`,
            type: "warning",
            duration: 2500,
            position: "bottom",
        });
    };

    const handleDayPress = (day: DateData) => {
        const isPast = day.dateString < today;
        const isCurrentMonth = isSameMonth(day.dateString, visibleMonth);
        const isAvailable = availableDates.has(day.dateString);

        if (!isCurrentMonth || isPast) {
            return;
        }

        if (isAvailable) {
            handleAvailableDatePress(day);
            return;
        }

        handleUnavailableDatePress(day.dateString);
    };

    const isRefreshing = isLessonTicket
        ? isRefetchingLessonSlots
        : isRefetchingBaySlotGroups;

    const isInitialLoading = isLessonTicket
        ? !lessonSlotData && isPendingLessonSlots
        : !baySlotGroupData && isPendingBaySlotGroups;

    const isError = isLessonTicket
        ? isErrorLessonSlots
        : isErrorBaySlotGroups;

    const handleRefresh = () => {
        if (isLessonTicket) {
            void refetchLessonSlots();
            return;
        }

        void refetchBaySlotGroups();
    };

    return (
        <Screen
            contentClassName="gap-6"
            horizontalPadding={false}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                />
            }
        >
            <View className="px-6">
                <View className="gap-3">
                    <AppText variant="h3">Choose a date</AppText>

                    <AppText variant="meta" className="text-foreground/75">
                        Select an available day to continue your booking.
                    </AppText>
                </View>
            </View>

            <View>
                {isInitialLoading ? (
                    <CalendarLoadingSkeleton />
                ) : isError ? (
                    <View className="px-6">
                        <ErrorState
                            title="Failed to load available dates"
                            message="Pull to refresh and try again."
                        />
                    </View>
                ) : (
                    <Calendar
                        style={[s.calendar, { backgroundColor: colors.card }]}
                        minDate={today}
                        markedDates={markedDates}
                        markingType="custom"
                        disableAllTouchEventsForInactiveDays
                        onDayPress={handleDayPress}
                        onMonthChange={(month) => {
                            setVisibleMonth(
                                new Date(month.year, month.month - 1, 1),
                            );
                        }}
                        renderArrow={(dir) => (
                            <Ionicons
                                name={
                                    dir === "left"
                                        ? "chevron-back"
                                        : "chevron-forward"
                                }
                                size={20}
                                color={colors.primary}
                            />
                        )}
                        theme={{
                            calendarBackground: colors.card,
                            selectedDayBackgroundColor: colors.primary,
                            selectedDayTextColor: colors.primaryForeground,
                            todayTextColor: colors.primary,
                            textDisabledColor: colors.border,
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
        </Screen>
    );
}

const s = StyleSheet.create({
    calendar: {
        height: 520,
    },
});