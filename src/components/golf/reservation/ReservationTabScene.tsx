import ReservationCard, { ReservationCardSkeleton } from "@/components/golf/ReservationCard";
import { ActionButton, EmptyState, ErrorState, Skeleton, StateList } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { getMemberReservationDetailQueryOptions, useMemberReservations } from "@/lib/hook/useReservation";
import type { MemberReservationType } from "@/service/reservation.service";
import type { MemberReservationSummaryResponse } from "@/types/member-reservation";
import { formatDateWeekdayYear } from "@/utils/time-helper";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

export const RESERVATION_TABS: MemberReservationType[] = ["all", "bay", "private", "group", "program"];

type ReservationItemEntry = { type: "item"; key: string; reservation: MemberReservationSummaryResponse };
type ReservationEntry =
    { type: "header"; key: string; startTime: string; count: number; isFirst: boolean } | ReservationItemEntry;

const reservationItemEntries = new WeakMap<MemberReservationSummaryResponse, ReservationItemEntry>();
const reservationKeyExtractor = (entry: ReservationEntry) => entry.key;
const getReservationItemType = (entry: ReservationEntry) => entry.type;
const RESERVATION_LIST_CONTENT_STYLE = {
    paddingTop: 8,
    paddingBottom: 40,
} as const;

function ReservationSeparator({ leadingItem }: { leadingItem: ReservationEntry }) {
    if (leadingItem.type === "header") return null;
    return <View className="h-3" />;
}

type ReservationTabSceneProps = {
    type: MemberReservationType;
    isActive: boolean;
    from?: string;
    to?: string;
    period: "all" | "upcoming" | "past";
    onPeriodChange: (period: "all" | "upcoming" | "past") => void;
};

function ReservationTabSceneContent({ type, isActive, from, to, period, onPeriodChange }: ReservationTabSceneProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { runWithNavigationLock } = useNavigationLock();

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
        isFetchNextPageError,
    } = useMemberReservations(type, from, to, isActive);

    const { entries, reservationCount } = useMemo(() => {
        const seenKeys = new Set<string>();
        const dateCounts = new Map<string, number>();
        const items: ReservationItemEntry[] = [];
        for (const reservation of data?.items ?? []) {
            const key = `${reservation.reservationType}:${reservation.id}`;
            if (seenKeys.has(key)) continue;
            seenKeys.add(key);
            dateCounts.set(reservation.reservationDate, (dateCounts.get(reservation.reservationDate) ?? 0) + 1);
            let entry = reservationItemEntries.get(reservation);
            if (!entry) {
                entry = { type: "item", key, reservation };
                reservationItemEntries.set(reservation, entry);
            }
            items.push(entry);
        }

        const entries: ReservationEntry[] = [];
        let previousDate: string | undefined;
        for (const entry of items) {
            const { reservationDate, startTime } = entry.reservation;
            if (reservationDate !== previousDate) {
                entries.push({
                    type: "header",
                    key: `date:${entry.key}`,
                    startTime,
                    count: dateCounts.get(reservationDate) ?? 1,
                    isFirst: entries.length === 0,
                });
                previousDate = reservationDate;
            }
            entries.push(entry);
        }
        return { entries, reservationCount: items.length };
    }, [data?.items]);

    const handleReservationPress = useCallback(
        (reservation: MemberReservationSummaryResponse) => {
            void queryClient.prefetchQuery(
                getMemberReservationDetailQueryOptions(reservation.id, reservation.reservationType),
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

    const renderReservationItem: ListRenderItem<ReservationEntry> = useCallback(
        ({ item }) =>
            item.type === "header" ? (
                <ReservationDateHeader startTime={item.startTime} count={item.count} isFirst={item.isFirst} />
            ) : (
                <ReservationCard reservation={item.reservation} animate={isActive} onPress={handleReservationPress} />
            ),
        [handleReservationPress, isActive],
    );

    const { refreshing: isPullRefreshing, onRefresh: handleRefetch } = usePullToRefresh(() =>
        refetch({ cancelRefetch: false }),
    );

    const handleFetchNextPage = useCallback(() => {
        if (hasNextPage && !isFetching && !isPullRefreshing) {
            void fetchNextPage({ cancelRefetch: false });
        }
    }, [fetchNextPage, hasNextPage, isFetching, isPullRefreshing]);

    const handleEndReached = useCallback(() => {
        if (isActive && !isFetchNextPageError) handleFetchNextPage();
    }, [handleFetchNextPage, isActive, isFetchNextPageError]);

    if (isLoading) {
        return <ReservationLoadingState />;
    }

    if (isError && !data) {
        return (
            <StateList refreshing={isPullRefreshing} onRefresh={handleRefetch}>
                <ErrorState
                    title={t("reservations.failedListTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching}
                    onAction={handleRefetch}
                />
            </StateList>
        );
    }

    if (reservationCount === 0) {
        return (
            <StateList refreshing={isPullRefreshing} onRefresh={handleRefetch}>
                <EmptyState
                    title={t(
                        period === "past"
                            ? "reservations.noPastReservationsTitle"
                            : period === "upcoming"
                              ? "reservations.noUpcomingReservationsTitle"
                              : "reservations.noReservationsTitle",
                    )}
                    message={t(
                        period === "past"
                            ? "reservations.noPastReservationsMessage"
                            : period === "upcoming"
                              ? "reservations.noUpcomingReservationsMessage"
                              : "reservations.noReservationsMessage",
                    )}
                    actionLabel={t(period === "all" ? "common.refresh" : "reservations.showAll")}
                    actionPending={period === "all" && isRefetching}
                    onAction={period === "all" ? handleRefetch : () => onPeriodChange("all")}
                />
            </StateList>
        );
    }

    return (
        <FlashList
            data={entries}
            extraData={isActive}
            keyExtractor={reservationKeyExtractor}
            getItemType={getReservationItemType}
            renderItem={renderReservationItem}
            ItemSeparatorComponent={ReservationSeparator}
            refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handleRefetch} />}
            contentContainerStyle={RESERVATION_LIST_CONTENT_STYLE}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
                <ReservationListHeader
                    count={reservationCount}
                    hasMore={hasNextPage}
                    isUpdating={isFetching && !isFetchingNextPage}
                    hasRefreshError={isError && !isFetching && !isFetchNextPageError}
                />
            }
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
                isFetchingNextPage ? (
                    <ReservationListFooter />
                ) : isFetchNextPageError ? (
                    <ReservationListFooter onRetry={handleFetchNextPage} retrying={isFetching || isFetchingNextPage} />
                ) : undefined
            }
        />
    );
}

export const ReservationTabScene = memo(ReservationTabSceneContent);

function ReservationLoadingState() {
    return (
        <View className="flex-1 flex-col gap-3 overflow-hidden pb-10 pt-5">
            <ReservationListHeaderSkeleton />
            <View className="flex-row items-baseline justify-between px-0.5 pt-2">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-3.5 w-16 rounded-full" />
            </View>
            <View className="gap-3">
                {Array.from({ length: 5 }, (_, index) => (
                    <ReservationCardSkeleton key={index} />
                ))}
            </View>
        </View>
    );
}

function ReservationDateHeader({
    startTime,
    count,
    isFirst = false,
}: {
    startTime: string;
    count: number;
    isFirst?: boolean;
}) {
    const { t } = useTranslation();

    return (
        <View
            className={
                isFirst
                    ? "flex-row items-baseline justify-between gap-2 px-0.5 pb-3 pt-1"
                    : "flex-row items-baseline justify-between gap-2 px-0.5 pb-3 pt-3.5"
            }
        >
            <AppText
                variant="label"
                numberOfLines={1}
                style={{ flex: 1, minWidth: 0 }}
                textStyle={{ fontWeight: "700" }}
            >
                {formatDateWeekdayYear(startTime)}
            </AppText>
            <AppText variant="caption" color="mutedForeground" wrap={false} tabular numberOfLines={1}>
                {t("reservations.count", { count })}
            </AppText>
        </View>
    );
}

function ReservationListHeaderSkeleton() {
    return (
        <View className="flex-row items-center justify-between px-0.5">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-3.5 w-16 rounded-full" />
        </View>
    );
}

function ReservationListHeader({
    count,
    hasMore,
    isUpdating,
    hasRefreshError,
}: {
    count: number;
    hasMore: boolean;
    isUpdating: boolean;
    hasRefreshError: boolean;
}) {
    const { t } = useTranslation();

    return (
        <View className="flex-col gap-1.5 px-0.5 pb-2">
            <View className="flex-row items-center justify-between gap-2">
                <AppText variant="subtext" color="mutedForeground" tabular style={{ flex: 1, minWidth: 0 }}>
                    {t(hasMore ? "reservations.showingCount" : "reservations.count", {
                        count,
                    })}
                </AppText>

                {isUpdating ? (
                    <AppText variant="caption" color="mutedForeground" wrap={false}>
                        {t("reservations.updating")}
                    </AppText>
                ) : null}
            </View>

            {hasRefreshError ? (
                <AppText variant="caption" color="mutedForeground">
                    {t("common.pullToRefreshAndTryAgain")}
                </AppText>
            ) : null}
        </View>
    );
}

function ReservationListFooter({ onRetry, retrying = false }: { onRetry?: () => void; retrying?: boolean }) {
    const { t } = useTranslation();

    if (!onRetry) {
        return (
            <View className="py-3">
                <ReservationCardSkeleton />
            </View>
        );
    }

    return (
        <View className="items-center gap-3 py-5">
            <AppText variant="subtext" color="mutedForeground" align="center">
                {t("reservations.failedMoreTitle")}
            </AppText>
            <ActionButton
                label={t("common.refreshTryAgain")}
                appearance="outlined"
                disabled={retrying}
                loading={retrying}
                onPress={onRetry}
            />
        </View>
    );
}
