import { useTodayMemberReservations } from "@/lib/hook/useReservation";
import { FlatList, StyleSheet, Text, View } from "react-native";
import TitleSectionWithBadge from "./TitleSectionWithBadge";
import TodayReservationCard from "./TodayReservationCard";

function TodayReservation() {

    const { data: todayReservations = [], isLoading: todayReservationsLoading, isError: todayReservationError } = useTodayMemberReservations();

    return (
        <View>
            <TitleSectionWithBadge label="Today's Reservation" length={todayReservations.length} />

            {todayReservationsLoading ? (
                <View>
                    <Text>Loading....</Text>
                </View>
            ) : todayReservationError ? (
                <View>
                    <Text>Failed to load tickets</Text>
                </View>
            ) : (
                <FlatList
                    data={todayReservations}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={style.listContent}
                    renderItem={({ item }) => (
                        <TodayReservationCard reservation={item} />
                    )} />
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

export default TodayReservation;