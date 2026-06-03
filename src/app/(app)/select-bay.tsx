import { Skeleton } from "@/components/ui/Skeleton";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState } from "@/components/ui/StateCard";
import { AppText } from "@/design-system";
import { useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import { BaySlotScheduleResponse } from "@/types/member-bay";
import { formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    Pressable,
    View,
} from "react-native";

function chunkItems<T>(items: T[], size: number) {
    const rows: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
        rows.push(items.slice(index, index + size));
    }

    return rows;
}

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
    const loadingRows = chunkItems(Array.from({ length: 6 }, (_, index) => index), 3);
    const bayRows = chunkItems(slotGroup?.baySlots ?? [], 3);

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
        <Screen contentClassName="gap-6">
            <Animated.View entering={FadeInDown.duration(220)} className="gap-1">
                <AppText variant="value">Choose a bay</AppText>
                <AppText variant="meta" className="text-foreground/75">
                    {slotGroup
                        ? formatTimeRange(slotGroup.startDateTime, slotGroup.endDateTime)
                        : date}
                </AppText>
            </Animated.View>

            {isLoading ? (
                <View className="gap-3">
                    {loadingRows.map((row, rowIndex) => (
                        <View key={rowIndex} className="flex-row gap-3">
                            {row.map((item) => (
                                <View
                                    key={item}
                                    className="flex-1 rounded-2xl border border-border bg-card px-3 py-4"
                                >
                                    <View className="items-center gap-2">
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                        <Skeleton className="h-4 w-20 rounded-full" />
                                    </View>
                                </View>
                            ))}
                            {Array.from({ length: 3 - row.length }, (_, fillerIndex) => (
                                <View key={`loading-filler-${rowIndex}-${fillerIndex}`} className="flex-1" />
                            ))}
                        </View>
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

            <View className="gap-3">
                {bayRows.map((row, rowIndex) => (
                    <View key={rowIndex} className="flex-row gap-3">
                        {row.map((bay, index) => {
                            const available = bay.slotStatus === "AVAILABLE";
                            const animationIndex = rowIndex * 3 + index;

                            return (
                                <Animated.View
                                    key={bay.id}
                                    className="flex-1"
                                    entering={FadeInDown.delay(60 + animationIndex * 28).duration(220)}
                                >
                                    <Pressable
                                        className={`items-center gap-1.5 rounded-2xl border px-3 py-4 ${
                                            available
                                                ? "border-border bg-card active:bg-surface"
                                                : "border-muted bg-muted opacity-55"
                                        }`}
                                        onPress={() => available && handleSelect(bay)}
                                        disabled={!available}
                                    >
                                        <AppText
                                            variant="body"
                                            className={`text-center font-medium ${
                                                available ? "text-foreground" : "text-muted-foreground"
                                            }`}
                                        >
                                            {bay.bayName}
                                        </AppText>
                                        <AppText
                                            variant="label"
                                            className={`text-center ${
                                                available ? "text-primary" : "text-muted-foreground"
                                            }`}
                                        >
                                            {available ? "Available" : bay.slotStatus}
                                        </AppText>
                                    </Pressable>
                                </Animated.View>
                            );
                        })}
                        {Array.from({ length: 3 - row.length }, (_, fillerIndex) => (
                            <View key={`bay-filler-${rowIndex}-${fillerIndex}`} className="flex-1" />
                        ))}
                    </View>
                ))}
            </View>
        </Screen>
    );
}
