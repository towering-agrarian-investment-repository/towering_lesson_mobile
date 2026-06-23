import ReservationCard from "@/components/golf/ReservationCard";
import {
    AppText,
    CircleLoader,
    EmptyState,
    ErrorState,
    Skeleton,
} from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
    getMemberReservationDetailQueryOptions,
    getMemberReservationsQueryOptions,
    useMemberReservations,
} from "@/lib/hook/useReservation";
import type { MemberReservationType } from "@/service/reservation.service";
import type {
    MemberReservationResponse,
    MemberReservationSummaryResponse,
} from "@/types/member-reservation";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, View } from "react-native";

export const RESERVATION_TABS: MemberReservationType[] = [
    "all",
    "bay",
    "private",
    "group",
    "program",
];

type ReservationItem =
    | MemberReservationResponse
    | MemberReservationSummaryResponse;

const reservationKeyExtractor = (item: ReservationItem) => String(item.id);

type ReservationTabSceneProps = {
    type: MemberReservationType;
};

export function ReservationTabScene({ type }: ReservationTabSceneProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
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
    } = useMemberReservations(type);

    const reservations = data?.items ?? [];

    useEffect(() => {
        void Promise.all(
            RESERVATION_TABS.filter((tab) => tab !== type).map((tab) =>
                queryClient.prefetchInfiniteQuery(getMemberReservationsQueryOptions(tab)),
            ),
        );
    }, [queryClient, type]);

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

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const handleRefetch = useCallback(() => {
        void refetch();
    }, [refetch]);

    if (isLoading) {
        return <ReservationLoadingState />;
    }

    if (isError) {
        return (
            <ErrorState
                title={t("reservations.failedListTitle")}
                message={t("common.pullToRefreshAndTryAgain")}
                actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                onAction={handleRefetch}
            />
        );
    }

    if (reservations.length === 0) {
        return (
            <EmptyState
                title={t("reservations.noReservationsTitle")}
                message={t("reservations.noReservationsMessage")}
                actionLabel={t("lessonLog.refresh")}
                onAction={handleRefetch}
            />
        );
    }

    return (
        <FlatList
            data={reservations}
            keyExtractor={reservationKeyExtractor}
            renderItem={renderReservationItem}
            style={{ flex: 1 }}
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={handleRefetch} />
            }
            contentContainerStyle={{
                paddingTop: 8,
                paddingBottom: 40,
                flexGrow: 0,
            }}
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
    const { t } = useTranslation();

    return (
        <View className="flex-row items-center justify-between pb-4">
            <AppText
                selectable
                variant="count"
                className="text-foreground/75"
                style={{ fontVariant: ["tabular-nums"] }}
            >
                {t("reservations.count", { count })}
            </AppText>

            {isUpdating ? (
                <AppText selectable variant="meta" className="text-foreground/75">
                    {t("reservations.updating")}
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
