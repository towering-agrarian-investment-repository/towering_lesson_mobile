import { AppText, InlineState, Skeleton } from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { prefetchTicketAvailability } from "@/lib/booking/prefetchTicketAvailability";
import {
    getMemberTicketsQueryOptions,
    useMemberTickets,
} from "@/lib/hook/useTicket";
import { showAppToast } from "@/lib/toast/toast";
import { MemberSelfResponse } from "@/types/member.type";
import { TicketListItemResponse } from "@/types/member-ticket";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import TicketCard from "./TicketCard";
import TitleSectionWithBadge from "./TitleSectionWithBadge";

type Props = {
    member: MemberSelfResponse;
};

function MyTicket({ member }: Props) {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const { data, isLoading, isError } = useMemberTickets(member.id);
    const tickets = data?.data ?? [];

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

    return (
        <View className="gap-2">
            <View className="flex-row items-center justify-between gap-3">
                <TitleSectionWithBadge
                    label={t("tickets.sectionTitle")}
                    length={tickets.length}
                />

                {tickets.length > 1 ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t("tickets.viewAll")}
                        disabled={isLocked}
                        className="rounded-lg px-1 py-2 active:opacity-70"
                        onPressIn={() => {
                            if (!isLocked) {
                                void queryClient.prefetchQuery(
                                    getMemberTicketsQueryOptions(member.id),
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
                            className="text-sm font-semibold text-primary"
                        >
                            {t("tickets.viewAll")}
                        </AppText>
                    </Pressable>
                ) : null}
            </View>

            <View className="gap-3 py-3">
                {isLoading ? (
                    <View className="gap-3">
                        {Array.from({ length: 3 }, (_, index) => (
                            <Skeleton key={index} className="h-40 w-full rounded-xl" />
                        ))}
                    </View>
                ) : isError ? (
                    <InlineState
                        title={t("tickets.loadError")}
                        tone="danger"
                    />
                ) : tickets.length === 0 ? (
                    <View className="h-40 items-center justify-center">
                        <InlineState title={t("tickets.empty")} />
                    </View>
                ) : (
                    <View className="gap-3">
                        {tickets.map((ticket) => (
                            <TicketCard
                                key={ticket.id}
                                item={ticket}
                                disabled={isLocked}
                                onPress={handleTicketPress}
                                fullWidth
                            />
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

export default MyTicket;
