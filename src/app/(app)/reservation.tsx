import { memo, useCallback, useState } from "react";
import {
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";

import ReservationCard from "@/components/golf/ReservationCard";
import { CircleLoader } from "@/components/ui/CircleLoader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/StateCard";
import { useMemberReservations } from "@/lib/hook/useReservation";
import { MemberReservationType } from "@/service/reservation.service";
import type {
    MemberReservationResponse,
    MemberReservationSummaryResponse,
} from "@/types/member-reservation";

const MemoReservationCard = memo(ReservationCard);

const RESERVATION_TABS: MemberReservationType[] = [
    "all",
    "bay",
    "private",
    "group",
    "program",
];

const TAB_LABELS: Record<MemberReservationType, string> = {
    all: "All",
    bay: "Bay",
    private: "Private",
    group: "Group",
    program: "Program",
};

type ReservationItem =
    | MemberReservationResponse
    | MemberReservationSummaryResponse;

export default function ReservationScreen() {
    const [activeTab, setActiveTab] = useState<MemberReservationType>("all");

    const {
        data,
        isLoading,
        isFetching,
        refetch,
        isRefetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useMemberReservations(activeTab);

    const reservations = data?.items ?? [];

    const keyExtractor = useCallback((item: ReservationItem) => {
        return String(item.id);
    }, []);

    const renderReservationItem = useCallback(
        ({ item }: { item: ReservationItem }) => (
            <MemoReservationCard reservation={item} tab={activeTab} />
        ),
        [activeTab],
    );

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
        <View className="flex-1 bg-white">
            <View className="px-6 pt-6">
                <View className="flex-row border-b border-gray-200">
                    {RESERVATION_TABS.map((tab) => {
                        const isActive = activeTab === tab;

                        return (
                            <Pressable
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                className="flex-1 items-center pb-3"
                            >
                                <Text
                                    className={`text-base font-bold ${isActive
                                        ? "text-green-600"
                                        : "text-gray-400"
                                        }`}
                                >
                                    {TAB_LABELS[tab]}
                                </Text>

                                {isActive ? (
                                    <View className="absolute bottom-0 h-0.5 w-full rounded-full bg-green-600" />
                                ) : null}
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <View className="flex-1">
                {isLoading ? (
                    <View className="px-6 pt-5 pb-10">
                        <ReservationListHeaderSkeleton />

                        <View className="gap-5">
                            {Array.from({ length: 3 }, (_, index) => (
                                <ReservationCardSkeleton key={index} />
                            ))}
                        </View>
                    </View>
                ) : reservations.length === 0 ? (
                    <EmptyState
                        title="No reservations found"
                        message="Your reservations will appear here."
                    />
                ) : (
                    <FlatList
                        data={reservations}
                        keyExtractor={keyExtractor}
                        renderItem={renderReservationItem}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefetching}
                                onRefresh={() => {
                                    void refetch();
                                }}
                            />
                        }
                        contentContainerClassName="px-6 pt-5 pb-10"
                        ItemSeparatorComponent={ReservationItemSeparator}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={8}
                        maxToRenderPerBatch={8}
                        windowSize={7}
                        removeClippedSubviews
                        updateCellsBatchingPeriod={50}
                        ListHeaderComponent={
                            <ReservationListHeader
                                count={reservations.length}
                                isUpdating={isFetching && !isFetchingNextPage}
                            />
                        }
                        onEndReached={handleEndReached}
                        onEndReachedThreshold={0.4}
                        ListFooterComponent={
                            isFetchingNextPage ? <ReservationListFooter /> : null
                        }
                    />
                )}
            </View>
        </View>
    );
}

function ReservationItemSeparator() {
    return <View className="h-5" />;
}

function ReservationListHeaderSkeleton() {
    return (
        <View className="mb-4 flex-row items-center justify-between">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
        </View>
    );
}

function ReservationCardSkeleton() {
    return (
        <View className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-md">
            <View className="gap-4">
                <View className="flex-row items-center gap-2">
                    <Skeleton className="h-2.5 w-2.5 rounded-full" />
                    <Skeleton className="h-6 flex-1 rounded-full" />
                </View>

                <Skeleton className="h-px w-full rounded-none" />

                <View className="flex-row items-center gap-3">
                    <View className="h-[82px] w-[72px] rounded-2xl bg-gray-100 px-3 py-3">
                        <Skeleton className="h-4 w-10 rounded-full" />
                        <Skeleton className="mt-3 h-8 w-12 rounded-full" />
                    </View>

                    <View className="flex-1">
                        <Skeleton className="h-4 w-32 rounded-full" />
                        <Skeleton className="mt-2 h-7 w-36 rounded-full" />
                    </View>

                    <Skeleton className="h-9 w-9 rounded-full" />
                </View>
            </View>
        </View>
    );
}

function ReservationListHeader({
    count,
    isUpdating,
}: {
    count: number;
    isUpdating: boolean;
}) {
    return (
        <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">
                {count} Records
            </Text>

            {isUpdating ? (
                <Text className="text-xs font-medium text-gray-400">
                    Updating...
                </Text>
            ) : null}
        </View>
    );
}

function ReservationListFooter() {
    return (
        <View className="py-5">
            <CircleLoader />
        </View>
    );
}
