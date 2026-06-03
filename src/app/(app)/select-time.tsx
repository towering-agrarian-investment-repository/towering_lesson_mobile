import { Skeleton } from "@/components/ui/Skeleton";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState } from "@/components/ui/StateCard";
import { AppText } from "@/design-system";
import { useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import { BaySlotGroupScheduleResponse } from "@/types/member-bay";
import { formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    Pressable,
    RefreshControl,
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
            contentClassName="gap-6"
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={() => {
                        void refetch();
                    }}
                />
            }
        >
            <Animated.View entering={FadeInDown.duration(220)} className="gap-1">
                <AppText variant="value">Choose a time</AppText>
                <AppText variant="meta" className="text-foreground/75">
                    {date}
                </AppText>
            </Animated.View>

            {isLoading ? (
                <View className="items-center justify-center gap-3 py-2">
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

            <View className="gap-3">
                {slotGroups.map((group, index) => (
                    <Animated.View
                        key={group.id}
                        entering={FadeInDown.delay(60 + index * 35).duration(220)}
                    >
                        <Pressable
                            className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-4 active:bg-surface"
                            onPress={() => handleSelect(group)}
                        >
                            <AppText variant="body" className="font-medium text-foreground">
                                {formatTimeRange(group.startDateTime, group.endDateTime)}
                            </AppText>

                            <AppText variant="label" className="text-primary">
                                {getAvailableBayCount(group)} bays
                            </AppText>
                        </Pressable>
                    </Animated.View>
                ))}
            </View>
        </Screen>
    );
}
