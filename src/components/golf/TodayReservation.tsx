import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateCard";
import { useTodayMemberReservations } from "@/lib/hook/useReservation";
import { FlatList, StyleSheet, Text, View } from "react-native";
import TitleSectionWithBadge from "./TitleSectionWithBadge";
import TodayReservationCard from "./TodayReservationCard";

function TodayReservation() {

    const { data: todayReservations = [], isLoading: todayReservationsLoading, isError: todayReservationError } = useTodayMemberReservations();

    return (
        <View className="flex-1">
            <TitleSectionWithBadge label="Today's Reservation" length={todayReservations.length} />

            {todayReservationsLoading ? (
                <View className="flex-1 justify-center" style={style.listContent}>
                    {Array.from({ length: 2 }, (_, index) => (
                        <Skeleton key={index} className="h-28 w-72 rounded-2xl" />
                    ))}
                </View>
            ) : todayReservationError ? (
                <View className="flex-1 justify-center">
                    <ErrorState
                        title="Failed to load reservations"
                        message="Please pull to refresh and try again."
                    />
                </View>
            ) : todayReservations.length === 0 ? (
                <View className="flex-1 justify-center">
                    <EmptyState
                        title="No reservations today"
                        message="Today's reservations will appear here."
                    />
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
