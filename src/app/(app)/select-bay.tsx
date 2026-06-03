import { Skeleton } from "@/components/ui/Skeleton";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState } from "@/components/ui/StateCard";
import { AppText } from "@/design-system";
import { useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import { BaySlotScheduleResponse } from "@/types/member-bay";
import { formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Pressable,
    View,
} from "react-native";

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
        <Screen contentClassName="gap-6">
            <View className="gap-1">
                <AppText variant="value">Choose a bay</AppText>
                <AppText variant="meta" className="text-foreground/75">
                    {slotGroup
                        ? formatTimeRange(slotGroup.startDateTime, slotGroup.endDateTime)
                        : date}
                </AppText>
            </View>

            {isLoading ? (
                <View className="flex-row flex-wrap gap-3">
                    {Array.from({ length: 6 }, (_, index) => (
                        <Skeleton key={index} className="h-24 w-[31%] rounded-2xl" />
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

            <View className="flex-row flex-wrap gap-3">
                {slotGroup?.baySlots.map((bay) => {
                    const available = bay.slotStatus === "AVAILABLE";

                    return (
                        <Pressable
                            key={bay.id}
                            className={`w-[31%] items-center gap-1.5 rounded-2xl border px-3 py-4 ${
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
                    );
                })}
            </View>
        </Screen>
    );
}
