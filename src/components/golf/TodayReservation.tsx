import { CompactEmptyState } from "@/design-system";
import { useTodayMemberReservations } from "@/lib/hook/useReservation";
import { useIsFocused } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ReservationCardSkeleton } from "./ReservationCard";
import TitleSectionWithBadge from "./TitleSectionWithBadge";
import TodayReservationCard from "./TodayReservationCard";

function TodayReservation() {
    const { t } = useTranslation();
    const isFocused = useIsFocused();

    const {
        data,
        isLoading: todayReservationsLoading,
        isError: todayReservationError,
        isFetching,
        errorUpdateCount,
        refetch,
    } = useTodayMemberReservations();
    const todayReservations = data ?? [];
    const showInitialLoading = todayReservationsLoading && errorUpdateCount === 0;
    const showLoadError = !data && (todayReservationError || errorUpdateCount > 0);

    return (
        <View className="gap-3">
            <TitleSectionWithBadge label={t("reservations.todayTitle")} length={todayReservations.length} />

            {showInitialLoading ? (
                <View className="gap-3">
                    <ReservationCardSkeleton />
                    <ReservationCardSkeleton />
                </View>
            ) : showLoadError ? (
                <View className="min-h-40 items-center justify-center">
                    <CompactEmptyState
                        title={t("reservations.loadError")}
                        tone="danger"
                        actionLabel={isFetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                        actionPending={isFetching}
                        onAction={() => {
                            void refetch();
                        }}
                    />
                </View>
            ) : todayReservations.length === 0 ? (
                <View className="min-h-40 items-center justify-center">
                    <CompactEmptyState title={t("reservations.empty")} />
                </View>
            ) : (
                <View className="gap-3">
                    {todayReservations.map((reservation) => (
                        <TodayReservationCard
                            key={`${reservation.reservationType}:${reservation.id}`}
                            reservation={reservation}
                            animate={isFocused}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

export default TodayReservation;
