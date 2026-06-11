import { AppText, EmptyState, ErrorState, Screen, Skeleton } from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import { BaySlotGroupScheduleResponse } from "@/types/member-bay";
import { getBaySlotAvailability } from "@/utils/bay-slot";
import { formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import {
    Pressable,
    RefreshControl,
    View,
} from "react-native";

function getAvailableBayCount(group: BaySlotGroupScheduleResponse) {
    return group.baySlots.filter(
        (slot) => !getBaySlotAvailability(slot).isDisabled,
    ).length;
}

export default function TimeScreen() {
    const { date, ticketId } = useLocalSearchParams<{
        date: string;
        ticketId?: string;
    }>();

    const router = useRouter();
    const { isLocked, runWithNavigationLock } = useNavigationLock();

    const { data, isLoading, isError, refetch, isRefetching } =
        useMemberBaySlotGroups(
            date,
            date,
            Boolean(date),
        );

    const slotGroups = (data?.data ?? []).filter(
        (group) => getAvailableBayCount(group) > 0,
    );

    const handleSelect = (group: BaySlotGroupScheduleResponse) => {
        runWithNavigationLock(() => {
            router.push({
                pathname: "/select-bay",
                params: {
                    date,
                    ticketId,
                    slotGroupId: String(group.id),
                },
            });
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
            <MotiView
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 140 }}
                className="gap-1"
            >
                <AppText variant="h3">Choose a time</AppText>

                <AppText variant="meta" className="text-foreground/75">
                    {date}
                </AppText>
            </MotiView>

            {isLoading ? (
                <View className="items-center justify-center gap-3 py-2">
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton
                            key={index}
                            className="h-14 w-full rounded-xl"
                        />
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

            {!isLoading && !isError && slotGroups.length > 0 ? (
                <View className="gap-3">
                    {slotGroups.map((group) => (
                        <MotiView
                            key={group.id}
                            from={{ opacity: 0, translateY: 12 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{
                                type: "timing",
                                duration: 140,
                            }}
                        >
                            <Pressable
                                className="flex-row items-center justify-between rounded-xl border border-border bg-card px-4 py-4 active:bg-surface"
                                onPress={() => handleSelect(group)}
                                disabled={isLocked}
                            >
                                <AppText
                                    variant="body"
                                    className="font-medium text-foreground"
                                >
                                    {formatTimeRange(
                                        group.startDateTime,
                                        group.endDateTime,
                                    )}
                                </AppText>

                                <AppText variant="count" className="text-primary">
                                    {getAvailableBayCount(group)} bays
                                </AppText>
                            </Pressable>
                        </MotiView>
                    ))}
                </View>
            ) : null}
        </Screen>
    );
}
