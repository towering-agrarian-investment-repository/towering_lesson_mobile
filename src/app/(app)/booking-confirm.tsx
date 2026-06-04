import {
    ReservationDetailField,
    ReservationPoliciesSection,
} from "@/components/golf/reservation/ReservationSections";
import { Screen } from "@/components/ui/Screen";
import { showAppToast } from "@/lib/toast/toast";
import { Button, Divider } from "@/design-system";
import { useCreateMemberBayReservation, useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import { getBaySlotAvailability } from "@/utils/bay-slot";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
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
    const { date, ticketId, slotGroupId, baySlotId, bayName, startTime, endTime } =
        useLocalSearchParams<{
            date: string;
            ticketId?: string;
            slotGroupId?: string;
            baySlotId?: string;
            bayName?: string;
            startTime?: string;
            endTime?: string;
        }>();
    const router = useRouter();
    const {
        mutate: createReservation,
        isPending: isSubmitting,
    } = useCreateMemberBayReservation();
    const { data } = useMemberBaySlotGroups(date, date, Boolean(date));

    const slotGroup = (data?.data ?? []).find(
        (group) => String(group.id) === slotGroupId,
    );
    const selectedBaySlot = slotGroup?.baySlots.find(
        (slot) => String(slot.id) === baySlotId,
    );
    const { isDisabled: isBaySlotDisabled } = getBaySlotAvailability(selectedBaySlot);

    const handleConfirm = () => {
        if (!ticketId || !baySlotId) {
            return;
        }

        if (isBaySlotDisabled) {
            showAppToast({
                message: "Selected bay is no longer available.",
                type: "warning",
            });

            router.replace({
                pathname: "/select-bay",
                params: {
                    date,
                    ticketId,
                    slotGroupId,
                },
            });

            return;
        }

        createReservation(
            {
                ticketId: Number(ticketId),
                baySlotId: Number(baySlotId),
            },
            {
                onSuccess: (response) => {
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
                },
            },
        );
    };

    const reservationName = bayName ?? "Bay Session";
    const dateValue = formatDateValue(date, "yyyy. MM. dd");
    const timeValue = formatTimeRange(startTime, endTime);
    const isDisabled = isSubmitting || !ticketId || !baySlotId;
    return (
        <Screen
            contentClassName="grow"
            footer={
                <MotiView
                    from={{ opacity: 0, translateY: 12 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 180, delay: 80 }}
                    className="border-t border-border bg-background px-6 pb-8 pt-4"
                >
                    <Button
                        title="Agree & Book"
                        loading={isSubmitting}
                        disabled={isDisabled}
                        onPress={handleConfirm}
                    />
                </MotiView>
            }
        >
            <MotiView
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 180 }}
                className="grow"
            >
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
            </MotiView>
        </Screen>
    );
}
