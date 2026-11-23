import { AnimatedPressable, CompactEmptyState } from "@/design-system";
import { NativeText } from "@/design-system/components/NativeText";
import { typography } from "@/design-system/utils/typography";
import { prefetchTicketAvailability } from "@/lib/booking/prefetchTicketAvailability";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
    getMemberTicketByIdQueryOptions,
    getMemberTicketsQueryOptions,
    MY_TICKET_TYPES,
    useMemberTickets,
} from "@/lib/hook/useTicket";
import { TicketListItemResponse } from "@/types/member-ticket";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import TicketHistoryCard, {
    TicketHistoryCardSkeleton,
} from "./TicketHistoryCard";
import TitleSectionWithBadge from "./TitleSectionWithBadge";

function MyTicket() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const {
        data,
        isLoading,
        isError,
        isFetching,
        errorUpdateCount,
        hasNextPage,
        refetch,
    } = useMemberTickets({ types: MY_TICKET_TYPES });
    const allTickets = data?.items ?? [];
    const activeTickets = allTickets.filter((ticket) => !ticket.fullyUsed);
    const tickets = activeTickets.slice(0, 3);
    const showInitialLoading = isLoading && errorUpdateCount === 0;
    const showLoadError = !data && (isError || errorUpdateCount > 0);

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

    return (
        <View className="gap-2">
            <View className="flex-row items-center justify-between gap-3">
                <TitleSectionWithBadge
                    label={t("tickets.sectionTitle")}
                    length={`${activeTickets.length}${hasNextPage ? "+" : ""}`}
                />

                {activeTickets.length > 1 ||
                hasNextPage ||
                allTickets.length > activeTickets.length ? (
                    <AnimatedPressable
                        accessibilityRole="button"
                        accessibilityLabel={t("tickets.viewAll")}
                        disabled={isLocked}
                        haptic="selection"
                        style={{ minHeight: 48 }}
                        className="justify-center rounded-lg px-2"
                        onPressIn={() => {
                            if (!isLocked) {
                                void queryClient.prefetchInfiniteQuery(
                                    getMemberTicketsQueryOptions({ types: MY_TICKET_TYPES }),
                                );
                            }
                        }}
                        onPress={() => {
                            runWithNavigationLock(() => {
                                router.push("/tickets");
                            });
                        }}
                    >
                        <NativeText
                            variant="label"
                            color="primary"
                            wrap={false}
                            textStyle={{
                                lineHeight: typography.subtext.lineHeight,
                                fontSize: typography.subtext.fontSize,
                                fontWeight: "600" as const,
                            }}
                        >
                            {t("tickets.viewAll")}
                        </NativeText>
                    </AnimatedPressable>
                ) : null}
            </View>

            <View className="gap-3 py-3">
                {showInitialLoading ? (
                    <View className="gap-3">
                        {Array.from({ length: 2 }, (_, index) => (
                            <TicketHistoryCardSkeleton key={index} />
                        ))}
                    </View>
                ) : showLoadError ? (
                    <View className="min-h-40 items-center justify-center">
                        <CompactEmptyState
                            title={t("tickets.loadError")}
                            tone="danger"
                            actionLabel={
                                isFetching
                                    ? t("common.refreshing")
                                    : t("common.refreshTryAgain")
                            }
                            actionPending={isFetching}
                            onAction={() => {
                                void refetch();
                            }}
                        />
                    </View>
                ) : tickets.length === 0 ? (
                    <View className="min-h-40 items-center justify-center">
                        <CompactEmptyState title={t("tickets.empty")} />
                    </View>
                ) : (
                    <View className="gap-3">
                        {tickets.map((ticket) => (
                            <TicketHistoryCard
                                key={ticket.id}
                                item={ticket}
                                showBookAction
                                disabled={isLocked}
                                onPress={handleTicketPress}
                                onBookPress={handleBookPress}
                            />
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

export default MyTicket;
