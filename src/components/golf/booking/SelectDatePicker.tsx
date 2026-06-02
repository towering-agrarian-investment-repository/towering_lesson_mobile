import { Screen } from "@/components/ui/Screen";
import { useMemberBaySlotGroups, useMemberTicketLessonSlots } from "@/lib/hook/useReservation";
import { showAppToast } from "@/lib/toast/toast";
import { formatDateForAPI, formatDateValue } from "@/utils/time-helper";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";

const PRIMARY = "#38bdf8";
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
            horizontalPadding={false}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                />
            }
        >
            <Calendar
                style={s.calendar}
                minDate={today}
                onMonthChange={(month) => {
                    setVisibleMonth(new Date(month.year, month.month - 1, 1));
                }}
                renderArrow={(dir) => (
                    <Ionicons
                        name={dir === "left" ? "chevron-back" : "chevron-forward"}
                        size={20}
                        color={PRIMARY}
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
                            <Text
                                style={[
                                    s.dayText,
                                    !isCurrentMonth && s.dayTextOutsideMonth,
                                    isUnavailable && s.dayTextUnavailable,
                                    date.dateString === today && !isUnavailable && s.dayTextToday,
                                ]}
                            >
                                {date.day}
                            </Text>
                        </Pressable>
                    );
                }}
                theme={{
                    calendarBackground: "#fff",
                    selectedDayBackgroundColor: PRIMARY,
                    selectedDayTextColor: "#fff",
                    todayTextColor: PRIMARY,
                    textDisabledColor: "#cbd5e1",
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
        </Screen>
    );
}

const s = StyleSheet.create({
    calendar: { height: 520, backgroundColor: "#fff" },
    dayButton: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
    },
    dayText: {
        fontSize: 16,
        color: "#0f172a",
    },
    dayTextToday: {
        color: PRIMARY,
        fontWeight: "700",
    },
    dayTextUnavailable: {
        color: "#cbd5e1",
    },
    dayTextOutsideMonth: {
        color: "#e2e8f0",
    },
});
