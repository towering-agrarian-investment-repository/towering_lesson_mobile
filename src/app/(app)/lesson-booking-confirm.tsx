import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import {
    BookingConfirmationFooter,
    BookingConfirmationLoadingState,
    BookingConfirmationTicketField,
    handleBookingConfirmationSuccess,
} from "@/components/golf/booking/BookingConfirmationShared";
import { ReservationContent, ReservationDetailField } from "@/components/golf/reservation/ReservationSections";
import { Divider, EmptyState, ErrorState, Screen, triggerNotificationHaptic } from "@/design-system";
import { formatTicketTypeLabel } from "@/design-system/utils/ticket-type";
import { responseError } from "@/lib/api-response/api-response";
import { useIsOnline } from "@/lib/hook/useIsOnline";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
    getMemberTicketLessonSlotsQueryOptions,
    isReservationSlotUnavailable,
    useCreateMemberLessonReservation,
    useMemberTicketLessonSlots,
} from "@/lib/hook/useReservation";
import { useMemberTicketById } from "@/lib/hook/useTicket";
import { showAppToast } from "@/design-system/components/AppToast";
import { getLessonSlotDisplayName, getLessonSpotsLeft, isGroupLessonSlot } from "@/utils/lesson-slot";
import { getTicketPausePeriods, isTicketDatePaused } from "@/utils/ticket-pause";
import { formatDateForAPI, formatDateMedium, formatDateShort, formatTimeRange } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl } from "react-native";

export default function LessonBookingConfirmScreen() {
    const { t } = useTranslation();
    const isOnline = useIsOnline();
    const {
        date,
        ticketId,
        ticketName,
        ticketType,
        lessonAvailabilityId,
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
        coachName?: string;
        startTime?: string;
        endTime?: string;
        notes?: string;
    }>();
    const router = useRouter();
    const navigation = useNavigation();
    const { runWithNavigationLock } = useNavigationLock();
    const submitting = useRef(false);
    const queryClient = useQueryClient();
    const isGroupTicket = String(ticketType ?? "").toUpperCase() === "GROUP_LESSON";
    const notes = initialNotes?.trim() || null;
    const { mutate: createReservation, isPending: isCreating } = useCreateMemberLessonReservation();
    const selectedDate = new Date(`${date}T12:00:00`);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const parsedTicketId = Number(ticketId);
    const ticketIdNumber = Number.isSafeInteger(parsedTicketId) && parsedTicketId > 0 ? parsedTicketId : null;
    const lessonAvailabilityIdNumber = lessonAvailabilityId ? Number(lessonAvailabilityId) : null;
    const canLoadSlot =
        Boolean(ticketIdNumber) &&
        Boolean(lessonAvailabilityIdNumber) &&
        Number.isFinite(year) &&
        Number.isFinite(month);
    const {
        data,
        isLoading: isSlotLoading,
        isPlaceholderData: isSlotPreview,
        isError,
        refetch,
        isRefetching,
    } = useMemberTicketLessonSlots(ticketIdNumber, year, month, canLoadSlot);
    const balanceTicketId = canLoadSlot ? (ticketIdNumber ?? undefined) : undefined;
    const {
        data: ticket,
        isLoading: isTicketLoading,
        isError: isTicketError,
        isPlaceholderData: isTicketPreview,
        isRefetching: isTicketRefetching,
        refetch: refetchTicket,
    } = useMemberTicketById(balanceTicketId);
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        Promise.all([
            refetch({ cancelRefetch: false }),
            balanceTicketId ? refetchTicket({ cancelRefetch: false }) : undefined,
        ]),
    );
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

    const isLoading = isSlotLoading || isTicketLoading || (isOnline && (isTicketPreview || isSlotPreview));
    const hasLoadError = (isError && !data) || (isTicketError && !ticket);
    const selectedSlot = (data?.data ?? []).find((slot) => slot.id === lessonAvailabilityIdNumber);
    const isRefundedTicket = ticket?.effectiveStatus === "REFUNDED";
    const canUseTicket = ticket?.canStartBooking === true;
    const isSelectedSlotUnavailable = selectedSlot != null && !selectedSlot.bookable;
    const isBookingDatePaused =
        (!selectedSlot || isSelectedSlotUnavailable) &&
        isTicketDatePaused(getTicketPausePeriods(ticket?.pauses), formatDateForAPI(date));
    const isSelectedSlotFull = selectedSlot != null && getLessonSpotsLeft(selectedSlot) === 0;
    const isSelectedSlotAlreadyBooked = selectedSlot?.bookedByCurrentMember === true;
    const isGroupSelection = selectedSlot ? isGroupLessonSlot(selectedSlot) : isGroupTicket;
    const isMissingRequiredData = !ticketIdNumber || !lessonAvailabilityIdNumber || !selectedSlot;

    const handleSlotUnavailable = async (error: unknown) => {
        if (!isReservationSlotUnavailable(error) || !ticketIdNumber) {
            return;
        }
        triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);

        await queryClient.invalidateQueries({
            queryKey: getMemberTicketLessonSlotsQueryOptions(ticketIdNumber, year, month).queryKey,
            refetchType: "all",
        });
        runWithNavigationLock(() => {
            router.dismissTo({
                pathname: "/select-lesson-slot",
                params: {
                    date,
                    ticketId,
                    ticketName,
                    ticketType,
                    notes: notes ?? undefined,
                    conflictMessage: error.message,
                    conflictSlotId: lessonAvailabilityId,
                    conflictId: error.timestamp,
                },
            });
        });
        responseError(error);
    };

    const handleConfirm = () => {
        if (
            !isOnline ||
            submitting.current ||
            isCreating ||
            hasLoadError ||
            !canUseTicket ||
            isTicketPreview ||
            isSlotPreview ||
            !ticketIdNumber ||
            !lessonAvailabilityIdNumber ||
            !selectedSlot
        ) {
            return;
        }

        if (isSelectedSlotUnavailable || isSelectedSlotAlreadyBooked) {
            showAppToast({
                message: isSelectedSlotAlreadyBooked
                    ? t("booking.alreadyBooked")
                    : isSelectedSlotFull
                      ? isGroupSelection
                          ? t("bookingConfirmation.selectedGroupUnavailable")
                          : t("bookingConfirmation.selectedLessonSlotUnavailable")
                      : isGroupSelection
                        ? t("bookingConfirmation.selectedGroupNotBookable")
                        : t("bookingConfirmation.selectedLessonSlotNotBookable"),
                type: "warning",
            });

            runWithNavigationLock(() => {
                router.dismissTo({
                    pathname: "/select-lesson-slot",
                    params: {
                        date,
                        ticketId,
                        ticketName,
                        ticketType,
                        notes: notes ?? undefined,
                    },
                });
            });

            return;
        }

        submitting.current = true;
        createReservation(
            {
                ticketId: ticketIdNumber,
                lessonAvailabilityId: lessonAvailabilityIdNumber,
                notes,
            },
            {
                onSuccess: (response) =>
                    handleBookingConfirmationSuccess(
                        router,
                        {
                            type: "lesson",
                            mode: "booking",
                            reservationId: response.data.id,
                            ticketName: response.data.ticket?.name ?? ticketName,
                            ticketTotalCount: response.data.ticket?.totalCount,
                            ticketUsedCount: response.data.ticket?.usedCount,
                            ticketRemainingCount: response.data.ticket?.remainingCount,
                            ticketIsUnlimited: response.data.ticket?.isUnlimited,
                            date,
                            startTime: selectedSlot.startTime ?? startTime,
                            endTime: selectedSlot.endTime ?? endTime,
                            reservationName: getLessonSlotDisplayName(selectedSlot, t),
                            coachName: selectedSlot.coachName ?? coachName,
                        },
                        navigation,
                    ),
                onError: handleSlotUnavailable,
                onSettled: () => {
                    submitting.current = false;
                },
            },
        );
    };

    const dateValue = formatDateMedium(date);
    const timeValue = formatTimeRange(selectedSlot?.startTime ?? startTime, selectedSlot?.endTime ?? endTime);
    const coachNameValue = selectedSlot?.coachName ?? coachName;
    const isDisabled =
        !isOnline ||
        isCreating ||
        !canUseTicket ||
        isTicketPreview ||
        isSlotPreview ||
        isSelectedSlotUnavailable ||
        isSelectedSlotAlreadyBooked;
    const disabledReason = isRefundedTicket
        ? t("tickets.statuses.refunded")
        : ticket && !canUseTicket
          ? t("tickets.bookingUnavailable")
          : isSelectedSlotAlreadyBooked
            ? t("booking.alreadyBooked")
            : isSelectedSlotUnavailable
              ? isSelectedSlotFull
                  ? isGroupSelection
                      ? t("bookingConfirmation.selectedGroupNowFull")
                      : t("bookingConfirmation.selectedLessonSlotNowFull")
                  : isGroupSelection
                    ? t("bookingConfirmation.selectedGroupCurrentlyNotBookable")
                    : t("bookingConfirmation.selectedLessonSlotCurrentlyNotBookable")
              : null;

    const screenOptions = useMemo(
        () => ({
            title: isGroupSelection
                ? t("bookingConfirmation.joinGroupConfirmation")
                : t("bookingConfirmation.bookingConfirmationTitle"),
        }),
        [isGroupSelection, t],
    );

    return (
        <Screen
            contentClassName="grow gap-6"
            refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
            footer={
                !isLoading && !hasLoadError && !isMissingRequiredData ? (
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
            <Stack.Screen options={screenOptions} />
            <BookingStepHeader
                step={3}
                totalSteps={3}
                context={formatTicketTypeLabel(ticketType, t) || ticketName}
                selectionTrail={[
                    formatTicketTypeLabel(ticketType, t) || ticketName,
                    formatDateShort(date),
                    formatTimeRange(selectedSlot?.startTime ?? startTime, selectedSlot?.endTime ?? endTime),
                ]}
            />
            {isLoading ? (
                <BookingConfirmationLoadingState fieldCount={4} />
            ) : hasLoadError ? (
                <ErrorState
                    title={t("bookingConfirmation.failedReservationDetailsTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={
                        isRefetching || isTicketRefetching ? t("common.refreshing") : t("common.refreshTryAgain")
                    }
                    actionPending={isRefetching || isTicketRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            ) : isBookingDatePaused ? (
                <EmptyState
                    title={t("booking.datePaused")}
                    message={t("booking.chooseDateOutsidePause")}
                    actionLabel={t("booking.chooseAnotherDate")}
                    onAction={() => {
                        runWithNavigationLock(() => {
                            router.dismissTo({
                                pathname: "/select-date",
                                params: { date, ticketId, ticketName, ticketType, notes: notes ?? undefined },
                            });
                        });
                    }}
                />
            ) : isMissingRequiredData ? (
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
                    actionLabel={
                        isGroupSelection
                            ? t("bookingConfirmation.chooseAnotherGroup")
                            : t("bookingConfirmation.chooseAnotherSlot")
                    }
                    onAction={() => {
                        runWithNavigationLock(() => {
                            router.dismissTo({
                                pathname: "/select-lesson-slot",
                                params: {
                                    date,
                                    ticketId,
                                    ticketName,
                                    ticketType,
                                    notes: notes ?? undefined,
                                },
                            });
                        });
                    }}
                />
            ) : (
                <ReservationContent disabledReason={disabledReason} policies={policies}>
                    <BookingConfirmationTicketField ticketName={ticketName} ticket={ticket} />
                    <Divider className="bg-border" />

                    <ReservationDetailField label={t("bookingConfirmation.dateLabel")} value={dateValue} />
                    <Divider className="bg-border" />

                    <ReservationDetailField label={t("bookingConfirmation.timeLabel")} value={timeValue} />

                    {coachNameValue ? (
                        <>
                            <Divider className="bg-border" />
                            <ReservationDetailField
                                label={t("bookingConfirmation.coachLabel")}
                                value={coachNameValue}
                            />
                        </>
                    ) : null}
                </ReservationContent>
            )}
        </Screen>
    );
}
