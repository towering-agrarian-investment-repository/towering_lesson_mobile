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
                <View className="flex-row flex-wrap items-start gap-3 py-3">
                    {["w-48", "w-56", "w-44"].map((widthClassName, index) => (
                        <Skeleton
                            key={index}
                            className={`h-[54px] ${widthClassName} rounded-full`}
                        />
                    ))}
                </View>
            ) : todayReservationError ? (
                <View className="justify-center">
                    <InlineState
                        title={t("reservations.loadError")}
                        tone="danger"
                    />
                </View>
            ) : todayReservations.length === 0 ? (
                <View className="justify-center">
                    <InlineState
                        title={t("reservations.empty")}
                    />
                </View>
            ) : (
                <View className="flex-row flex-wrap items-start gap-3 py-3">
                    {todayReservations.map((reservation) => (
                        <TodayReservationCard
                            key={`${reservation.reservationType}:${reservation.id}`}
                            reservation={reservation}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

export default TodayReservation;
