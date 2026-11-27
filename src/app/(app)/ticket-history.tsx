import TicketHistoryCard, { TicketHistoryCardSkeleton } from "@/components/golf/TicketHistoryCard";
import {
    AppText,
    EmptyState,
    ErrorState,
    ListRetryFooter,
    Screen,
    Skeleton,
    StateList,
    SwipeableTabBar,
    type SwipeableTabRoute,
    triggerSelectionHaptic,
} from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { getMemberTicketByIdQueryOptions, useMemberTickets } from "@/lib/hook/useTicket";
import type { MemberTicketSummaryResponse } from "@/types/member-ticket";
import { getTicketStatusGroup } from "@/utils/status-tone";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { TabView, type TabBarProps } from "react-native-tab-view";

const TICKET_HISTORY_TABS = ["all", "active", "past"] as const;
type TicketHistoryFilter = (typeof TICKET_HISTORY_TABS)[number];

const ALL_TICKET_STATUSES: readonly string[] = [];
const ACTIVE_TICKET_STATUSES: readonly string[] = ["ACTIVE", "IN_USE"];
const TICKET_HISTORY_GROUP_TITLES = {
    active: "tickets.historyFilters.active",
    past: "tickets.historyFilters.past",
    other: "tickets.types.other",
} as const;
type TicketHistoryGroup = keyof typeof TICKET_HISTORY_GROUP_TITLES;
type TicketItemEntry = { type: "item"; ticket: MemberTicketSummaryResponse };
type TicketHistoryEntry =
    { type: "header"; group: TicketHistoryGroup; count: number; isFirst: boolean } | TicketItemEntry;

const ticketItemEntries = new WeakMap<MemberTicketSummaryResponse, TicketItemEntry>();
const ticketHistoryKeyExtractor = (entry: TicketHistoryEntry) =>
    entry.type === "header" ? `group:${entry.group}` : String(entry.ticket.id);
const getTicketHistoryItemType = (entry: TicketHistoryEntry) => entry.type;
const TICKET_HISTORY_LIST_CONTENT_STYLE = {
    paddingTop: 12,
    paddingBottom: 40,
} as const;

function TicketHistorySeparator({ leadingItem }: { leadingItem: TicketHistoryEntry }) {
    if (leadingItem.type === "header") return null;
    return <View className="h-3" />;
}

export default function TicketHistoryScreen() {
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const [activeIndex, setActiveIndex] = useState(0);

    const routes = useMemo<SwipeableTabRoute[]>(
        () =>
            TICKET_HISTORY_TABS.map((key) => {
                const title = t(`tickets.historyFilters.${key}`);
                return {
                    key,
                    title,
                    accessibilityLabel: t("tickets.showTabAccessibility", {
                        label: title,
                    }),
                };
            }),
        [t],
    );

    const handleTabChange = useCallback(
        (nextIndex: number) => {
            if (nextIndex === activeIndex) {
                return;
            }
            triggerSelectionHaptic();
            setActiveIndex(nextIndex);
        },
        [activeIndex],
    );

    const handleShowAll = useCallback(() => {
        handleTabChange(0);
    }, [handleTabChange]);

    const renderScene = useCallback(
        ({ route }: { route: { key: string } }) => (
            <TicketHistoryTabScene
                filter={route.key as TicketHistoryFilter}
                isActive={route.key === TICKET_HISTORY_TABS[activeIndex]}
                onShowAll={handleShowAll}
            />
        ),
        [activeIndex, handleShowAll],
    );

    const renderTabBar = useCallback(
        (props: TabBarProps<SwipeableTabRoute>) => <SwipeableTabBar {...props} onTabPress={handleTabChange} />,
        [handleTabChange],
    );

    return (
        <Screen scroll={false} bottomPadding={16}>
            <TabView
                animationEnabled={!reducedMotion}
                navigationState={{ index: activeIndex, routes }}
                onIndexChange={handleTabChange}
                renderScene={renderScene}
                renderTabBar={renderTabBar}
                lazy
                style={{ flex: 1 }}
            />
        </Screen>
    );
}

const TicketHistoryTabScene = memo(function TicketHistoryTabScene({
    filter,
    isActive,
    onShowAll,
}: {
    filter: TicketHistoryFilter;
    isActive: boolean;
    onShowAll: () => void;
}) {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();

    const queryStatuses = filter === "active" ? ACTIVE_TICKET_STATUSES : ALL_TICKET_STATUSES;

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

    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        refetch({ cancelRefetch: false }),
    );

    const entries = useMemo(() => {
        const groups: Record<TicketHistoryGroup, TicketItemEntry[]> = {
            active: [],
            past: [],
            other: [],
        };
        for (const ticket of data?.items ?? []) {
            const group = getTicketStatusGroup(ticket.status, ticket.fullyUsed);
            if (filter !== "all" && group !== filter) continue;
            let entry = ticketItemEntries.get(ticket);
            if (!entry) {
                entry = { type: "item", ticket };
                ticketItemEntries.set(ticket, entry);
            }
            groups[group].push(entry);
        }

        if (filter !== "all") {
            return groups[filter];
        }

        const entries: TicketHistoryEntry[] = [];
        for (const group of ["active", "past", "other"] as const) {
            const tickets = groups[group];
            if (tickets.length === 0) continue;

            entries.push({
                type: "header",
                group,
                count: tickets.length,
                isFirst: entries.length === 0,
            });
            entries.push(...tickets);
        }
        return entries;
    }, [data?.items, filter]);

    const handleFetchNextPage = useCallback(() => {
        if (hasNextPage && !isFetching) {
            void fetchNextPage({ cancelRefetch: false });
        }
    }, [fetchNextPage, hasNextPage, isFetching]);

    const handleEndReached = useCallback(() => {
        if (!isFetchNextPageError && isActive) {
            handleFetchNextPage();
        }
    }, [handleFetchNextPage, isActive, isFetchNextPageError]);

    useEffect(() => {
        if (isActive && filter !== "all" && entries.length === 0 && hasNextPage && !isFetchNextPageError) {
            handleFetchNextPage();
        }
    }, [isActive, filter, entries.length, handleFetchNextPage, hasNextPage, isFetchNextPageError]);

    const handleTicketPress = useCallback(
        (item: MemberTicketSummaryResponse) => {
            void queryClient.prefetchQuery(getMemberTicketByIdQueryOptions(item.id));
            runWithNavigationLock(() => {
                router.push({
                    pathname: "/tickets/[id]",
                    params: { id: String(item.id) },
                });
            });
        },
        [queryClient, router, runWithNavigationLock],
    );

    const renderTicket: ListRenderItem<TicketHistoryEntry> = useCallback(
        ({ item }) =>
            item.type === "header" ? (
                <TicketSectionHeader group={item.group} count={item.count} isFirst={item.isFirst} />
            ) : (
                <TicketHistoryCard item={item.ticket} disabled={isLocked} onPress={handleTicketPress} />
            ),
        [handleTicketPress, isLocked],
    );

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

    if (isLoading) {
        return <TicketHistorySkeletonList grouped={filter === "all"} />;
    }

    if (isError && !data) {
        return (
            <StateList refreshing={isPullRefreshing} onRefresh={handlePullRefresh}>
                <ErrorState
                    title={t("tickets.loadError")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </StateList>
        );
    }

    if (entries.length === 0 && isFetchNextPageError) {
        return (
            <StateList refreshing={isPullRefreshing} onRefresh={handlePullRefresh}>
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

    if (entries.length === 0 && hasNextPage) {
        return <TicketHistorySkeletonList grouped={filter === "all"} />;
    }

    if (entries.length === 0) {
        return (
            <StateList refreshing={isPullRefreshing} onRefresh={handlePullRefresh}>
                <EmptyState
                    title={emptyCopy.title}
                    message={emptyCopy.message}
                    actionLabel={filter === "all" ? t("common.refresh") : t("tickets.showAllTickets")}
                    actionPending={filter === "all" && (isRefetching || isPullRefreshing)}
                    onAction={filter === "all" ? handlePullRefresh : onShowAll}
                />
            </StateList>
        );
    }

    return (
        <FlashList
            data={entries}
            extraData={isLocked}
            keyExtractor={ticketHistoryKeyExtractor}
            getItemType={getTicketHistoryItemType}
            renderItem={renderTicket}
            ItemSeparatorComponent={TicketHistorySeparator}
            contentContainerStyle={TICKET_HISTORY_LIST_CONTENT_STYLE}
            refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
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
});

function TicketSectionHeader({
    group,
    count,
    isFirst,
}: {
    group: TicketHistoryGroup;
    count: number;
    isFirst: boolean;
}) {
    const { t } = useTranslation();

    return (
        <View
            className={
                isFirst
                    ? "flex-row items-baseline justify-between gap-2 px-0.5 pb-2.5 pt-1"
                    : "flex-row items-baseline justify-between gap-2 px-0.5 pb-2.5 pt-3.5"
            }
        >
            <AppText
                variant="label"
                numberOfLines={1}
                style={{ flex: 1, minWidth: 0 }}
                textStyle={{ fontWeight: "700" }}
            >
                {t(TICKET_HISTORY_GROUP_TITLES[group])}
            </AppText>
            <AppText variant="caption" color="mutedForeground" wrap={false} numberOfLines={1} tabular>
                {t("tickets.count", { count })}
            </AppText>
        </View>
    );
}

function TicketHistorySkeletonList({ grouped }: { grouped: boolean }) {
    if (!grouped) {
        return (
            <View className="flex-1 gap-3 overflow-hidden pt-3">
                {Array.from({ length: 6 }, (_, index) => (
                    <TicketHistoryCardSkeleton key={index} />
                ))}
            </View>
        );
    }

    return (
        <View className="flex-1 gap-3 overflow-hidden pt-3">
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
