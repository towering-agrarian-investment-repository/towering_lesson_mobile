import {
    BookingConfirmationFooter,
    BookingConfirmationLoadingState,
    handleBookingConfirmationSuccess,
} from "@/components/golf/booking/BookingConfirmationShared";
import { ReservationContent, ReservationDetailField } from "@/components/golf/reservation/ReservationSections";
import { FormTextInput } from "@/components/ui/form";
import { Divider, EmptyState, ErrorState, Screen, triggerNotificationHaptic } from "@/design-system";
import { NativeText } from "@/design-system/components/NativeText";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import {
    getMemberBaySlotGroupsQueryOptions,
    isReservationSlotUnavailable,
    useCreateMemberBayReservation,
    useMemberBaySlotGroups,
    useRescheduleMemberBayReservation,
} from "@/lib/hook/useReservation";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { RefreshControl } from "react-native";

const BAY_REQUEST_MAX_LENGTH = 2000;

type BayBookingFormValues = {
    memberNotes: string;
};

export default function BayBookingConfirmScreen() {
    const { t } = useTranslation();
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
        defaultValues: { memberNotes: initialNotes ?? "" },
        mode: "onChange",
    });
    const { mutateAsync: createReservation, isPending: isCreating } =
        useCreateMemberBayReservation();
    const { mutateAsync: rescheduleReservation, isPending: isRescheduling } =
        useRescheduleMemberBayReservation();
    const { data, isLoading, isError, refetch, isRefetching } =
        useMemberBaySlotGroups(ticketIdNumber, date, date, Boolean(date));
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => refetch({ cancelRefetch: false }));
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
    const hasLoadError = isError && !data;
    const slotGroup = data?.data.find((group) => group.id === slotGroupIdNumber);
    const isTimeUnavailable = !hasSlotGroupId || !slotGroup || slotGroup.totalReservableBaySlots <= 0;
    const isDisabled =
        isSubmitting || isLocked || hasLoadError || isTimeUnavailable ||
        (isRescheduleMode ? !hasReservationId : !hasTicketId || !form.formState.isValid);
    const disabledReason =
        isRescheduleMode && !hasReservationId
            ? t("bookingConfirmation.reservationInfoMissing")
            : !isRescheduleMode && !hasTicketId
                ? t("bookingConfirmation.ticketInfoMissing")
                : isTimeUnavailable
                    ? t("booking.timeNoLongerAvailableMessage")
                    : null;

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

            handleBookingConfirmationSuccess(router, {
                type: "bay",
                mode: isRescheduleMode ? "reschedule" : "booking",
                ticketName: response.data.ticket?.name ?? ticketName,
                ticketTotalCount: response.data.ticket?.totalCount,
                ticketUsedCount: response.data.ticket?.usedCount,
                ticketRemainingCount: response.data.ticket?.remainingCount,
                ticketIsUnlimited: response.data.ticket?.isUnlimited,
                date,
                startTime: response.data.startTime ?? slotGroup.startDateTime,
                endTime: response.data.endTime ?? slotGroup.endDateTime,
                bayName: response.data.bayName,
            });
        } catch (error) {
            await handleSlotUnavailable(error);
        } finally {
            submitting.current = false;
        }
    };

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
            contentClassName="grow"
            keyboardAware={!isRescheduleMode}
            refreshControl={
                <RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />
            }
            footer={
                !isLoading && !hasLoadError && !isTimeUnavailable ? (
                    <BookingConfirmationFooter
                        title={isRescheduleMode
                            ? t("bookingConfirmation.confirmReschedule")
                            : t("bookingConfirmation.agreeBook")}
                        loading={isSubmitting}
                        disabled={isDisabled}
                        onPress={() => { void form.handleSubmit(handleConfirm)(); }}
                    />
                ) : null
            }
        >
            <Stack.Screen options={{
                title: isRescheduleMode
                    ? t("bookingConfirmation.rescheduleConfirmation")
                    : t("navigation.screens.bookingConfirmation"),
            }} />
            {isLoading ? (
                <BookingConfirmationLoadingState fieldCount={4} />
            ) : hasLoadError ? (
                <ErrorState
                    title={t("bookingConfirmation.failedReservationDetailsTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
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
                    <ReservationDetailField
                        label={t("bookingConfirmation.ticketLabel")}
                        value={ticketName}
                    />
                    <Divider className="bg-border" />
                    <ReservationDetailField
                        label={t("reservations.bayLabel")}
                        value={t("bookingConfirmation.bayAssignedAutomatically")}
                    />
                    <Divider className="bg-border" />
                    <ReservationDetailField
                        label={t("bookingConfirmation.dateLabel")}
                        value={formatDateValue(date, "yyyy. MM. dd")}
                    />
                    <Divider className="bg-border" />
                    <ReservationDetailField
                        label={t("bookingConfirmation.timeLabel")}
                        value={formatTimeRange(slotGroup?.startDateTime ?? startTime, slotGroup?.endDateTime ?? endTime)}
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
                            placeholder={t("bookingConfirmation.bayRequestPlaceholder")}
                            multiline
                            numberOfLines={3}
                            maxLength={BAY_REQUEST_MAX_LENGTH}
                            editable={!isSubmitting}
                            rules={{ maxLength: {
                                value: BAY_REQUEST_MAX_LENGTH,
                                message: t("bookingConfirmation.bayRequestTooLong", { count: BAY_REQUEST_MAX_LENGTH }),
                            } }}
                        />
                    )}
                    <NativeText variant="caption" color="mutedForeground">
                        {t("bookingConfirmation.bayRequestDisclaimer")}
                    </NativeText>
                </ReservationContent>
            )}
        </Screen>
    );
}
