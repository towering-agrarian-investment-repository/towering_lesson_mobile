import TicketHistoryCard, {
    TicketHistoryCardSkeleton,
} from "@/components/golf/TicketHistoryCard";
import { EmptyState, ErrorState, ListRetryFooter, StateList } from "@/design-system";
import { prefetchTicketAvailability } from "@/lib/booking/prefetchTicketAvailability";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import {
    getMemberTicketByIdQueryOptions,
    useMemberTickets,
} from "@/lib/hook/useTicket";
import type { TicketListItemResponse } from "@/types/member-ticket";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

export const TICKET_TABS = ["all", "bay", "lesson"] as const;
export type TicketTabType = (typeof TICKET_TABS)[number];

const ticketKeyExtractor = (item: TicketListItemResponse) => String(item.id);
const TICKET_LIST_CONTENT_STYLE = {
    paddingTop: 16,
    paddingBottom: 40,
} as const;

function TicketSeparator() {
    return <View className="h-3" />;
}

type TicketTabSceneProps = {
    type: TicketTabType;
    isActive: boolean;
};

function TicketTabSceneContent({ type, isActive }: TicketTabSceneProps) {
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
        isFetchNextPageError,
    } = useMemberTickets();
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => refetch({ cancelRefetch: false }));
    const filteredTickets = useMemo(() => {
        const tickets = data?.items ?? [];

        if (type === "all") {
            return tickets;
        }

        return tickets.filter((ticket) =>
            type === "bay"
                ? ticket.type === "BAY_USAGE"
                : ticket.type !== "BAY_USAGE",
        );
    }, [data?.items, type]);

    const handleFetchNextPage = useCallback(() => {
        if (hasNextPage && !isFetching) {
            void fetchNextPage({ cancelRefetch: false });
        }
    }, [fetchNextPage, hasNextPage, isFetching]);
    const handleEndReached = useCallback(() => {
        if (!isFetchNextPageError && isActive) handleFetchNextPage();
    }, [handleFetchNextPage, isActive, isFetchNextPageError]);

    useEffect(() => {
        if (
            isActive &&
            filteredTickets.length === 0 &&
            hasNextPage &&
            !isFetchNextPageError
        ) {
            handleFetchNextPage();
        }
    }, [
        filteredTickets.length,
        handleFetchNextPage,
        hasNextPage,
        isActive,
        isFetchNextPageError,
    ]);

    const handleTicketPress = useCallback(
        (item: TicketListItemResponse) => {
            void queryClient.prefetchQuery(
                getMemberTicketByIdQueryOptions(item.id),
            );
            runWithNavigationLock(() => {
                router.push({
                    pathname: "/tickets/[id]",
                    params: { id: String(item.id) },
                });
            });
        },
        [queryClient, router, runWithNavigationLock],
    );

    const handleBookPress = useCallback(
        (item: TicketListItemResponse) => {
            prefetchTicketAvailability(queryClient, item);
            runWithNavigationLock(() => {
                router.push({
                    pathname: "/select-date",
                    params: {
                        ticketId: String(item.id),
                        ticketName: item.name,
                        ticketType: item.type,
                    },
                });
            });
        },
        [queryClient, router, runWithNavigationLock],
    );

    const renderTicket: ListRenderItem<TicketListItemResponse> = useCallback(
        ({ item }) => (
            <TicketHistoryCard
                item={item}
                showBookAction
                disabled={isLocked}
                onPress={handleTicketPress}
                onBookPress={handleBookPress}
            />
        ),
        [handleBookPress, handleTicketPress, isLocked],
    );

    if (isLoading) {
        return (
            <View className="flex-1 gap-3 overflow-hidden pt-4">
                {Array.from({ length: 6 }, (_, index) => (
                    <TicketHistoryCardSkeleton key={index} />
                ))}
            </View>
        );
    }

    if (isError && !data) {
        return (
            <StateList
                refreshing={isPullRefreshing}
                onRefresh={handlePullRefresh}
            >
                <ErrorState
                    title={t("tickets.loadError")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={
                        isRefetching
                            ? t("common.refreshing")
                            : t("common.refreshTryAgain")
                    }
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </StateList>
        );
    }

    if (filteredTickets.length === 0 && isFetchNextPageError) {
        return (
            <StateList
                refreshing={isPullRefreshing}
                onRefresh={handlePullRefresh}
            >
                <ErrorState
                    title={t("tickets.loadError")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={t("common.refreshTryAgain")}
                    actionPending={isFetchingNextPage}
                    onAction={handleFetchNextPage}
                />
            </StateList>
        );
    }

    if (filteredTickets.length === 0 && hasNextPage) {
        return (
            <View className="flex-1 gap-3 overflow-hidden pt-4">
                {Array.from({ length: 6 }, (_, index) => (
                    <TicketHistoryCardSkeleton key={index} />
                ))}
            </View>
        );
    }

    if (filteredTickets.length === 0) {
        return (
            <StateList
                refreshing={isPullRefreshing}
                onRefresh={handlePullRefresh}
            >
                <EmptyState
                    title={t("tickets.empty")}
                    actionLabel={t("common.refresh")}
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </StateList>
        );
    }

    return (
        <FlashList
            data={filteredTickets}
            keyExtractor={ticketKeyExtractor}
            renderItem={renderTicket}
            ItemSeparatorComponent={TicketSeparator}
            decelerationRate="normal"
            nestedScrollEnabled
            contentContainerStyle={TICKET_LIST_CONTENT_STYLE}
            refreshControl={
                <RefreshControl
                    refreshing={isPullRefreshing}
                    onRefresh={handlePullRefresh}
                />
            }
            showsVerticalScrollIndicator={false}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
                isFetchingNextPage ? (
                    <View className="py-3">
                        <TicketHistoryCardSkeleton />
                    </View>
                ) : isFetchNextPageError ? (
                    <ListRetryFooter
                        disabled={isFetching || isFetchingNextPage}
                        busy={isFetchingNextPage}
                        onRetry={handleFetchNextPage}
                    />
                ) : undefined
            }
        />
    );
}

export const TicketTabScene = memo(TicketTabSceneContent);
