import { Skeleton } from "@/components/ui/Skeleton";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState } from "@/components/ui/StateCard";
import { useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import { BaySlotScheduleResponse } from "@/types/member-bay";
import { formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PRIMARY = "#38bdf8";

export default function BayScreen() {
    const { date, ticketId, slotGroupId } = useLocalSearchParams<{
        date: string;
        ticketId?: string;
        slotGroupId?: string;
    }>();
    const router = useRouter();
    const { data, isLoading, isError } = useMemberBaySlotGroups(
        date,
        date,
        Boolean(date),
    );

    const slotGroup = (data?.data ?? []).find(
        (group) => String(group.id) === slotGroupId,
    );

    const handleSelect = (baySlot: BaySlotScheduleResponse) => {
        if (!slotGroup) return;

        router.push({
            pathname: "/booking-confirm",
            params: {
                date,
                ticketId,
                baySlotId: String(baySlot.id),
                bayName: baySlot.bayName,
                startTime: slotGroup.startDateTime,
                endTime: slotGroup.endDateTime,
            },
        });
    };

    return (
        <Screen>
            <Text style={s.subLabel}>
                {slotGroup
                    ? formatTimeRange(slotGroup.startDateTime, slotGroup.endDateTime)
                    : date}
            </Text>

            {isLoading ? (
                <View style={s.grid}>
                    {Array.from({ length: 6 }, (_, index) => (
                        <Skeleton key={index} className="h-24 w-[30%] rounded-xl" />
                    ))}
                </View>
            ) : null}

            {isError ? (
                <ErrorState
                    title="Failed to load bays"
                    message="Pull to refresh and try again."
                />
            ) : null}

            {!isLoading && !isError && !slotGroup ? (
                <EmptyState
                    title="Time no longer available"
                    message="Please go back and choose another time."
                />
            ) : null}

            <View style={s.grid}>
                {slotGroup?.baySlots.map((bay) => {
                    const available = bay.slotStatus === "AVAILABLE";

                    return (
                        <TouchableOpacity
                            key={bay.id}
                            style={[s.chip, !available && s.chipUnavailable]}
                            onPress={() => available && handleSelect(bay)}
                            activeOpacity={available ? 0.7 : 1}
                            disabled={!available}
                        >
                            <Text
                                style={[
                                    s.chipLabel,
                                    !available && s.chipLabelUnavailable,
                                ]}
                            >
                                {bay.bayName}
                            </Text>
                            <Text
                                style={[
                                    s.chipStatus,
                                    !available && s.chipStatusUnavailable,
                                ]}
                            >
                                {available ? "Available" : bay.slotStatus}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Screen>
    );
}

const s = StyleSheet.create({
    subLabel: { fontSize: 13, color: "#94a3b8", marginBottom: 16 },
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
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    chip: {
        width: "30%",
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#e2e8f0",
        backgroundColor: "#f8fafc",
        alignItems: "center",
        gap: 4,
    },
    chipUnavailable: {
        backgroundColor: "#f1f5f9",
        borderColor: "#f1f5f9",
        opacity: 0.5,
    },
    chipLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0f172a",
        textAlign: "center",
    },
    chipLabelUnavailable: {
        color: "#94a3b8",
    },
    chipStatus: {
        fontSize: 11,
        color: PRIMARY,
        fontWeight: "500",
    },
    chipStatusUnavailable: {
        color: "#cbd5e1",
    },
});
