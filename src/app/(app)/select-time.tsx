import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateCard";
import { useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import { BaySlotGroupScheduleResponse } from "@/types/member-bay";
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

function formatRange(start: string, end: string) {
    return `${fmtTime(start)} - ${fmtTime(end)}`;
}

function getAvailableBayCount(group: BaySlotGroupScheduleResponse) {
    return group.baySlots.filter((slot) => slot.slotStatus === "AVAILABLE").length;
}

export default function TimeScreen() {
    const { date, ticketId } = useLocalSearchParams<{
        date: string;
        ticketId?: string;
    }>();
    const router = useRouter();
    const { data, isLoading, isError, refetch, isRefetching } = useMemberBaySlotGroups(
        date,
        date,
        Boolean(date),
    );

    const slotGroups = (data?.data ?? []).filter(
        (group) => getAvailableBayCount(group) > 0,
    );

    const handleSelect = (group: BaySlotGroupScheduleResponse) => {
        router.push({
            pathname: "/select-bay",
            params: {
                date,
                ticketId,
                slotGroupId: String(group.id),
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
                        <Skeleton key={index} className="h-14 w-full rounded-xl" />
                    ))}
                </View>
            ) : null}

            {isError ? (
                <ErrorState
                    title="Failed to load available times"
                    message="Pull to refresh and try again."
                />
            ) : null}

            {!isLoading && !isError && slotGroups.length === 0 ? (
                <EmptyState
                    title="No available times"
                    message="There are no available times for this date."
                />
            ) : null}

            <View style={s.list}>
                {slotGroups.map((group) => (
                    <TouchableOpacity
                        key={group.id}
                        style={s.row}
                        onPress={() => handleSelect(group)}
                        activeOpacity={0.7}
                    >
                        <Text style={s.range}>
                            {formatRange(group.startDateTime, group.endDateTime)}
                        </Text>
                        <Text style={s.status}>
                            {getAvailableBayCount(group)} bays
                        </Text>
                    </TouchableOpacity>
                ))}
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
    },
    range: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0f172a",
    },
    status: {
        fontSize: 12,
        fontWeight: "500",
        color: PRIMARY,
    },
});
