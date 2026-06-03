import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/design-system";
import { useThemeColors } from "@/design-system/utils/theme";
import { useMemberBaySlotGroups, useMemberTicketLessonSlots } from "@/lib/hook/useReservation";
import { showAppToast } from "@/lib/toast/toast";
import { formatDateForAPI, formatDateValue } from "@/utils/time-helper";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
const LESSON_TICKET_TYPES = ["PRIVATE_LESSON", "GROUP_LESSON", "LESSON_PROGRAM"];

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
    const isLessonTicket = LESSON_TICKET_TYPES.includes(String(ticketType ?? "").toUpperCase());

    const { startDate, endDate } = useMemo(
        () => getMonthRange(visibleMonth),
        [visibleMonth],
    );

    const {
        data: baySlotGroupData,
        refetch: refetchBaySlotGroups,
        isRefetching: isRefetchingBaySlotGroups,
    } = useMemberBaySlotGroups(
        startDate,
        endDate,
        !isLessonTicket,
    );
    const {
        data: lessonSlotData,
        refetch: refetchLessonSlots,
        isRefetching: isRefetchingLessonSlots,
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

    const handleAvailableDatePress = (day: DateData) => {
        router.push({
            pathname: isLessonTicket ? "../select-lesson-slot" : "../select-time",
            params: { date: day.dateString, ticketId, ticketType },
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

    const isRefreshing = isLessonTicket
        ? isRefetchingLessonSlots
        : isRefetchingBaySlotGroups;

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
            <Animated.View
                entering={FadeInDown.duration(220)}
                className="px-6"
            >
                <View className="gap-1">
                    <AppText variant="value">Choose a date</AppText>
                    <AppText variant="meta" className="text-foreground/75">
                        Select an available day to continue your booking.
                    </AppText>
                </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(240)}>
                <Calendar
                    style={[s.calendar, { backgroundColor: colors.card }]}
                    minDate={today}
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
                    dayComponent={({ date, state }) => {
                        if (!date) return null;

                        const isPast = date.dateString < today;
                        const isCurrentMonth = isSameMonth(date.dateString, visibleMonth);
                        const hasAvailableTime = availableDates.has(date.dateString);
                        const shouldShowUnavailableAlert =
                            isCurrentMonth && !isPast && !hasAvailableTime;
                        const isUnavailable =
                            state === "disabled" ||
                            isPast ||
                            (isCurrentMonth && !hasAvailableTime);
                        const isAvailable = isCurrentMonth && !isPast && hasAvailableTime;

                        return (
                            <Pressable
                                style={s.dayButton}
                                onPress={() =>
                                    shouldShowUnavailableAlert
                                        ? handleUnavailableDatePress(date.dateString)
                                        : !isUnavailable
                                            ? handleAvailableDatePress(date)
                                            : undefined
                                }
                            >
                                <AppText
                                    variant="body"
                                    style={[
                                        s.dayText,
                                        { color: colors.foreground },
                                        !isCurrentMonth && { color: colors.border },
                                        isUnavailable && { color: colors.border },
                                        isAvailable && {
                                            color: colors.primary,
                                            fontWeight: "700",
                                        },
                                        date.dateString === today &&
                                            !isUnavailable && [
                                                s.dayTextToday,
                                                { color: colors.primary },
                                            ],
                                    ]}
                                >
                                    {date.day}
                                </AppText>
                            </Pressable>
                        );
                    }}
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
            </Animated.View>
        </Screen>
    );
}

const s = StyleSheet.create({
    calendar: { height: 520 },
    dayButton: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
    },
    dayText: {
        textAlign: "center",
    },
    dayTextToday: {
        fontWeight: "700",
    },
});
