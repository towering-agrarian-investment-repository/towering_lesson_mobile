import { Skeleton } from "@/components/ui/Skeleton";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState } from "@/components/ui/StateCard";
import { useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import { BaySlotGroupScheduleResponse } from "@/types/member-bay";
import { formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Pressable,
    RefreshControl,
    Text,
    View
} from "react-native";

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
        <Screen
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={() => {
                        void refetch();
                    }}
                />
            }
        >
            <Text className="mb-4 text-[13px] text-slate-400">{date}</Text>

            {isLoading ? (
                <View className="items-center justify-center gap-2 py-6">
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
            <View className="gap-2">
                {slotGroups.map((group) => (
                    <Pressable
                        key={group.id}
                        className="flex-row items-center justify-between rounded-xl border-[1.5px] border-slate-200 bg-slate-50 px-4 py-3.5 active:opacity-70"
                        onPress={() => handleSelect(group)}
                    >
                        <Text className="text-[15px] font-semibold text-slate-900">
                            {formatTimeRange(group.startDateTime, group.endDateTime)}
                        </Text>

                        <Text className="text-xs font-medium text-sky-400">
                            {getAvailableBayCount(group)} bays
                        </Text>
                    </Pressable>
                ))}
            </View>
        </Screen>
    );
}
