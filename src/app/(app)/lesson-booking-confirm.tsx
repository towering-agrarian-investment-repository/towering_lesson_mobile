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
} from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function LessonBookingConfirmScreen() {
    const { t } = useTranslation();
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
        notes?: string;
    }>();
    const router = useRouter();
    const isGroupTicket = String(ticketType ?? "").toUpperCase() === "GROUP_LESSON";
    const [notes, setNotes] = useState(initialNotes ?? "");
    const { mutate: createReservation, isPending: isCreating } =
        useCreateMemberLessonReservation();
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
    const policies = [
        {
            title: t("bookingConfirmation.lessonCancellationPolicyTitle"),
            description: t("bookingConfirmation.lessonCancellationPolicyDescription"),
        },
        {
            title: t("bookingConfirmation.lessonNoShowPolicyTitle"),
            description: t("bookingConfirmation.lessonNoShowPolicyDescription"),
        },
    ] as const;

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
                        ? t("bookingConfirmation.selectedGroupUnavailable")
                        : t("bookingConfirmation.selectedLessonSlotUnavailable")
                    : isGroupSelection
                        ? t("bookingConfirmation.selectedGroupNotBookable")
                        : t("bookingConfirmation.selectedLessonSlotNotBookable"),
                type: "warning",
            });

            router.replace({
                pathname: "/select-lesson-slot",
                params: {
                    date,
                    ticketId,
                    ticketName,
                    ticketType,
                    notes,
                },
            });

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
        (isGroupSelection
            ? t("bookingConfirmation.groupLessonFallback")
            : t("bookingConfirmation.privateLessonFallback"));
    const dateValue = formatDateValue(date, "yyyy. MM. dd");
    const timeValue = formatTimeRange(
        selectedSlot?.startTime ?? startTime,
        selectedSlot?.endTime ?? endTime,
    );
    const coachNameValue = selectedSlot?.coachName ?? coachName;
    const isDisabled =
        isCreating ||
        isMissingRequiredData ||
        !selectedSlot ||
        isSelectedSlotFull;
    const disabledReason =
        isMissingRequiredData
            ? t("bookingConfirmation.ticketOrSlotMissing")
            : !selectedSlot
                ? isGroupSelection
                    ? t("bookingConfirmation.selectedGroupUnavailable")
                    : t("bookingConfirmation.selectedLessonSlotUnavailable")
                : isSelectedSlotFull
                    ? isSelectedSlotBookable
                        ? isGroupSelection
                            ? t("bookingConfirmation.selectedGroupNowFull")
                            : t("bookingConfirmation.selectedLessonSlotNowFull")
                        : isGroupSelection
                            ? t("bookingConfirmation.selectedGroupCurrentlyNotBookable")
                            : t("bookingConfirmation.selectedLessonSlotCurrentlyNotBookable")
                    : null;

    return (
        <Screen
            keyboardAware
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
                            isGroupSelection
                                ? t("bookingConfirmation.agreeJoinGroup")
                                : t("bookingConfirmation.agreeBook")
                        }
                        loading={isCreating}
                        disabled={isDisabled}
                        onPress={handleConfirm}
                    />
                ) : null
            }
        >
            <Stack.Screen
                options={{
                    title: isGroupSelection
                        ? t("bookingConfirmation.joinGroupConfirmation")
                        : t("bookingConfirmation.bookingConfirmationTitle"),
                }}
            />
            {isLoading ? (
                <BookingConfirmationLoadingState fieldCount={4} />
            ) : isError ? (
                <ErrorState
                    title={t("bookingConfirmation.failedReservationDetailsTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : isMissingRequiredData || !selectedSlot ? (
                <EmptyState
                    title={
                        isGroupSelection
                            ? t("bookingConfirmation.selectedGroupUnavailableTitle")
                            : t("bookingConfirmation.selectedLessonSlotUnavailableTitle")
                    }
                    message={
                        isGroupSelection
                            ? t("bookingConfirmation.selectedGroupUnavailableMessage")
                            : t("bookingConfirmation.selectedLessonSlotUnavailableMessage")
                    }
                    actionLabel={isGroupSelection
                        ? t("bookingConfirmation.chooseAnotherGroup")
                        : t("bookingConfirmation.chooseAnotherSlot")}
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
                    policies={policies}
                >
                    <ReservationDetailField
                        label={t("bookingConfirmation.ticketLabel")}
                        value={ticketName}
                    />
                    <Divider className="bg-border" />

                    <ReservationDetailField
                        label={t("bookingConfirmation.reservationNameLabel")}
                        value={reservationName}
                    />
                    <Divider className="bg-border" />

                    <ReservationDetailField
                        label={t("bookingConfirmation.dateLabel")}
                        value={dateValue}
                    />
                    <Divider className="bg-border" />

                    <ReservationDetailField
                        label={t("bookingConfirmation.timeLabel")}
                        value={timeValue}
                    />

                    {coachNameValue ? (
                        <>
                            <Divider className="bg-border" />
                            <ReservationDetailField
                                label={t("bookingConfirmation.coachLabel")}
                                value={coachNameValue}
                            />
                        </>
                    ) : null}
                </BookingConfirmationContent>
            )}
        </Screen>
    );
}
