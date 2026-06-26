import { InlineState, Skeleton } from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { getMemberTicketLessonSlotsQueryOptions } from "@/lib/hook/useReservation";
import { useMemberTickets } from "@/lib/hook/useTicket";
import { showAppToast } from "@/lib/toast/toast";
import { MemberSelfResponse } from "@/types/member.type";
import { TicketListItemResponse } from "@/types/member-ticket";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, ScrollView, StyleSheet, View } from "react-native";
import TicketCard from "./TicketCard";
import TitleSectionWithBadge from "./TitleSectionWithBadge";

type Props = {
    member: MemberSelfResponse
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

            if (
                item.type === "PRIVATE_LESSON" ||
                item.type === "GROUP_LESSON"
            ) {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth() + 1;

                void queryClient.prefetchQuery(
                    getMemberTicketLessonSlotsQueryOptions(item.id, year, month),
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

    return (
        <View className="gap-4">
            <TitleSectionWithBadge
                label={t("tickets.sectionTitle")}
                length={tickets.length}
            />

            {isLoading ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={style.listContent}
                >
                    {Array.from({ length: 3 }, (_, index) => (
                        <Skeleton key={index} className="h-40 w-60 rounded-xl" />
                    ))}
                </ScrollView>
            ) : isError ? (
                <InlineState
                    title={t("tickets.loadError")}
                    tone="danger"
                />
            ) : tickets.length === 0 ? (
                <InlineState
                    title={t("tickets.empty")}
                />
            ) : (
                <FlatList
                    data={tickets}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentInsetAdjustmentBehavior="automatic"
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={style.listContent}
                    renderItem={({ item }) => (
                        <TicketCard
                            item={item}
                            disabled={isLocked}
                            onPress={handleTicketPress}
                        />
                    )}
                />
            )}
        </View>
    );
}

const style = StyleSheet.create({
    listContent: {
        gap: 12,
        paddingVertical: 12,
    },
});

export default MyTicket;
