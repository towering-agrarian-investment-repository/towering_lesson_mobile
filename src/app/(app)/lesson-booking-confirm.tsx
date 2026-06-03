import {
    ReservationDetailField,
    ReservationPoliciesSection,
} from "@/components/golf/reservation/ReservationSections";
import { Screen } from "@/components/ui/Screen";
import { Button, Divider } from "@/design-system";
import { useCreateMemberLessonReservation } from "@/lib/hook/useReservation";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    View
} from "react-native";

const POLICIES = [
    {
        title: "Cancellation Policy",
        description:
            "Lesson reservations can only be cancelled up to 3 hours before the reservation time.",
    },
    {
        title: "No-show Policy",
        description: "A no-show will result in one lesson ticket deduction.",
    },
] as const;

export default function LessonBookingConfirmScreen() {
    const {
        date,
        ticketId,
        lessonAvailabilityId,
        lessonName,
        coachName,
        startTime,
        endTime,
    } = useLocalSearchParams<{
        date: string;
        ticketId?: string;
        lessonAvailabilityId?: string;
        lessonName?: string;
        coachName?: string;
        startTime?: string;
        endTime?: string;
    }>();
    const router = useRouter();
    const {
        mutateAsync: createReservation,
        isPending: isSubmitting,
    } = useCreateMemberLessonReservation();

    const handleConfirm = async () => {
        if (!ticketId || !lessonAvailabilityId) {
            return;
        }

        const response = await createReservation({
            ticketId: Number(ticketId),
            lessonAvailabilityId: Number(lessonAvailabilityId),
        });

        const reservation = response.data;

        if (reservation) {
            router.replace({
                pathname: "/reservation/[id]",
                params: {
                    id: String(reservation.id),
                    type: reservation.reservationType,
                },
            });
            return;
        }

        router.replace("/reservation");
    };

    const reservationName = lessonName ?? "Private Lesson";
    const dateValue = formatDateValue(date, "yyyy. MM. dd");
    const timeValue = formatTimeRange(startTime, endTime);

    return (
        <Screen
            contentClassName="flex-1"
            footer={
                <Animated.View
                    entering={FadeInDown.delay(120).duration(220)}
                    className="border-t border-border bg-background px-6 pb-8 pt-4"
                >
                    <Button
                        title="Agree & Book"
                        loading={isSubmitting}
                        disabled={isSubmitting || !ticketId || !lessonAvailabilityId}
                        onPress={handleConfirm}
                    />
                </Animated.View>
            }
        >
            <Animated.View entering={FadeInDown.duration(220)} className="grow">
                <View className="gap-4">
                    <ReservationDetailField
                        label="Reservation Name"
                        value={reservationName}
                    />
                    <Divider className="bg-border" />

                    <ReservationDetailField label="Date" value={dateValue} />
                    <Divider className="bg-border" />

                    <ReservationDetailField label="Time" value={timeValue} />

                    {coachName ? (
                        <>
                            <Divider className="bg-border" />
                            <ReservationDetailField label="Coach" value={coachName} />
                        </>
                    ) : null}
                </View>

                <View className="mt-6 gap-4">
                    <Divider className="bg-border" />
                    <ReservationPoliciesSection policies={POLICIES} />
                </View>
            </Animated.View>
        </Screen>
    );
}
