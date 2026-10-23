import { InlineState, Skeleton } from "@/design-system";
import { useTodayMemberReservations } from "@/lib/hook/useReservation";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import TitleSectionWithBadge from "./TitleSectionWithBadge";
import TodayReservationCard from "./TodayReservationCard";

function TodayReservation() {
    const { t } = useTranslation();

    const { data: todayReservations = [], isLoading: todayReservationsLoading, isError: todayReservationError } = useTodayMemberReservations();

    return (
        <View className="gap-2">
            <TitleSectionWithBadge
                label={t("reservations.todayTitle")}
                length={todayReservations.length}
            />

            {todayReservationsLoading ? (
                <View className="gap-3 py-3">
                    {[0, 1, 2].map((index) => (
                        <View key={index} className="min-h-16 flex-row items-center gap-3 rounded-xl bg-card px-2 py-2">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <View className="min-w-0 flex-1 gap-2">
                                <Skeleton className="h-4 w-28 rounded-full" />
                                <Skeleton className="h-3 w-40 rounded-full" />
                            </View>
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </View>
                    ))}
                </View>
            ) : todayReservationError && todayReservations.length === 0 ? (
                <View className="justify-center">
                    <InlineState
                        title={t("reservations.loadError")}
                        tone="danger"
                    />
                </View>
            ) : todayReservations.length === 0 ? (
                <View className="min-h-40 justify-center py-3">
                    <InlineState
                        title={t("reservations.empty")}
                    />
                </View>
            ) : (
                <View className="gap-3 py-3">
                    {todayReservations.map((reservation) => (
                        <TodayReservationCard key={`${reservation.reservationType}:${reservation.id}`}
                            reservation={reservation} />
                    ))}
                </View>
            )}
        </View>
    );
}

export default TodayReservation;
