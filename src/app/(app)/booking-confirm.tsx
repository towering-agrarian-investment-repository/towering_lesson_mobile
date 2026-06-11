import {
    ReservationDetailField,
    ReservationPoliciesSection,
} from "@/components/golf/reservation/ReservationSections";
import { AppText, Button, Divider, EmptyState, ErrorState, Screen, Skeleton } from "@/design-system";
import { showAppToast } from "@/lib/toast/toast";
import { useCreateMemberBayReservation, useMemberBaySlotGroups } from "@/lib/hook/useReservation";
import { getBaySlotAvailability } from "@/utils/bay-slot";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import {
    RefreshControl,
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
    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberBaySlotGroups(date, date, Boolean(date));

    const slotGroup = (data?.data ?? []).find(
        (group) => String(group.id) === slotGroupId,
    );
    const selectedBaySlot = slotGroup?.baySlots.find(
        (slot) => String(slot.id) === baySlotId,
    );
    const { isDisabled: isBaySlotDisabled } = getBaySlotAvailability(selectedBaySlot);
    const isMissingRequiredData = !slotGroup || !selectedBaySlot;

    const handleConfirm = () => {
        if (!ticketId || !baySlotId || !slotGroup || !selectedBaySlot) {
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

                    router.dismissAll();

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

    const reservationName = selectedBaySlot?.bayName ?? bayName ?? "Bay Session";
    const dateValue = formatDateValue(date, "yyyy. MM. dd");
    const timeValue = formatTimeRange(
        slotGroup?.startDateTime ?? startTime,
        slotGroup?.endDateTime ?? endTime,
    );
    const isDisabled =
        isSubmitting ||
        !ticketId ||
        !baySlotId ||
        isMissingRequiredData ||
        isBaySlotDisabled;
    const disabledReason =
        !ticketId
            ? "Ticket information is missing."
            : !baySlotId || isMissingRequiredData
                ? "Selected bay is no longer available."
                : isBaySlotDisabled
                    ? "Selected bay is no longer available."
                    : null;

    return (
        <Screen
            contentClassName="grow"
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={() => {
                        void refetch();
                    }}
                />
            }
            footer={
                !isLoading && !isError && !isMissingRequiredData ? (
                    <MotiView
                        from={{ opacity: 0, translateY: 12 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: "timing", duration: 140 }}
                        className="border-t border-border bg-background px-6 pb-8 pt-4"
                    >
                        <Button
                            title="Agree & Book"
                            loading={isSubmitting}
                            disabled={isDisabled}
                            onPress={handleConfirm}
                        />
                    </MotiView>
                ) : null
            }
        >
            {isLoading ? (
                <View className="gap-6">
                    <View className="gap-4">
                        {Array.from({ length: 3 }, (_, index) => (
                            <View key={index} className="gap-4">
                                <View className="gap-2">
                                    <Skeleton className="h-4 w-24 rounded-full" />
                                    <Skeleton className="h-6 w-full rounded-full" />
                                </View>
                                {index < 2 ? <Divider className="bg-border" /> : null}
                            </View>
                        ))}
                    </View>

                    <View className="gap-4">
                        <Divider className="bg-border" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </View>
                </View>
            ) : isError ? (
                <ErrorState
                    title="Failed to load reservation details"
                    message="Pull to refresh and try again."
                    actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : isMissingRequiredData ? (
                <EmptyState
                    title="Selected bay no longer available"
                    message="Please go back and choose another bay."
                    actionLabel="Choose Another Bay"
                    onAction={() => {
                        router.back();
                    }}
                />
            ) : (
                <MotiView
                    from={{ opacity: 0, translateY: 12 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 140 }}
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

                        {disabledReason ? (
                            <View className="rounded-xl bg-warning/10 px-4 py-3">
                                <AppText variant="meta" className="text-warning">
                                    {disabledReason}
                                </AppText>
                            </View>
                        ) : null}

                        <ReservationPoliciesSection policies={POLICIES} />
                    </View>
                </MotiView>
            )}
        </Screen>
    );
}
