import { AppText, ErrorState, Screen, useThemeColors } from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
    getMemberBaySlotGroupsQueryOptions,
    useMemberBaySlotGroups,
    useMemberTicketLessonSlots,
} from "@/lib/hook/useReservation";
import { showAppToast } from "@/lib/toast/toast";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { formatType } from "@/utils/format-enum";
import { formatDateForAPI, formatDateValue } from "@/utils/time-helper";

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
    const { t } = useTranslation();
    const colors = useThemeColors();

    const { ticketId, ticketName, ticketType, mode, reservationId, notes } = useLocalSearchParams<{
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
        const inactiveTextColor = colors.mutedForeground;

        return monthDates.reduce<Record<string, object>>((acc, dateString) => {
            const isPast = dateString < today;
            const isAvailable = availableDates.has(dateString);
            const isBookable = isAvailable && !isPast;

            acc[dateString] = {
                disableTouchEvent: isPast,
                customStyles: {
                    container: {
                        borderRadius: 999,
                    },
                    text: {
                        color: isBookable
                            ? colors.primary
                            : inactiveTextColor,
                        fontWeight: isBookable ? "700" : "400",
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
        if (!isLessonTicket) {
            void queryClient.prefetchQuery(
                getMemberBaySlotGroupsQueryOptions(
                    day.dateString,
                    day.dateString,
                ),
            );
        }

        runWithNavigationLock(() => {
            router.push({
                pathname: isLessonTicket ? "/select-lesson-slot" : "/select-time",
                params: {
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
    };

    const handleUnavailableDatePress = (dateString: string) => {
        showAppToast({
            message: t("booking.unavailableDate", {
                date: formatDateValue(dateString, "EEE, MMM d"),
            }),
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
                    refreshing={isLessonTicket ? isRefetchingLessonSlots : isRefetchingBaySlotGroups}
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
                <View className="gap-3">
                    <AppText variant="h3">{t("booking.chooseDate")}</AppText>

                    <AppText variant="meta" className="text-foreground/75">
                        {formatType(ticketType) !== "-"
                            ? t("booking.ticketSelectAvailableDay", {
                                ticketType: formatType(ticketType),
                            })
                            : t("booking.selectAvailableDay")}
                    </AppText>
                </View>
            </View>

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
        </Screen>
    );
}

const s = StyleSheet.create({
    calendar: {
        height: 520,
    },
});
