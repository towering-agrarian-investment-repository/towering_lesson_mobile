import {
    ReservationDetailField,
    ReservationPoliciesSection,
} from "@/components/golf/reservation/ReservationSections";
import { CircleLoader } from "@/components/ui/CircleLoader";
import { Screen } from "@/components/ui/Screen";
import { useCreateMemberBayReservation } from "@/lib/hook/useReservation";
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

export default function ConfirmScreen() {
    const { date, ticketId, baySlotId, bayName, startTime, endTime } =
        useLocalSearchParams<{
            date: string;
            ticketId?: string;
            baySlotId?: string;
            bayName?: string;
            startTime?: string;
            endTime?: string;
        }>();
    const router = useRouter();
    const {
        mutateAsync: createReservation,
        isPending: isSubmitting,
    } = useCreateMemberBayReservation();

    const handleConfirm = async () => {
        if (!ticketId || !baySlotId) {
            return;
        }

        const response = await createReservation({
            ticketId: Number(ticketId),
            baySlotId: Number(baySlotId),
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

    const reservationName = bayName ?? "Bay Session";
    const dateValue = formatDateValue(date, "yyyy. MM. dd");
    const timeValue = formatTimeRange(startTime, endTime);
    const isDisabled = isSubmitting || !ticketId || !baySlotId;
    return (
        <Screen
            contentClassName="grow"
            footer={
                <View className="border-t border-gray-100 bg-white px-6 pb-8 pt-4">
                    <Pressable
                        className={`items-center justify-center rounded-2xl px-4 py-4 ${isDisabled ? "bg-sky-200" : "bg-sky-400"
                            }`}
                        style={({ pressed }) => ({
                            opacity: pressed && !isDisabled ? 0.85 : 1,
                        })}
                        onPress={handleConfirm}
                        disabled={isDisabled}
                        accessibilityRole="button"
                    >
                        {isSubmitting ? (
                            <CircleLoader />
                        ) : (
                            <Text
                                className="w-full text-center text-base font-bold text-white"
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
