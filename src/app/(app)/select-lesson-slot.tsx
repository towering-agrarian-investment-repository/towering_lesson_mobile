import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateCard";
import { useMemberTicketLessonSlots } from "@/lib/hook/useReservation";
import { LessonAvailabilityResponse } from "@/types/member-lesson";
import { fmtTime } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PRIMARY = "#38bdf8";

function isSlotFull(slot: LessonAvailabilityResponse) {
    return slot.bookedCount >= slot.capacity;
}

function formatSlotTime(slot: LessonAvailabilityResponse) {
    return `${fmtTime(slot.startTime)} - ${fmtTime(slot.endTime)}`;
}

export default function SelectLessonSlotScreen() {
    const { date, ticketId, ticketType } = useLocalSearchParams<{
        date: string;
        ticketId?: string;
        ticketType?: string;
    }>();
    const router = useRouter();
    const selectedDate = new Date(`${date}T12:00:00`);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const ticketIdNumber = ticketId ? Number(ticketId) : null;

    const { data, isLoading, isError, refetch, isRefetching } = useMemberTicketLessonSlots(
        ticketIdNumber,
        year,
        month,
        Boolean(ticketIdNumber),
    );

    const slots = (data?.data ?? []).filter(
        (slot) => slot.startTime.split("T")[0] === date,
    );

    const handleSelect = (slot: LessonAvailabilityResponse) => {
        router.push({
            pathname: "/lesson-booking-confirm",
            params: {
                ticketId,
                ticketType,
                lessonAvailabilityId: String(slot.id),
                lessonName:
                    slot.name ??
                    slot.title ??
                    slot.lessonProgramName ??
                    slot.lessonProgram?.name ??
                    "Private Lesson",
                coachName: slot.coachName ?? "",
                startTime: slot.startTime,
                endTime: slot.endTime,
                date,
            },
        });
    };

    return (
        <ScrollView
            style={s.container}
            contentContainerStyle={s.content}
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={() => {
                        void refetch();
                    }}
                />
            }
        >
            <Text style={s.subLabel}>{date}</Text>

            {isLoading ? (
                <View style={s.state}>
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton key={index} className="h-24 w-full rounded-xl" />
                    ))}
                </View>
            ) : null}

            {isError ? (
                <ErrorState
                    title="Failed to load lesson slots"
                    message="Pull to refresh and try again."
                />
            ) : null}

            {!isLoading && !isError && slots.length === 0 ? (
                <EmptyState
                    title="No lesson slots"
                    message="There are no lesson slots for this date."
                />
            ) : null}

            <View style={s.list}>
                {slots.map((slot) => {
                    const disabled = isSlotFull(slot);

                    return (
                        <TouchableOpacity
                            key={slot.id}
                            style={[s.row, disabled && s.rowUnavailable]}
                            onPress={() => !disabled && handleSelect(slot)}
                            activeOpacity={disabled ? 1 : 0.7}
                            disabled={disabled}
                        >
                            <View style={s.rowContent}>
                                <Text style={[s.name, disabled && s.textUnavailable]}>
                                    {slot.name ??
                                        slot.title ??
                                        slot.lessonProgramName ??
                                        slot.lessonProgram?.name ??
                                        "Private Lesson"}
                                </Text>
                                <Text style={[s.meta, disabled && s.textUnavailable]}>
                                    {formatSlotTime(slot)}
                                </Text>
                                {slot.coachName ? (
                                    <Text style={[s.meta, disabled && s.textUnavailable]}>
                                        Coach: {slot.coachName}
                                    </Text>
                                ) : null}
                            </View>

                            <Text style={[s.status, disabled && s.statusUnavailable]}>
                                {disabled ? "Full" : "Available"}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    content: { padding: 16, paddingBottom: 40 },
    subLabel: { fontSize: 13, color: "#94a3b8", marginBottom: 16 },
    list: { gap: 8 },
    state: {
        paddingVertical: 24,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    stateText: {
        fontSize: 14,
        color: "#64748b",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#e2e8f0",
        backgroundColor: "#f8fafc",
        gap: 12,
    },
    rowUnavailable: {
        backgroundColor: "#f1f5f9",
        borderColor: "#f1f5f9",
        opacity: 0.55,
    },
    rowContent: {
        flex: 1,
        gap: 4,
    },
    name: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0f172a",
    },
    meta: {
        fontSize: 13,
        color: "#64748b",
    },
    textUnavailable: {
        color: "#94a3b8",
    },
    status: {
        fontSize: 12,
        fontWeight: "500",
        color: PRIMARY,
    },
    statusUnavailable: {
        color: "#cbd5e1",
    },
});
