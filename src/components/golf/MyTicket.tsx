import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateCard";
import { useMemberTickets } from "@/lib/hook/useTicket";
import { MemberResponse } from "@/types/member.type";
import { FlatList, ScrollView, StyleSheet, View } from "react-native";
import TicketCard from "./TicketCard";
import TitleSectionWithBadge from "./TitleSectionWithBadge";

type Props = {
    member: MemberResponse
};

function MyTicket({ member }: Props) {

    const { data, isLoading, isError } = useMemberTickets(member.id);
    const tickets = data?.data ?? [];
    return (
        <View className="gap-4">
            <TitleSectionWithBadge label="My Tickets" length={tickets.length} />

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
                <ErrorState
                    title="Failed to load tickets"
                    message="Please pull to refresh and try again."
                />
            ) : tickets.length === 0 ? (
                <EmptyState
                    title="No tickets found"
                    message="Your active tickets will appear here."
                />
            ) : (
                <FlatList
                    data={tickets}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentInsetAdjustmentBehavior="automatic"
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={style.listContent}
                    renderItem={({ item }) => <TicketCard item={item} />}
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
