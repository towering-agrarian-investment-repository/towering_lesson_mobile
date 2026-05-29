import { useMemberTickets } from "@/lib/hook/useTicket";
import { MemberResponse } from "@/types/member.type";
import { FlatList, StyleSheet, Text, View } from "react-native";
import TicketCard from "./TicketCard";
import TitleSectionWithBadge from "./TitleSectionWithBadge";

type Props = {
    member: MemberResponse
};

function MyTicket({ member }: Props) {

    const { data, isLoading, isError } = useMemberTickets(member.id);
    const tickets = data?.data ?? [];
    return (
        <View>
            <TitleSectionWithBadge label="My Tickets" length={tickets.length} />

            {isLoading ? (
                <View>
                    <Text>Loading....</Text>
                </View>
            ) : isError ? (
                <View>
                    <Text>Failed to load tickets</Text>
                </View>
            ) : (
                <FlatList
                    data={tickets}
                    horizontal
                    showsHorizontalScrollIndicator={false}
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
        paddingVertical: 10,
    },
});

export default MyTicket;