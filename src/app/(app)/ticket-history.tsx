import TicketHistoryCard, {
    TicketHistoryCardSkeleton,
} from "@/components/golf/TicketHistoryCard";
import {
    AppText,
    EmptyState,
    ErrorState,
    ListRetryFooter,
    Screen,
    SegmentedControl,
    Skeleton,
    StateList,
} from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import {
    getMemberTicketByIdQueryOptions,
    useMemberTickets,
} from "@/lib/hook/useTicket";
import type { TicketListItemResponse } from "@/types/member-ticket";
import { getEffectiveTicketStatus } from "@/utils/status-tone";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

type TicketHistoryFilter = "all" | "active" | "past";

const ALL_TICKET_STATUSES: readonly string[] = [];
const ticketHistoryKeyExtractor = (item: TicketListItemResponse) =>
    String(item.id);
const TICKET_HISTORY_LIST_CONTENT_STYLE = {
    paddingTop: 4,
    paddingBottom: 40,
} as const;

function TicketHistorySeparator() {
    return <View className="h-3" />;
}
const ACTIVE_TICKET_STATUSES: readonly string[] = ["ACTIVE", "IN_USE"];

function isPastTicket(ticket: TicketListItemResponse) {
    const status = getEffectiveTicketStatus(ticket.status, ticket.fullyUsed);
    return (
        status === "FULLY_USED" ||
        status === "EXPIRED" ||
        status === "CANCELLED" ||
        status === "CANCELED" ||
        status === "TRANSFERRED"
    );
}

export default function TicketHistoryScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const [filter, setFilter] = useState<TicketHistoryFilter>("all");

    const queryStatuses =
        filter === "active" ? ACTIVE_TICKET_STATUSES : ALL_TICKET_STATUSES;

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
    } = useMemberTickets({ statuses: queryStatuses });

    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => refetch({ cancelRefetch: false }));

    const { displayedTickets, activeCount, pastCount } = useMemo(() => {
        const tickets = data?.items ?? [];
        const active: TicketListItemResponse[] = [];
        const past: TicketListItemResponse[] = [];

        for (const ticket of tickets) {
            if (isPastTicket(ticket)) {
                past.push(ticket);
            } else {
                active.push(ticket);
            }
        }

        if (filter === "active") {
            return {
                displayedTickets: active,
                activeCount: active.length,
                pastCount: 0,
            };
        }
        if (filter === "past") {
            return {
                displayedTickets: past,
                activeCount: 0,
                pastCount: past.length,
            };
        }

        return {
            displayedTickets: [...active, ...past],
            activeCount: active.length,
            pastCount: past.length,
        };
    }, [data?.items, filter]);

    const handleFetchNextPage = useCallback(() => {
        if (hasNextPage && !isFetching) {
            void fetchNextPage({ cancelRefetch: false });
        }
    }, [fetchNextPage, hasNextPage, isFetching]);

    const handleEndReached = useCallback(() => {
        if (!isFetchNextPageError) {
            handleFetchNextPage();
        }
    }, [handleFetchNextPage, isFetchNextPageError]);

    useEffect(() => {
        if (
            filter !== "all" &&
            displayedTickets.length === 0 &&
            hasNextPage &&
            !isFetchNextPageError
        ) {
            handleFetchNextPage();
        }
    }, [
        filter,
        displayedTickets.length,
        handleFetchNextPage,
        hasNextPage,
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

    const renderTicket: ListRenderItem<TicketListItemResponse> = useCallback(
        ({ item, index }) => {
            const showActiveHeader =
                filter === "all" && activeCount > 0 && index === 0;
            const showPastHeader =
                filter === "all" && pastCount > 0 && index === activeCount;
            const card = (
                <TicketHistoryCard
                    item={item}
                    disabled={isLocked}
                    onPress={handleTicketPress}
                />
            );

            if (!showActiveHeader && !showPastHeader) {
                return card;
            }

            return (
                <View className="gap-2.5">
                    <TicketSectionHeader
                        title={t(
                            showActiveHeader
                                ? "tickets.historyFilters.active"
                                : "tickets.historyFilters.past",
                        )}
                        count={showActiveHeader ? activeCount : pastCount}
                        isFirst={index === 0}
                    />
                    {card}
                </View>
            );
        },
        [activeCount, filter, handleTicketPress, isLocked, pastCount, t],
    );

    const getTicketHistoryItemType = useCallback(
        (_item: TicketListItemResponse, index: number) => {
            const hasHeader =
                filter === "all" &&
                ((activeCount > 0 && index === 0) ||
                    (pastCount > 0 && index === activeCount));
            return hasHeader ? "header-card" : "card";
        },
        [activeCount, filter, pastCount],
    );

    const filterOptions = [
        { value: "all" as const, label: t("tickets.historyFilters.all") },
        { value: "active" as const, label: t("tickets.historyFilters.active") },
        { value: "past" as const, label: t("tickets.historyFilters.past") },
    ];

    const emptyCopy =
        filter === "active"
            ? {
                  title: t("tickets.emptyActiveHistoryTitle"),
                  message: t("tickets.emptyActiveHistoryMessage"),
              }
            : filter === "past"
              ? {
                    title: t("tickets.emptyPastHistoryTitle"),
                    message: t("tickets.emptyPastHistoryMessage"),
                }
              : {
                    title: t("tickets.emptyHistoryTitle"),
                    message: t("tickets.emptyHistoryMessage"),
                };

    return (
        <Screen scroll={false} bottomPadding={16}>
                <View className="flex-1 gap-3 pt-2">
                    <SegmentedControl
                        options={filterOptions}
                        value={filter}
                        onChange={setFilter}
                    />

                    {isLoading ? (
                        <TicketHistorySkeletonList grouped={filter === "all"} />
                    ) : isError && !data ? (
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
                    ) : displayedTickets.length === 0 && isFetchNextPageError ? (
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
                    ) : displayedTickets.length === 0 && hasNextPage ? (
                        <TicketHistorySkeletonList grouped={filter === "all"} />
                    ) : displayedTickets.length === 0 ? (
                        <StateList
                            refreshing={isPullRefreshing}
                            onRefresh={handlePullRefresh}
                        >
                            <EmptyState
                                title={emptyCopy.title}
                                message={emptyCopy.message}
                                actionLabel={
                                    filter === "all"
                                        ? t("common.refresh")
                                        : t("tickets.showAllTickets")
                                }
                                actionPending={
                                    filter === "all" &&
                                    (isRefetching || isPullRefreshing)
                                }
                                onAction={
                                    filter === "all"
                                        ? handlePullRefresh
                                        : () => setFilter("all")
                                }
                            />
                        </StateList>
                    ) : (
                        <FlashList
                            data={displayedTickets}
                            keyExtractor={ticketHistoryKeyExtractor}
                            getItemType={getTicketHistoryItemType}
                            renderItem={renderTicket}
                            ItemSeparatorComponent={TicketHistorySeparator}
                            contentContainerStyle={TICKET_HISTORY_LIST_CONTENT_STYLE}
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
                                        disabled={
                                            isFetching || isFetchingNextPage
                                        }
                                        busy={isFetchingNextPage}
                                        onRetry={handleFetchNextPage}
                                    />
                                ) : undefined
                            }
                        />
                    )}
                </View>
            </Screen>
    );
}

function TicketSectionHeader({
    title,
    count,
    isFirst = false,
}: {
    title: string;
    count: number;
    isFirst?: boolean;
}) {
    const { t } = useTranslation();

    return (
        <View
            className={
                isFirst
                    ? "flex-row items-baseline justify-between gap-2 px-0.5 pt-1"
                    : "flex-row items-baseline justify-between gap-2 px-0.5 pt-3.5"
            }
        >
            <AppText
                variant="label"
                numberOfLines={1}
                style={{ flex: 1, minWidth: 0 }}
                textStyle={{ fontWeight: "700" }}
            >
                {title}
            </AppText>
            <AppText
                variant="caption"
                color="mutedForeground"
                wrap={false}
                numberOfLines={1}
                textStyle={{ fontVariant: ["tabular-nums"] }}
            >
                {t("tickets.count", { count })}
            </AppText>
        </View>
    );
}

function TicketHistorySkeletonList({ grouped }: { grouped: boolean }) {
    if (!grouped) {
        return (
            <View className="flex-1 gap-3 overflow-hidden pt-1">
                {Array.from({ length: 6 }, (_, index) => (
                    <TicketHistoryCardSkeleton key={index} />
                ))}
            </View>
        );
    }

    return (
        <View className="flex-1 gap-3 overflow-hidden pt-1">
            <View className="gap-2.5">
                <View className="flex-row items-center justify-between px-0.5 pt-1">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-3.5 w-16 rounded-full" />
                </View>
                <TicketHistoryCardSkeleton />
            </View>
            <TicketHistoryCardSkeleton />
            <View className="gap-2.5">
                <View className="flex-row items-center justify-between px-0.5 pt-3.5">
                    <Skeleton className="h-4 w-14 rounded-full" />
                    <Skeleton className="h-3.5 w-16 rounded-full" />
                </View>
                <TicketHistoryCardSkeleton />
            </View>
            <TicketHistoryCardSkeleton />
            <TicketHistoryCardSkeleton />
        </View>
    );
}
