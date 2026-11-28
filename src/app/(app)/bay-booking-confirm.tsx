import { AppText } from "@/design-system/components/AppText";
import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import {
    BookingConfirmationFooter,
    BookingConfirmationLoadingState,
    BookingConfirmationTicketField,
    handleBookingConfirmationSuccess,
} from "@/components/golf/booking/BookingConfirmationShared";
import { isBayReservationDetail } from "@/components/golf/reservation/detail/reservation-detail-utils";
import {
    ReservationContent,
    ReservationDetailField,
    ReservationFieldLabel,
} from "@/components/golf/reservation/ReservationSections";
import { FormTextInput } from "@/components/ui/form";
import { Divider, EmptyState, ErrorState, Screen, triggerNotificationHaptic } from "@/design-system";
import { formatTicketTypeLabel } from "@/design-system/utils/ticket-type";
import { getBayNotesDraft, setBayNotesDraft } from "@/lib/booking/bay-notes-draft";
import { canBookWithTicket, canRescheduleBayReservation } from "@/lib/booking/ticket-eligibility";
import { useIsOnline } from "@/lib/hook/useIsOnline";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import {
    getMemberBaySlotGroupsQueryOptions,
    getMemberReservationDetailQueryOptions,
    isReservationSlotUnavailable,
    useCreateMemberBayReservation,
    useMemberBaySlotGroups,
    useMemberReservationById,
    useRescheduleMemberBayReservation,
} from "@/lib/hook/useReservation";
import { useMemberTicketById } from "@/lib/hook/useTicket";
import { getEffectiveTicketStatus } from "@/utils/status-tone";
import { getTicketPausePeriods, isTicketDatePaused } from "@/utils/ticket-pause";
import { formatDateForAPI, formatDateMedium, formatDateShort, formatTimeRange } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { RefreshControl } from "react-native";

const BAY_REQUEST_MAX_LENGTH = 2000;

type BayBookingFormValues = {
    memberNotes: string;
};

export default function BayBookingConfirmScreen() {
    const { t } = useTranslation();
    const isOnline = useIsOnline();
    const {
        date,
        ticketId,
        ticketName,
        ticketType,
        slotGroupId,
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
        slotGroupId?: string;
        startTime?: string;
        endTime?: string;
        mode?: string;
        reservationId?: string;
        notes?: string;
    }>();
    const router = useRouter();
    const navigation = useNavigation();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const submitting = useRef(false);
    const queryClient = useQueryClient();
    const isRescheduleMode = mode === "reschedule";
    const reservationIdNumber = Number(reservationId);
    const ticketIdNumber = Number(ticketId);
    const slotGroupIdNumber = Number(slotGroupId);
    const hasReservationId = Number.isSafeInteger(reservationIdNumber) && reservationIdNumber > 0;
    const hasTicketId = Number.isSafeInteger(ticketIdNumber) && ticketIdNumber > 0;
    const hasSlotGroupId = Number.isSafeInteger(slotGroupIdNumber) && slotGroupIdNumber > 0;
    const form = useForm<BayBookingFormValues>({
        defaultValues: {
            memberNotes: (hasSlotGroupId ? getBayNotesDraft(slotGroupIdNumber) : undefined) ?? initialNotes ?? "",
        },
        mode: "onTouched",
    });
    const { mutateAsync: createReservation, isPending: isCreating } = useCreateMemberBayReservation();
    const { mutateAsync: rescheduleReservation, isPending: isRescheduling } = useRescheduleMemberBayReservation();
    const {
        data: ticket,
        isLoading: isTicketLoading,
        isError: isTicketError,
        isPlaceholderData: isTicketPreview,
        isRefetching: isTicketRefetching,
        refetch: refetchTicket,
    } = useMemberTicketById(hasTicketId ? ticketIdNumber : undefined);
    const shouldLoadReservation = isRescheduleMode && hasReservationId;
    const reservationQuery = useMemberReservationById(reservationIdNumber, shouldLoadReservation ? "bay" : undefined);
    const reservationData = reservationQuery.data?.data;
    const rescheduleReservationData =
        reservationData && !("isListPreview" in reservationData) && isBayReservationDetail(reservationData)
            ? reservationData
            : undefined;

    useEffect(() => {
        if (!hasSlotGroupId) return;
        setBayNotesDraft(slotGroupIdNumber, form.getValues("memberNotes"));
        return form.subscribe({
            name: "memberNotes",
            exact: true,
            formState: { values: true },
            callback: ({ values }) => setBayNotesDraft(slotGroupIdNumber, values.memberNotes),
        });
    }, [form, hasSlotGroupId, slotGroupIdNumber]);
    const {
        data,
        isLoading: isSlotLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberBaySlotGroups(ticketIdNumber, date, date, Boolean(date));
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        Promise.all([
            refetch({ cancelRefetch: false }),
            refetchTicket({ cancelRefetch: false }),
            shouldLoadReservation ? reservationQuery.refetch({ cancelRefetch: false }) : undefined,
        ]),
    );
    const policies = [
        {
            title: t("bookingConfirmation.bayCancellationPolicyTitle"),
            description: t("bookingConfirmation.bayCancellationPolicyDescription"),
        },
        {
            title: t("bookingConfirmation.bayNoShowPolicyTitle"),
            description: t("bookingConfirmation.bayNoShowPolicyDescription"),
        },
    ] as const;

    const isSubmitting = isCreating || isRescheduling || form.formState.isSubmitting;
    const isLoadingReservation =
        shouldLoadReservation && (reservationQuery.isLoading || (isOnline && reservationQuery.isPlaceholderData));
    const isLoading = isSlotLoading || isTicketLoading || (isOnline && isTicketPreview) || isLoadingReservation;
    const hasLoadError =
        (isError && !data) ||
        (isTicketError && !ticket) ||
        (shouldLoadReservation && reservationQuery.isError && !rescheduleReservationData);
    const slotGroup = data?.data.find((group) => group.id === slotGroupIdNumber);
    const isRefundedTicket = getEffectiveTicketStatus(ticket?.status) === "REFUNDED";
    const canReschedule =
        !!rescheduleReservationData &&
        canRescheduleBayReservation(rescheduleReservationData) &&
        rescheduleReservationData.ticket.id === ticketIdNumber;
    const canUseTicket = isRescheduleMode
        ? Boolean(ticket) && canReschedule && !isRefundedTicket
        : canBookWithTicket(ticket);
    const isBookingDatePaused = isTicketDatePaused(
        getTicketPausePeriods(ticket?.pauses),
        formatDateForAPI(slotGroup?.startDateTime ?? date),
    );
    const isTimeUnavailable = !hasSlotGroupId || !slotGroup || slotGroup.totalReservableBaySlots <= 0;
    const isDisabled =
        !isOnline ||
        isSubmitting ||
        isLocked ||
        hasLoadError ||
        !canUseTicket ||
        isTicketPreview ||
        isBookingDatePaused ||
        isTimeUnavailable ||
        (!isRescheduleMode && !form.formState.isValid);
    const disabledReason = isRefundedTicket
        ? t("tickets.statuses.refunded")
        : isRescheduleMode && !canReschedule
          ? t(hasReservationId ? "reservations.notAvailableTitle" : "bookingConfirmation.reservationInfoMissing")
          : !isRescheduleMode && ticket && !canUseTicket
            ? t("tickets.bookingUnavailable")
            : null;
    const isRefreshing = isRefetching || isTicketRefetching || (shouldLoadReservation && reservationQuery.isRefetching);

    const chooseAnotherTime = (conflictId?: string) => {
        runWithNavigationLock(() => {
            router.dismissTo({
                pathname: "/select-time",
                params: {
                    date,
                    ticketId,
                    ticketName,
                    ticketType,
                    mode,
                    reservationId,
                    notes: form.getValues("memberNotes"),
                    conflictMessage: conflictId ? t("booking.timeNoLongerAvailableMessage") : undefined,
                    conflictId,
                },
            });
        });
    };

    const handleSlotUnavailable = async (error: unknown) => {
        if (!isReservationSlotUnavailable(error)) return;
        triggerNotificationHaptic(Haptics.NotificationFeedbackType.Warning);

        await queryClient.invalidateQueries({
            queryKey: ["member", "bay-slot-groups"],
            refetchType: "none",
        });
        await queryClient.invalidateQueries({
            queryKey: getMemberBaySlotGroupsQueryOptions(ticketIdNumber, date, date).queryKey,
            exact: true,
            refetchType: "all",
        });
        chooseAnotherTime(error.timestamp);
    };

    const handleConfirm = async (values: BayBookingFormValues) => {
        if (submitting.current || isDisabled || !slotGroup) return;

        submitting.current = true;
        try {
            const response = isRescheduleMode
                ? await rescheduleReservation({
                      reservationId: reservationIdNumber,
                      data: { baySlotGroupId: slotGroupIdNumber },
                  })
                : await createReservation({
                      ticketId: ticketIdNumber,
                      baySlotGroupId: slotGroupIdNumber,
                      memberNotes: values.memberNotes.trim() || null,
                  });

            queryClient.setQueryData(
                getMemberReservationDetailQueryOptions(response.data.id, "bay").queryKey,
                response,
            );
            setBayNotesDraft(slotGroupIdNumber, "");
            handleBookingConfirmationSuccess(
                router,
                {
                    type: "bay",
                    mode: isRescheduleMode ? "reschedule" : "booking",
                    reservationId: response.data.id,
                    ticketName: response.data.ticket?.name ?? ticketName,
                    ticketTotalCount: response.data.ticket?.totalCount,
                    ticketUsedCount: response.data.ticket?.usedCount,
                    ticketRemainingCount: response.data.ticket?.remainingCount,
                    ticketIsUnlimited: response.data.ticket?.isUnlimited,
                    date,
                    startTime: response.data.startTime ?? slotGroup.startDateTime,
                    endTime: response.data.endTime ?? slotGroup.endDateTime,
                    bayName: response.data.bayName,
                },
                navigation,
            );
        } catch (error) {
            await handleSlotUnavailable(error);
        } finally {
            submitting.current = false;
        }
    };

    const screenOptions = useMemo(
        () => ({
            title: isRescheduleMode
                ? t("bookingConfirmation.rescheduleConfirmation")
                : t("navigation.screens.bookingConfirmation"),
        }),
        [isRescheduleMode, t],
    );

    if (!hasTicketId) {
        return (
            <Screen>
                <EmptyState
                    title={t("bookingConfirmation.ticketInfoMissing")}
                    actionLabel={t("tickets.sectionTitle")}
                    onAction={() => runWithNavigationLock(() => router.dismissTo("/tickets"))}
                />
            </Screen>
        );
    }

    return (
        <Screen
            contentClassName="grow gap-6"
            keyboardAware={!isRescheduleMode}
            refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
            footer={
                !isLoading && !hasLoadError && !isTimeUnavailable ? (
                    <BookingConfirmationFooter
                        title={
                            isRescheduleMode
                                ? t("bookingConfirmation.confirmReschedule")
                                : t("bookingConfirmation.agreeBook")
                        }
                        loading={isSubmitting}
                        disabled={isDisabled}
                        onPress={() => {
                            void form.handleSubmit(handleConfirm)();
                        }}
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
                    formatTimeRange(slotGroup?.startDateTime ?? startTime, slotGroup?.endDateTime ?? endTime),
                ]}
            />
            {isLoading ? (
                <BookingConfirmationLoadingState fieldCount={4} />
            ) : hasLoadError ? (
                <ErrorState
                    title={t("bookingConfirmation.failedReservationDetailsTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefreshing ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefreshing || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            ) : isBookingDatePaused ? (
                <EmptyState
                    title={t("booking.datePaused")}
                    message={t("booking.chooseDateOutsidePause")}
                    actionLabel={t("booking.chooseAnotherDate")}
                    onAction={() =>
                        runWithNavigationLock(() =>
                            router.dismissTo({
                                pathname: "/select-date",
                                params: {
                                    date,
                                    ticketId,
                                    ticketName,
                                    ticketType,
                                    mode,
                                    reservationId,
                                    notes: form.getValues("memberNotes"),
                                },
                            }),
                        )
                    }
                />
            ) : isTimeUnavailable ? (
                <EmptyState
                    title={t("booking.timeNoLongerAvailableTitle")}
                    message={t("booking.timeNoLongerAvailableMessage")}
                    actionLabel={t("booking.chooseAnotherTime")}
                    onAction={() => chooseAnotherTime()}
                />
            ) : (
                <ReservationContent disabledReason={disabledReason} policies={policies}>
                    <BookingConfirmationTicketField
                        ticketName={ticketName}
                        ticket={isRescheduleMode ? undefined : ticket}
                    />
                    <Divider className="bg-border" />
                    <ReservationDetailField
                        label={t("reservations.bayLabel")}
                        value={t("bookingConfirmation.bayAssignedAutomatically")}
                    />
                    <Divider className="bg-border" />
                    <ReservationDetailField label={t("bookingConfirmation.dateLabel")} value={formatDateMedium(date)} />
                    <Divider className="bg-border" />
                    <ReservationDetailField
                        label={t("bookingConfirmation.timeLabel")}
                        value={formatTimeRange(
                            slotGroup?.startDateTime ?? startTime,
                            slotGroup?.endDateTime ?? endTime,
                        )}
                    />
                    <Divider className="bg-border" />
                    {isRescheduleMode ? (
                        <ReservationDetailField
                            label={t("bookingConfirmation.bayRequestLabel")}
                            value={initialNotes?.trim() || "-"}
                        />
                    ) : (
                        <FormTextInput
                            control={form.control}
                            name="memberNotes"
                            label={t("bookingConfirmation.bayRequestOptionalLabel")}
                            labelComponent={ReservationFieldLabel}
                            placeholder={t("bookingConfirmation.bayRequestPlaceholder")}
                            multiline
                            numberOfLines={3}
                            multilineMinHeight={72}
                            maxLength={BAY_REQUEST_MAX_LENGTH}
                            editable={!isSubmitting}
                            rules={{
                                maxLength: {
                                    value: BAY_REQUEST_MAX_LENGTH,
                                    message: t("bookingConfirmation.bayRequestTooLong", {
                                        count: BAY_REQUEST_MAX_LENGTH,
                                    }),
                                },
                            }}
                        />
                    )}
                    <AppText variant="caption" color="mutedForeground">
                        {t("bookingConfirmation.bayRequestDisclaimer")}
                    </AppText>
                </ReservationContent>
            )}
        </Screen>
    );
}
