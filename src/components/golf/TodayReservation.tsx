import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateCard";
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
                <View style={style.listContent}>
                    {Array.from({ length: 2 }, (_, index) => (
                        <Skeleton key={index} className="h-28 w-72 rounded-2xl" />
                    ))}
                </View>
            ) : todayReservationError ? (
                <ErrorState
                    title="Failed to load reservations"
                    message="Please pull to refresh and try again."
                />
            ) : todayReservations.length === 0 ? (
                <EmptyState
                    title="No reservations today"
                    message="Today's reservations will appear here."
                />
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
