import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import TicketCard from "@/components/golf/TicketCard";
import { EmptyState, ErrorState, Skeleton } from "@/design-system";
import { prefetchTicketAvailability } from "@/lib/booking/prefetchTicketAvailability";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { useMemberTickets } from "@/lib/hook/useTicket";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { showAppToast } from "@/lib/toast/toast";
import type { TicketListItemResponse } from "@/types/member-ticket";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, View } from "react-native";

export const TICKET_TABS = ["all", "bay", "lesson"] as const;
export type TicketTabType = (typeof TICKET_TABS)[number];

type TicketTabSceneProps = {
    type: TicketTabType;
};

function TicketTabSceneContent({ type }: TicketTabSceneProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const { data: memberResponse, isLoading: isLoadingMember, isError: isMemberError, refetch: refetchMember, isRefetching: isRefetchingMember } =
        useGetMemberProfile();
    const member = memberResponse?.data;
    const { data, isLoading, isError, refetch, isRefetching } =
        useMemberTickets(member?.id);
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => member
            ? refetch({ cancelRefetch: false })
            : refetchMember({ cancelRefetch: false }));
    const filteredTickets = useMemo(() => {
        const tickets = data?.data ?? [];

        if (type === "all") {
            return tickets;
        }

        return tickets.filter((ticket) =>
            type === "bay"
                ? ticket.type === "BAY_USAGE"
                : ticket.type !== "BAY_USAGE",
        );
    }, [data?.data, type]);

    const handleTicketPress = useCallback(
        (item: TicketListItemResponse) => {
            if (item.type === "LESSON_PROGRAM") {
                showAppToast({
                    message: t("common.notAvailable"),
                    type: "info",
                });
                return;
            }

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
        [queryClient, router, runWithNavigationLock, t],
    );

    const loading = isLoadingMember || isLoading;

    if (loading) {
        return (
            <View className="flex-1 gap-3 pt-5">
                {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton key={index} className="h-40 w-full rounded-xl" />
                ))}
            </View>
        );
    }

    if ((isError && !data) || (isMemberError && !member)) {
        return (
            <TicketStateList
                refreshing={isPullRefreshing}
                onRefresh={handlePullRefresh}
            >
                <ErrorState
                    title={t("tickets.loadError")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={
                        isRefetching || isRefetchingMember
                            ? t("common.refreshing")
                            : t("common.refreshTryAgain")
                    }
                    actionPending={isRefetching || isRefetchingMember || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </TicketStateList>
        );
    }

    if (filteredTickets.length === 0) {
        return (
            <TicketStateList
                refreshing={isPullRefreshing}
                onRefresh={handlePullRefresh}
            >
                <EmptyState
                    title={t("tickets.empty")}
                    actionLabel={t("common.refresh")}
                    actionPending={isRefetching || isRefetchingMember || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </TicketStateList>
        );
    }

    return (
        <FlatList
            className="flex-1"
            data={filteredTickets}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
                <TicketCard
                    item={item}
                    fullWidth
                    disabled={isLocked}
                    onPress={handleTicketPress}
                />
            )}
            decelerationRate="normal"
            nestedScrollEnabled
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerStyle={{
                paddingTop: 20,
                paddingBottom: 40,
            }}
            refreshControl={
                <RefreshControl
                    refreshing={isPullRefreshing}
                    onRefresh={handlePullRefresh}
                />
            }
            showsVerticalScrollIndicator={false}
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={7}
        />
    );
}

export const TicketTabScene = memo(TicketTabSceneContent);

function TicketStateList({
    children,
    refreshing,
    onRefresh,
}: {
    children: React.ReactElement;
    refreshing: boolean;
    onRefresh: () => void;
}) {
    return (
        <FlatList
            className="flex-1"
            data={[]}
            renderItem={() => null}
            contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
            }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={children}
            showsVerticalScrollIndicator={false}
        />
    );
}
