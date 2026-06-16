import { useCallback, useEffect, useRef, useState } from "react";
import {
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    View,
} from "react-native";

import ReservationCard from "@/components/golf/ReservationCard";
import {
    AppText,
    CircleLoader,
    cn,
    EmptyState,
    ErrorState,
    Screen,
    Skeleton,
} from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
    getMemberReservationDetailQueryOptions,
    getMemberReservationsQueryOptions,
    useMemberReservations,
} from "@/lib/hook/useReservation";
import { MemberReservationType } from "@/service/reservation.service";
import type {
    MemberReservationResponse,
    MemberReservationSummaryResponse,
} from "@/types/member-reservation";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

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
    const router = useRouter();
    const queryClient = useQueryClient();
    const listRef = useRef<FlatList<ReservationItem>>(null);
    const { isLocked, runWithNavigationLock } = useNavigationLock();

    const {
        data,
        isLoading,
        isError,
        isFetching,
        refetch,
        isRefetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useMemberReservations(activeTab);

    const reservations = data?.items ?? [];

    useEffect(() => {
        const tabsToPrefetch = RESERVATION_TABS.filter((tab) => tab !== activeTab);

        void Promise.all(
            tabsToPrefetch.map((tab) =>
                queryClient.prefetchInfiniteQuery(getMemberReservationsQueryOptions(tab))),
        );
    }, [activeTab, queryClient]);

    const keyExtractor = useCallback((item: ReservationItem) => {
        return String(item.id);
    }, []);

    const handleReservationPress = useCallback(
        (reservation: ReservationItem) => {
            void queryClient.prefetchQuery(
                getMemberReservationDetailQueryOptions(
                    reservation.id,
                    reservation.reservationType,
                ),
            );

            runWithNavigationLock(() => {
                router.push({
                    pathname: "/reservation/[id]",
                    params: {
                        id: String(reservation.id),
                        type: reservation.reservationType,
                    },
                });
            });
        },
        [queryClient, router, runWithNavigationLock],
    );

    const renderReservationItem = useCallback(
        ({ item }: { item: ReservationItem }) => (
            <ReservationCard
                reservation={item}
                disabled={isLocked}
                onPress={handleReservationPress}
            />
        ),
        [handleReservationPress, isLocked],
    );

    const handleTabChange = useCallback((tab: MemberReservationType) => {
        setActiveTab(tab);

        requestAnimationFrame(() => {
            listRef.current?.scrollToOffset({
                offset: 0,
                animated: false,
            });
        });
    }, []);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const handleRefetch = useCallback(() => {
        void refetch();
    }, [refetch]);

    return (
        <Screen scroll={false}>
            <View className="flex-1 flex-col">
                <ReservationTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />

                <View className="flex-1">
                    {isLoading ? (
                        <ReservationLoadingState />
                    ) : isError ? (
                        <ErrorState
                            title="Failed to load reservations"
                            message="Pull to refresh and try again."
                            actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
                            onAction={handleRefetch}
                        />
                    ) : reservations.length === 0 ? (
                        <EmptyState
                            title="No reservations found"
                            message="Your reservations will appear here."
                            actionLabel="Refresh"
                            onAction={handleRefetch}
                        />
                    ) : (
                        <FlatList
                            ref={listRef}
                            data={reservations}
                            keyExtractor={keyExtractor}
                            renderItem={renderReservationItem}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isRefetching}
                                    onRefresh={handleRefetch}
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
        <View className="border-b border-border bg-background">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 0,
                }}
            >
                <View className="flex-row items-end gap-2">
                    {RESERVATION_TABS.map((tab) => {
                        const isActive = activeTab === tab;

                        return (
                            <Pressable
                                key={tab}
                                onPress={() => onTabChange(tab)}
                                className="min-h-11 items-center justify-end gap-2 pr-4"
                                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                            >
                                <AppText
                                    variant="label"
                                    className={cn(
                                        "text-lg font-semibold",
                                        isActive && "text-primary",
                                        !isActive && "text-foreground/65",
                                    )}
                                >
                                    {TAB_LABELS[tab]}
                                </AppText>

                                <View
                                    className={cn(
                                        "h-0.5 w-8 rounded-full",
                                        isActive && "bg-primary",
                                        !isActive && "bg-transparent",
                                    )}
                                />
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>
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
        <View className="overflow-hidden rounded-xl border border-border bg-card p-4">
            <View className="flex-col gap-4">
                <View className="flex-row items-center gap-3">
                    <Skeleton className="h-2.5 w-2.5 rounded-full" />
                    <Skeleton className="h-5 flex-1 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </View>

                <Skeleton className="h-px w-full rounded-none" />

                <View className="flex-row items-center gap-3">
                    <View className="h-[82px] w-[72px] flex-col gap-3 rounded-lg bg-muted px-3 py-3">
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
                variant="count"
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