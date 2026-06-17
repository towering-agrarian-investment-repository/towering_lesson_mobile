import { AppText, EmptyState, ErrorState, Screen, Skeleton } from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import type { BaySlotScheduleResponse } from "@/types/member-bay";
import { getBaySlotAvailability } from "@/utils/bay-slot";
import { formatType } from "@/utils/format-enum";
import { formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Pressable,
    RefreshControl,
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
    const {
        date,
        ticketId,
        ticketName,
        ticketType,
        slotGroupId,
        mode,
        reservationId,
        notes,
    } = useLocalSearchParams<{
        date: string;
        ticketId?: string;
        ticketName: string;
        ticketType?: string;
        slotGroupId?: string;
        mode?: string;
        reservationId?: string;
        notes?: string;
    }>();

    const router = useRouter();
    const { isLocked, runWithNavigationLock } = useNavigationLock();

    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberBaySlotGroups(
        date,
        date,
        Boolean(date),
    );

    const slotGroup = (data?.data ?? []).find(
        (group) => String(group.id) === slotGroupId,
    );

    const loadingRows = chunkItems(
        Array.from({ length: 6 }, (_, index) => index),
        3,
    );

    const bayRows = chunkItems(slotGroup?.baySlots ?? [], 3);

    const handleSelect = (baySlot: BaySlotScheduleResponse) => {
        if (!slotGroup) return;

        runWithNavigationLock(() => {
            router.push({
                pathname: "/booking-confirm",
                params: {
                    date,
                    ticketId,
                    ticketName,
                    ticketType,
                    slotGroupId: String(slotGroup.id),
                    baySlotId: String(baySlot.id),
                    bayName: baySlot.bayName,
                    startTime: slotGroup.startDateTime,
                    endTime: slotGroup.endDateTime,
                    mode,
                    reservationId,
                    notes,
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
            <View className="gap-1">
                <AppText variant="h3">Choose a bay</AppText>

                <AppText variant="meta" className="text-foreground/75">
                    {slotGroup
                        ? `${formatTimeRange(
                            slotGroup.startDateTime,
                            slotGroup.endDateTime,
                        )}${formatType(ticketType) !== "-"
                            ? ` · ${formatType(ticketType)}`
                            : ""}`
                        : date}
                </AppText>
            </View>

            {isLoading ? (
                <View className="gap-3">
                    {loadingRows.map((row, rowIndex) => (
                        <View key={rowIndex} className="flex-row gap-3">
                            {row.map((item) => (
                                <View
                                    key={item}
                                    className="flex-1 rounded-xl border border-border bg-card px-3 py-4"
                                >
                                    <View className="items-center gap-2">
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                        <Skeleton className="h-4 w-20 rounded-full" />
                                    </View>
                                </View>
                            ))}

                            {Array.from(
                                { length: 3 - row.length },
                                (_, fillerIndex) => (
                                    <View
                                        key={`loading-filler-${rowIndex}-${fillerIndex}`}
                                        className="flex-1"
                                    />
                                ),
                            )}
                        </View>
                    ))}
                </View>
            ) : null}

            {isError ? (
                <ErrorState
                    title="Failed to load bays"
                    message="Pull to refresh and try again."
                    actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : null}

            {!isLoading && !isError && !slotGroup ? (
                <EmptyState
                    title="Time no longer available"
                    message="Please go back and choose another time."
                    actionLabel="Choose Another Time"
                    onAction={() => {
                        router.back();
                    }}
                />
            ) : null}

            {!isLoading && !isError && slotGroup ? (
                <View className="gap-3">
                    {bayRows.map((row, rowIndex) => (
                        <View key={rowIndex} className="flex-row gap-3">
                            {row.map((bay, index) => {
                                const {
                                    isBlocked,
                                    isReserved,
                                    isDisabled,
                                } = getBaySlotAvailability(bay);

                                const statusLabel = isBlocked
                                    ? "Blocked"
                                    : isReserved
                                        ? "Booked"
                                        : isDisabled
                                            ? "Unavailable"
                                            : "Available";

                                return (
                                    <View key={bay.id} className="flex-1">
                                        <Pressable
                                            className={`items-center gap-1.5 rounded-xl border px-3 py-4 ${!isDisabled
                                                    ? "border-border bg-card active:bg-surface"
                                                    : "border-muted bg-muted opacity-55"
                                                }`}
                                            onPress={() =>
                                                !isDisabled && handleSelect(bay)
                                            }
                                            disabled={isDisabled || isLocked}
                                        >
                                            <AppText
                                                variant="label"
                                                className={`text-center ${!isDisabled
                                                        ? "text-foreground"
                                                        : "text-muted-foreground"
                                                    }`}
                                            >
                                                {bay.bayName}
                                            </AppText>

                                            <AppText
                                                variant="badge"
                                                className={`text-center ${!isDisabled
                                                        ? "text-primary"
                                                        : "text-muted-foreground"
                                                    }`}
                                            >
                                                {statusLabel}
                                            </AppText>
                                        </Pressable>
                                    </View>
                                );
                            })}

                            {Array.from(
                                { length: 3 - row.length },
                                (_, fillerIndex) => (
                                    <View
                                        key={`bay-filler-${rowIndex}-${fillerIndex}`}
                                        className="flex-1"
                                    />
                                ),
                            )}
                        </View>
                    ))}
                </View>
            ) : null}
        </Screen>
    );
}
