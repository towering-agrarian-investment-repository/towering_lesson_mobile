import { AppText } from "@/design-system/components/AppText";
import { AnimatedPressable, CompactEmptyState } from "@/design-system";
import { isBookableTicketType } from "@/design-system/utils/ticket-type";
import { typography } from "@/design-system/utils/typography";
import { prefetchTicketAvailability } from "@/lib/booking/prefetchTicketAvailability";
import { canBookWithTicket } from "@/lib/booking/ticket-eligibility";
import { useDayClock } from "@/lib/hook/useMinuteClock";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
    getMemberTicketByIdQueryOptions,
    getMemberTicketsQueryOptions,
    MY_TICKET_TYPES,
    useMemberTickets,
} from "@/lib/hook/useTicket";
import { showAppToast } from "@/design-system/components/AppToast";
import { MemberTicketSummaryResponse } from "@/types/member-ticket";
import { formatDateForAPI } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import TicketCard, { TicketCardSkeleton } from "./TicketCard";
import TitleSectionWithBadge from "./TitleSectionWithBadge";

function MyTicket() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const dayClock = useDayClock();
    const todayKey = formatDateForAPI(dayClock);
    const { data, isLoading, isError, isFetching, errorUpdateCount, hasNextPage, refetch } = useMemberTickets({
        types: MY_TICKET_TYPES,
    });
    const allTickets = data?.items ?? [];
    const activeTickets = allTickets.filter((ticket) => !ticket.fullyUsed);
    const tickets = activeTickets.slice(0, 3);
    const hasMoreTickets = hasNextPage || activeTickets.length > tickets.length;
    const showInitialLoading = isLoading && errorUpdateCount === 0;
    const showLoadError = !data && (isError || errorUpdateCount > 0);

    const handleTicketPress = useCallback(
        (item: MemberTicketSummaryResponse) => {
            if (item.type === "LESSON_PROGRAM") {
                showAppToast({
                    message: t("tickets.adminEnrollmentMessage"),
                    duration: 5000,
                    type: "info",
                });
                return;
            }

            if (isBookableTicketType(item.type)) {
                if (!canBookWithTicket(item)) return;

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
                return;
            }

            void queryClient.prefetchQuery(getMemberTicketByIdQueryOptions(item.id));
            runWithNavigationLock(() => {
                router.push({
                    pathname: "/tickets/[id]",
                    params: { id: String(item.id) },
                });
            });
        },
        [queryClient, router, runWithNavigationLock, t],
    );

    return (
        <View className="gap-3">
            <View className="flex-row items-center justify-between gap-3">
                <TitleSectionWithBadge
                    label={t("tickets.sectionTitle")}
                    length={`${tickets.length}${hasMoreTickets ? "+" : ""}`}
                />

                <AnimatedPressable
                    accessibilityRole="button"
                    accessibilityLabel={t("tickets.viewAll")}
                    disabled={isLocked}
                    haptic="selection"
                    hitSlop={12}
                    className="justify-center rounded-lg px-2 py-1"
                    onPressIn={() => {
                        if (!isLocked) {
                            void queryClient.prefetchInfiniteQuery(
                                getMemberTicketsQueryOptions({
                                    types: MY_TICKET_TYPES,
                                }),
                            );
                        }
                    }}
                    onPress={() => {
                        runWithNavigationLock(() => {
                            router.push("/tickets");
                        });
                    }}
                >
                    <AppText
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
                    </AppText>
                </AnimatedPressable>
            </View>

            <View className="gap-3">
                {showInitialLoading ? (
                    <View className="flex-row flex-wrap gap-3">
                        {Array.from({ length: 2 }, (_, index) => (
                            <View key={index} style={{ flexBasis: 280, flexGrow: 1 }}>
                                <TicketCardSkeleton />
                            </View>
                        ))}
                    </View>
                ) : showLoadError ? (
                    <View className="min-h-40 items-center justify-center">
                        <CompactEmptyState
                            title={t("tickets.loadError")}
                            tone="danger"
                            actionLabel={isFetching ? t("common.refreshing") : t("common.refreshTryAgain")}
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
                    <View className="flex-row flex-wrap gap-3">
                        {tickets.map((ticket) => (
                            <View key={ticket.id} style={{ flexBasis: 280, flexGrow: 1 }}>
                                <TicketCard
                                    item={ticket}
                                    todayKey={todayKey}
                                    disabled={isLocked}
                                    onPress={handleTicketPress}
                                    fullWidth
                                />
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

export default MyTicket;
