import {
    ReservationDetailField,
    ReservationPoliciesSection,
} from "@/components/golf/reservation/ReservationSections";
import { Screen } from "@/components/ui/Screen";
import { Button, Divider } from "@/design-system";
import { useCreateMemberBayReservation } from "@/lib/hook/useReservation";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
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
        description: "A no-show will result in one bay ticket deduction.",
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
                <View className="border-t border-border bg-background px-6 pb-8 pt-4">
                    <Button
                        title="Agree & Book"
                        loading={isSubmitting}
                        disabled={isDisabled}
                        onPress={handleConfirm}
                    />
                </View>
            }
        >
            <View className="grow">
                <View className="gap-4">
                    <ReservationDetailField
                        label="Reservation Name"
                        value={reservationName}
                    />
                    <Divider className="bg-border" />

                    <ReservationDetailField label="Date" value={dateValue} />
                    <Divider className="bg-border" />

                    <ReservationDetailField label="Time" value={timeValue} />
                </View>

                <View className="mt-6 gap-4">
                    <Divider className="bg-border" />

                    <ReservationPoliciesSection policies={POLICIES} />
                </View>
            </View>
        </Screen>
    );
}
