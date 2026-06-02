import {
    ReservationDetailField,
    ReservationPoliciesSection,
} from "@/components/golf/reservation/ReservationSections";
import { CircleLoader } from "@/components/ui/CircleLoader";
import { Screen } from "@/components/ui/Screen";
import { useCreateMemberLessonReservation } from "@/lib/hook/useReservation";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Pressable,
    Text,
    View
} from "react-native";

const POLICIES = [
    {
        title: "Cancellation Policy",
        description:
            "Bay reservations can only be cancelled up to 3 hours before the reservation time.",
    },
    {
        title: "No-show Policy",
        description: "A no-show will result in one bays ticket deduction.",
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
            contentClassName="grow"
            footer={
                <View className="border-t border-gray-100 bg-white px-6 pb-8 pt-4">
                    <Pressable
                        className={`items-center justify-center rounded-2xl px-4 py-4 active:opacity-85 ${isSubmitting || !ticketId || !lessonAvailabilityId
                                ? "bg-sky-200"
                                : "bg-sky-400"
                            }`}
                        onPress={handleConfirm}
                        disabled={isSubmitting || !ticketId || !lessonAvailabilityId}
                    >
                        {isSubmitting ? (
                            <CircleLoader />
                        ) : (
                            <Text
                                className="w-full text-base font-bold text-center text-white"
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.75}
                            >
                                Agree and Book
                            </Text>
                        )}
                    </Pressable>
                </View>
            }
        >
            <View className="grow">
                <View className="mt-8 gap-4">
                    <ReservationDetailField
                        label="Reservation Name"
                        value={reservationName}
                    />
                    <Separator />

                    <ReservationDetailField label="Date" value={dateValue} />
                    <Separator />

                    <ReservationDetailField label="Time" value={timeValue} />

                    {coachName ? (
                        <>
                            <Separator />
                            <ReservationDetailField label="Coach" value={coachName} />
                        </>
                    ) : null}
                </View>

                <View className="mt-6 gap-4">
                    <Separator />
                    <ReservationPoliciesSection policies={POLICIES} />
                </View>
            </View>
        </Screen>
    );
}

function Separator() {
    return <View className="h-px bg-gray-100" />;
}
