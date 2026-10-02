import { Divider, InlineState, Skeleton } from "@/design-system";
import { useTodayMemberReservations } from "@/lib/hook/useReservation";
import { Fragment } from "react";
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
                <View className="py-3">
                    <View className="overflow-hidden rounded-xl border border-border bg-card">
                        {[0, 1, 2].map((index) => (
                            <Fragment key={index}>
                                {index > 0 ? <Divider /> : null}
                                <View className="px-4 py-3">
                                    <Skeleton className="h-12 w-full rounded-lg" />
                                </View>
                            </Fragment>
                        ))}
                    </View>
                </View>
            ) : todayReservationError ? (
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
                <View className="py-3">
                    <View className="overflow-hidden rounded-xl border border-border bg-card">
                        {todayReservations.map((reservation, index) => (
                            <Fragment key={`${reservation.reservationType}:${reservation.id}`}>
                                {index > 0 ? <Divider /> : null}
                                <TodayReservationCard reservation={reservation} />
                            </Fragment>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

export default TodayReservation;
