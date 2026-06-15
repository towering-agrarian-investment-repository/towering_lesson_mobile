import { AppText as Text } from "@/design-system";
import { getMemberReservationDetailQueryOptions } from "@/lib/hook/useReservation";
import { MemberReservationSummaryResponse } from "@/types/member-reservation";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import React, { memo } from "react";
import { Pressable } from "react-native";

type Props = {
    reservation: MemberReservationSummaryResponse;
};

function TodayReservationCard({ reservation }: Props) {
    const queryClient = useQueryClient();

    return (
        <Link
            href={{
                pathname: "/reservation/[id]",
                params: {
                    id: String(reservation.id),
                    type: reservation.reservationType,
                },
            }}
            asChild
        >
            <Pressable
                className="self-start rounded-xl border border-border bg-muted px-5 py-4 active:bg-secondary"
                onPressIn={() => {
                    void queryClient.prefetchQuery(
                        getMemberReservationDetailQueryOptions(
                            reservation.id,
                            reservation.reservationType,
                        ),
                    );
                }}
            >
                <Text
                    variant="label"
                    className="text-center text-base font-semibold text-foreground"
                    numberOfLines={1}
                >
                    {reservation.lessonAvailabilityName ?? "Reservation"}
                </Text>
            </Pressable>
        </Link>
    );
}

export default memo(TodayReservationCard);
