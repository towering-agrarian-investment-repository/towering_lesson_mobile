import {
    BookingConfirmationContent,
    BookingConfirmationFooter,
    BookingConfirmationLoadingState,
    type BookingConfirmationSuccessResponse,
    handleBookingConfirmationSuccess,
} from "@/components/golf/booking/BookingConfirmationShared";
import {
    ReservationDetailField,
} from "@/components/golf/reservation/ReservationSections";
import { Divider, EmptyState, ErrorState, Screen } from "@/design-system";
import {
    useCreateMemberLessonReservation,
    useMemberTicketLessonSlots,
    useRescheduleMemberLessonReservation,
} from "@/lib/hook/useReservation";
import { showAppToast } from "@/lib/toast/toast";
import {
    getLessonSlotDisplayName,
    isLessonSlotBookable,
    isGroupLessonSlot,
    isLessonSlotFull,
} from "@/utils/lesson-slot";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import {
    RefreshControl,
    View
} from "react-native";
import { useState } from "react";

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
        mode,
        reservationId,
        notes: initialNotes,
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
        mode?: string;
        reservationId?: string;
        notes?: string;
    }>();
    const router = useRouter();
    const isGroupTicket = String(ticketType ?? "").toUpperCase() === "GROUP_LESSON";
    const isRescheduleMode = mode === "reschedule";
    const reservationIdNumber = reservationId ? Number(reservationId) : null;
    const [notes, setNotes] = useState(initialNotes ?? "");
    const {
        mutate: createReservation,
        isPending: isCreating,
    } = useCreateMemberLessonReservation();
    const {
        mutate: rescheduleReservation,
        isPending: isRescheduling,
    } = useRescheduleMemberLessonReservation();
    const isSubmitting = isCreating || isRescheduling;
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
                    mode,
                    reservationId,
                    notes,
                },
            });

            return;
        }

        if (isRescheduleMode) {
            if (!reservationIdNumber) {
                return;
            }

            rescheduleReservation(
                {
                    reservationId: reservationIdNumber,
                    data: {
                        lessonAvailabilityId: lessonAvailabilityIdNumber,
                        notes: notes.trim() || null,
                    },
                },
                {
                    onSuccess: (response: BookingConfirmationSuccessResponse) =>
                        handleBookingConfirmationSuccess(router, response),
                },
            );
            return;
        }

        createReservation(
            {
                ticketId: ticketIdNumber,
                lessonAvailabilityId: lessonAvailabilityIdNumber,
                notes: notes.trim() || null,
            },
            {
                onSuccess: (response: BookingConfirmationSuccessResponse) =>
                    handleBookingConfirmationSuccess(router, response),
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
        isSelectedSlotFull ||
        (isRescheduleMode && !reservationIdNumber);
    const disabledReason =
        isRescheduleMode && !reservationIdNumber
            ? "Reservation information is missing."
            : isMissingRequiredData
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
                    <BookingConfirmationFooter
                        title={
                            isRescheduleMode
                                ? "Confirm Reschedule"
                                : isGroupSelection
                                    ? "Agree & Join Group"
                                    : "Agree & Book"
                        }
                        loading={isSubmitting}
                        disabled={isDisabled}
                        onPress={handleConfirm}
                    />
                ) : null
            }
        >
            <Stack.Screen
                options={{
                    title: isRescheduleMode
                        ? "Reschedule Confirmation"
                        : isGroupSelection
                            ? "Join Group Confirmation"
                            : "Booking Confirmation",
                }}
            />
            {isLoading ? (
                <BookingConfirmationLoadingState fieldCount={4} />
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
                <BookingConfirmationContent
                    notes={notes}
                    onNotesChange={setNotes}
                    disabledReason={disabledReason}
                    policies={POLICIES}
                >
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
                </BookingConfirmationContent>
            )}
        </Screen>
    );
}
