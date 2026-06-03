import { AppText as Text } from "@/design-system";
import { MemberReservationSummaryResponse } from "@/types/member-reservation";
import { Link } from "expo-router";
import React from "react";
import { Pressable } from "react-native";

type Props = {
    reservation: MemberReservationSummaryResponse;
};

function TodayReservationCard({ reservation }: Props) {
    return (
        <Link
            href={{
                pathname: "/reservation/[id]",
                params: {
                    id: String(reservation.id),
                },
            }}
            asChild
        >
            <Pressable className="self-start rounded-full border border-border bg-muted px-5 py-4 active:bg-secondary">
                <Text
                    className="text-center text-base font-semibold text-foreground"
                    numberOfLines={1}
                >
                    {reservation.lessonAvailabilityName ?? "Reservation"}
                </Text>
            </Pressable>
        </Link>
    );
}

export default TodayReservationCard;
