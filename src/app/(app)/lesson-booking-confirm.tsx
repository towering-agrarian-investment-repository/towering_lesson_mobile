import {
    ReservationDetailField,
    ReservationPoliciesSection,
} from "@/components/golf/reservation/ReservationSections";
import { AppText, Button, Divider, EmptyState, ErrorState, Screen, Skeleton } from "@/design-system";
import { useCreateMemberLessonReservation, useMemberTicketLessonSlots } from "@/lib/hook/useReservation";
import { showAppToast } from "@/lib/toast/toast";
import {
    getLessonSlotDisplayName,
    isLessonSlotBookable,
    isGroupLessonSlot,
    isLessonSlotFull,
} from "@/utils/lesson-slot";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    RefreshControl,
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
        ticketName,
        ticketType,
        lessonAvailabilityId,
        lessonName,
        coachName,
        startTime,
        endTime,
    } = useLocalSearchParams<{
        date: string;
        ticketId?: string;
        ticketName: string;
        ticketType?: string;
        lessonAvailabilityId?: string;
        lessonName?: string;
        coachName?: string;
        startTime?: string;
        endTime?: string;
    }>();
    const router = useRouter();
    const isGroupTicket = String(ticketType ?? "").toUpperCase() === "GROUP_LESSON";
    const {
        mutate: createReservation,
        isPending: isSubmitting,
    } = useCreateMemberLessonReservation();
    const selectedDate = new Date(`${date}T12:00:00`);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const ticketIdNumber = ticketId ? Number(ticketId) : null;
    const lessonAvailabilityIdNumber = lessonAvailabilityId
        ? Number(lessonAvailabilityId)
        : null;
    const canLoadSlot =
        Boolean(ticketIdNumber) &&
        Boolean(lessonAvailabilityIdNumber) &&
        Number.isFinite(year) &&
        Number.isFinite(month);
    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberTicketLessonSlots(ticketIdNumber, year, month, canLoadSlot);

    const selectedSlot = (data?.data ?? []).find(
        (slot) => slot.id === lessonAvailabilityIdNumber,
    );
    const isSelectedSlotBookable = selectedSlot
        ? isLessonSlotBookable(selectedSlot)
        : false;
    const isSelectedSlotFull = selectedSlot ? isLessonSlotFull(selectedSlot) : false;
    const isGroupSelection = selectedSlot
        ? isGroupLessonSlot(selectedSlot)
        : isGroupTicket;
    const isMissingRequiredData = !ticketIdNumber || !lessonAvailabilityIdNumber;

    const handleConfirm = () => {
        if (!ticketIdNumber || !lessonAvailabilityIdNumber || !selectedSlot) {
            return;
        }

        if (isSelectedSlotFull) {
            showAppToast({
                message: isSelectedSlotBookable
                    ? isGroupSelection
                        ? "Selected group is no longer available."
                        : "Selected lesson slot is no longer available."
                    : isGroupSelection
                        ? "Selected group is not bookable."
                        : "Selected lesson slot is not bookable.",
                type: "warning",
            });

            router.replace({
                pathname: "/select-lesson-slot",
                params: {
                    date,
                    ticketId,
                    ticketName,
                    ticketType,
                },
            });

            return;
        }

        createReservation(
            {
                ticketId: ticketIdNumber,
                lessonAvailabilityId: lessonAvailabilityIdNumber,
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

    const reservationName =
        (selectedSlot ? getLessonSlotDisplayName(selectedSlot) : null) ??
        lessonName ??
        (isGroupSelection ? "Group Lesson" : "Private Lesson");
    const dateValue = formatDateValue(date, "yyyy. MM. dd");
    const timeValue = formatTimeRange(
        selectedSlot?.startTime ?? startTime,
        selectedSlot?.endTime ?? endTime,
    );
    const coachNameValue = selectedSlot?.coachName ?? coachName;
    const isDisabled =
        isSubmitting ||
        isMissingRequiredData ||
        !selectedSlot ||
        isSelectedSlotFull;
    const disabledReason =
        isMissingRequiredData
                    ? "Ticket or lesson slot information is missing."
                    : !selectedSlot
                        ? isGroupSelection
                            ? "Selected group is no longer available."
                            : "Selected lesson slot is no longer available."
                        : isSelectedSlotFull
                            ? isSelectedSlotBookable
                                ? isGroupSelection
                                    ? "Selected group is now full."
                                    : "Selected lesson slot is now full."
                                : isGroupSelection
                                    ? "Selected group is not currently bookable."
                                    : "Selected lesson slot is not currently bookable."
                            : null;

    return (
        <Screen
            contentClassName="flex-1"
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
                            title={isGroupSelection ? "Agree & Join Group" : "Agree & Book"}
                            loading={isSubmitting}
                            disabled={isDisabled}
                            onPress={handleConfirm}
                        />
                    </View>
                ) : null
            }
        >
            <Stack.Screen
                options={{
                    title: isGroupSelection ? "Join Group Confirmation" : "Booking Confirmation",
                }}
            />
            {isLoading ? (
                <View className="gap-6">
                    <View className="gap-4">
                        {Array.from({ length: 4 }, (_, index) => (
                            <View key={index} className="gap-4">
                                <View className="gap-2">
                                    <Skeleton className="h-4 w-24 rounded-full" />
                                    <Skeleton className="h-6 w-full rounded-full" />
                                </View>
                                {index < 3 ? <Divider className="bg-border" /> : null}
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
            ) : isMissingRequiredData || !selectedSlot ? (
                <EmptyState
                    title={
                        isGroupSelection
                            ? "Selected group no longer available"
                            : "Selected lesson slot no longer available"
                    }
                    message={
                        isGroupSelection
                            ? "Please go back and choose another group to join."
                            : "Please go back and choose another lesson slot."
                    }
                    actionLabel={isGroupSelection ? "Choose Another Group" : "Choose Another Slot"}
                    onAction={() => {
                        router.replace({
                            pathname: "/select-lesson-slot",
                            params: {
                                date,
                                ticketId,
                                ticketName,
                                ticketType,
                            },
                        });
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

                        {coachNameValue ? (
                            <>
                                <Divider className="bg-border" />
                                <ReservationDetailField label="Coach" value={coachNameValue} />
                            </>
                        ) : null}
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
                </View>
            )}
        </Screen>
    );
}
