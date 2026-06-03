import { useCallback, useState } from "react";
import {
    FlatList,
    Pressable,
    RefreshControl,
    View,
} from "react-native";

import ReservationCard from "@/components/golf/ReservationCard";
import { CircleLoader } from "@/components/ui/CircleLoader";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/StateCard";
import { AppText } from "@/design-system";
import { useMemberReservations } from "@/lib/hook/useReservation";
import { MemberReservationType } from "@/service/reservation.service";
import type {
    MemberReservationResponse,
    MemberReservationSummaryResponse,
} from "@/types/member-reservation";

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
            <ReservationCard reservation={item} />
        ),
        [],
    );

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
        <Screen scroll={false}>
            <View className="flex-1 flex-col">
                <ReservationTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <View className="flex-1">
                    {isLoading ? (
                        <ReservationLoadingState />
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
                            contentContainerStyle={{
                                paddingTop: 20,
                                paddingBottom: 40,
                            }}
                            contentInsetAdjustmentBehavior="automatic"
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
        </Screen>
    );
}

function ReservationTabs({
    activeTab,
    onTabChange,
}: {
    activeTab: MemberReservationType;
    onTabChange: (tab: MemberReservationType) => void;
}) {
    return (
        <View className="flex-row border-b border-border">
            {RESERVATION_TABS.map((tab) => {
                const isActive = activeTab === tab;

                return (
                    <Pressable
                        key={tab}
                        onPress={() => onTabChange(tab)}
                        className="flex-1 items-center pb-3"
                    >
                        <AppText
                            variant="label"
                            className={isActive ? "text-primary" : "text-muted-foreground"}
                        >
                            {TAB_LABELS[tab]}
                        </AppText>

                        {isActive ? (
                            <View className="absolute bottom-0 h-0.5 w-full rounded-full bg-primary" />
                        ) : null}
                    </Pressable>
                );
            })}
        </View>
    );
}

function ReservationLoadingState() {
    return (
        <View className="flex-col gap-4 pb-10 pt-5">
            <ReservationListHeaderSkeleton />

            <View className="flex-col gap-5">
                {Array.from({ length: 3 }, (_, index) => (
                    <ReservationCardSkeleton key={index} />
                ))}
            </View>
        </View>
    );
}

function ReservationItemSeparator() {
    return <View className="h-5" />;
}

function ReservationListHeaderSkeleton() {
    return (
        <View className="flex-row items-center justify-between">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
        </View>
    );
}

function ReservationCardSkeleton() {
    return (
        <View className="overflow-hidden rounded-2xl border border-border bg-card p-4">
            <View className="flex-col gap-4">
                <View className="flex-row items-center gap-3">
                    <Skeleton className="h-2.5 w-2.5 rounded-full" />
                    <Skeleton className="h-5 flex-1 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </View>

                <Skeleton className="h-px w-full rounded-none" />

                <View className="flex-row items-center gap-3">
                    <View className="h-[82px] w-[72px] flex-col gap-3 rounded-2xl bg-muted px-3 py-3">
                        <Skeleton className="h-4 w-8 rounded-full" />
                        <Skeleton className="h-8 w-12 rounded-full" />
                    </View>

                    <View className="flex-1 flex-col gap-2">
                        <Skeleton className="h-4 w-14 rounded-full" />
                        <Skeleton className="h-6 w-32 rounded-full" />
                        <Skeleton className="h-4 w-24 rounded-full" />
                    </View>

                    <Skeleton className="h-5 w-4 rounded-full" />
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
        <View className="flex-row items-center justify-between pb-4">
            <AppText
                selectable
                variant="meta"
                className="text-foreground/75"
                style={{ fontVariant: ["tabular-nums"] }}
            >
                {count} reservation{count !== 1 ? "s" : ""}
            </AppText>

            {isUpdating ? (
                <AppText selectable variant="meta" className="text-foreground/75">
                    Updating...
                </AppText>
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
