import {
    ReservationDetailField,
    ReservationPoliciesSection,
} from "@/components/golf/reservation/ReservationSections";
import { AppText, Button, Divider, EmptyState, ErrorState, Screen, Skeleton, Textarea } from "@/design-system";
import { showAppToast } from "@/lib/toast/toast";
import {
    useCreateMemberBayReservation,
    useMemberBaySlotGroups,
    useRescheduleMemberBayReservation,
} from "@/lib/hook/useReservation";
import { getBaySlotAvailability } from "@/utils/bay-slot";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    RefreshControl,
    View,
} from "react-native";
import { useState } from "react";

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
    const {
        date,
        ticketId,
        ticketName,
        ticketType,
        slotGroupId,
        baySlotId,
        bayName,
        startTime,
        endTime,
        mode,
        reservationId,
        notes: initialNotes,
    } =
        useLocalSearchParams<{
            date: string;
            ticketId?: string;
            ticketName: string;
            ticketType?: string;
            slotGroupId?: string;
            baySlotId?: string;
            bayName?: string;
            startTime?: string;
            endTime?: string;
            mode?: string;
            reservationId?: string;
            notes?: string;
        }>();
    const router = useRouter();
    const isRescheduleMode = mode === "reschedule";
    const reservationIdNumber = reservationId ? Number(reservationId) : null;
    const [notes, setNotes] = useState(initialNotes ?? "");
    const {
        mutate: createReservation,
        isPending: isCreating,
    } = useCreateMemberBayReservation();
    const {
        mutate: rescheduleReservation,
        isPending: isRescheduling,
    } = useRescheduleMemberBayReservation();
    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberBaySlotGroups(date, date, Boolean(date));

    const isSubmitting = isCreating || isRescheduling;
    const slotGroup = (data?.data ?? []).find(
        (group) => String(group.id) === slotGroupId,
    );
    const selectedBaySlot = slotGroup?.baySlots.find(
        (slot) => String(slot.id) === baySlotId,
    );
    const { isDisabled: isBaySlotDisabled } = getBaySlotAvailability(selectedBaySlot);
    const isMissingRequiredData = !slotGroup || !selectedBaySlot;

    const handleConfirm = () => {
        if (!baySlotId || !slotGroup || !selectedBaySlot) {
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
                    ticketName,
                    ticketType,
                    slotGroupId,
                    mode,
                    reservationId,
                    notes,
                },
            });

            return;
        }

        const handleSuccess = (response: { data?: { id: number; reservationType: string } | null }) => {
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
        };

        if (isRescheduleMode) {
            if (!reservationIdNumber) {
                return;
            }

            rescheduleReservation(
                {
                    reservationId: reservationIdNumber,
                    data: {
                        baySlotId: Number(baySlotId),
                        notes: notes.trim() || null,
                    },
                },
                {
                    onSuccess: handleSuccess,
                },
            );
            return;
        }

        if (!ticketId) {
            return;
        }

        createReservation(
            {
                ticketId: Number(ticketId),
                baySlotId: Number(baySlotId),
                notes: notes.trim() || null,
            },
            {
                onSuccess: handleSuccess,
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
        !baySlotId ||
        isMissingRequiredData ||
        isBaySlotDisabled ||
        (isRescheduleMode ? !reservationIdNumber : !ticketId);
    const disabledReason =
        isRescheduleMode && !reservationIdNumber
            ? "Reservation information is missing."
            : !isRescheduleMode && !ticketId
            ? "Ticket information is missing."
            : !baySlotId || isMissingRequiredData
                ? "Selected bay is no longer available."
                : isBaySlotDisabled
                    ? "Selected bay is no longer available."
                    : null;

    return (
        <Screen
            contentClassName="grow"
            keyboardAware
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
                    <View className="border-t border-border bg-background px-6 pb-8 pt-4">
                        <Button
                            title={isRescheduleMode ? "Confirm Reschedule" : "Agree & Book"}
                            loading={isSubmitting}
                            disabled={isDisabled}
                            onPress={handleConfirm}
                        />
                    </View>
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
                <View className="grow">
                    <View className="gap-4">
                        <ReservationDetailField
                            label="Ticket"
                            value={ticketName}
                        />
                        <Divider className="bg-border" />

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

                        <Textarea
                            label="Notes"
                            placeholder="Add a note (optional)"
                            value={notes}
                            onChangeText={setNotes}
                        />

                        {disabledReason ? (
                            <View className="rounded-xl bg-warning/10 px-4 py-3">
                                <AppText variant="meta" className="text-warning">
                                    {disabledReason}
                                </AppText>
                            </View>
                        ) : null}

                        <ReservationPoliciesSection policies={POLICIES} />
                    </View>
                </View>
            )}
        </Screen>
    );
}
