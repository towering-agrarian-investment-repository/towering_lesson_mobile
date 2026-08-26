import TicketCard from "@/components/golf/TicketCard";
import { EmptyState, ErrorState, Skeleton } from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { getMemberTicketLessonSlotsQueryOptions } from "@/lib/hook/useReservation";
import { useMemberTickets } from "@/lib/hook/useTicket";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { showAppToast } from "@/lib/toast/toast";
import type { TicketListItemResponse } from "@/types/member-ticket";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, View } from "react-native";

export const TICKET_TABS = ["all", "bay", "lesson"] as const;
export type TicketTabType = (typeof TICKET_TABS)[number];

type TicketTabSceneProps = {
    type: TicketTabType;
};

export function TicketTabScene({ type }: TicketTabSceneProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const { data: memberResponse, isLoading: isLoadingMember } =
        useGetMemberProfile();
    const member = memberResponse?.data;
    const { data, isLoading, isError, refetch, isRefetching } =
        useMemberTickets(member?.id);
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

            if (item.type === "PRIVATE_LESSON" || item.type === "GROUP_LESSON") {
                const today = new Date();

                void queryClient.prefetchQuery(
                    getMemberTicketLessonSlotsQueryOptions(
                        item.id,
                        today.getFullYear(),
                        today.getMonth() + 1,
                    ),
                );
            }

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

    if (isError) {
        return (
            <TicketStateList
                refreshing={isRefetching}
                onRefresh={() => {
                    void refetch();
                }}
            >
                <ErrorState
                    title={t("tickets.loadError")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={
                        isRefetching
                            ? t("common.refreshing")
                            : t("common.refreshTryAgain")
                    }
                    onAction={() => {
                        void refetch();
                    }}
                />
            </TicketStateList>
        );
    }

    if (filteredTickets.length === 0) {
        return (
            <TicketStateList
                refreshing={isRefetching}
                onRefresh={() => {
                    void refetch();
                }}
            >
                <EmptyState
                    title={t("tickets.empty")}
                    message={t("tickets.empty")}
                    actionLabel={t("common.refresh")}
                    onAction={() => {
                        void refetch();
                    }}
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
            ItemSeparatorComponent={() => <View className="h-3" />}
            contentContainerStyle={{
                paddingTop: 20,
                paddingBottom: 40,
            }}
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={() => {
                        void refetch();
                    }}
                />
            }
            showsVerticalScrollIndicator={false}
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={7}
        />
    );
}

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
            renderItem={null}
            contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                paddingBottom: 40,
            }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={children}
            showsVerticalScrollIndicator={false}
        />
    );
}
