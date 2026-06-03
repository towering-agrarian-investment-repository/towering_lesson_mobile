import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateCard";
import { useTodayMemberReservations } from "@/lib/hook/useReservation";
import { FlatList, StyleSheet, View } from "react-native";
import TitleSectionWithBadge from "./TitleSectionWithBadge";
import TodayReservationCard from "./TodayReservationCard";

function TodayReservation() {

    const { data: todayReservations = [], isLoading: todayReservationsLoading, isError: todayReservationError } = useTodayMemberReservations();

    return (
        <View className="flex-1">
            <TitleSectionWithBadge label="Today's Reservation" length={todayReservations.length} />

            {todayReservationsLoading ? (
                <View
                    className="flex-1 flex-row items-start justify-start"
                    style={style.listContent}
                >
                    {["w-48", "w-56", "w-44"].map((widthClassName, index) => (
                        <Skeleton
                            key={index}
                            className={`h-[54px] ${widthClassName} rounded-full`}
                        />
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
                    contentInsetAdjustmentBehavior="automatic"
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
        alignItems: "flex-start",
    },
});

export default TodayReservation;
