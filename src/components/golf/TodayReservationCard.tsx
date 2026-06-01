import { MemberReservationSummaryResponse } from '@/types/member-reservation'
import { Link } from 'expo-router'
import React from 'react'
import { Pressable, Text } from 'react-native'

type Props = {
    reservation: MemberReservationSummaryResponse
}

function TodayReservationCard({ reservation }: Props) {
    return (
        <Link href={{
            pathname: "/reservation/[id]",
            params: {
                id: String(reservation.id),
            },
        }}
         asChild>
            <Pressable className="rounded-full border border-gray-200 bg-gray-100 px-5 py-4 active:bg-gray-200">
                <Text
                    className="text-center text-base font-semibold text-gray-900"
                    numberOfLines={1}
                >
                    {reservation.lessonAvailabilityName ?? "Reservation"}
                </Text>
            </Pressable>
        </Link>

    )
}

export default TodayReservationCard