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
import { EmptyState, ErrorState, Screen, Divider } from "@/design-system";
import { showAppToast } from "@/lib/toast/toast";
import {
    useCreateMemberBayReservation,
    useMemberBaySlotGroups,
    useRescheduleMemberBayReservation,
} from "@/lib/hook/useReservation";
import { getBaySlotAvailability } from "@/utils/bay-slot";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
    RefreshControl,
} from "react-native";
import { useState } from "react";

export default function ConfirmScreen() {
    const { t } = useTranslation();
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
                message: t("bookingConfirmation.selectedBayUnavailable"),
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
                    onSuccess: (response: BookingConfirmationSuccessResponse) =>
                        handleBookingConfirmationSuccess(router, response),
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
                onSuccess: (response: BookingConfirmationSuccessResponse) =>
                    handleBookingConfirmationSuccess(router, response),
            },
        );
    };

    const reservationName =
        selectedBaySlot?.bayName ?? bayName ?? t("bookingConfirmation.baySessionFallback");
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
            ? t("bookingConfirmation.reservationInfoMissing")
            : !isRescheduleMode && !ticketId
            ? t("bookingConfirmation.ticketInfoMissing")
            : !baySlotId || isMissingRequiredData
                ? t("bookingConfirmation.selectedBayUnavailable")
                : isBaySlotDisabled
                    ? t("bookingConfirmation.selectedBayUnavailable")
                    : null;

    return (
        <Screen
            keyboardAware
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
                    <BookingConfirmationFooter
                        title={isRescheduleMode
                            ? t("bookingConfirmation.confirmReschedule")
                            : t("bookingConfirmation.agreeBook")}
                        loading={isSubmitting}
                        disabled={isDisabled}
                        onPress={handleConfirm}
                    />
                ) : null
            }
        >
            {isLoading ? (
                <BookingConfirmationLoadingState fieldCount={3} />
            ) : isError ? (
                <ErrorState
                    title={t("bookingConfirmation.failedReservationDetailsTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : isMissingRequiredData ? (
                <EmptyState
                    title={t("bookingConfirmation.selectedBayUnavailableTitle")}
                    message={t("bookingConfirmation.selectedBayUnavailableMessage")}
                    actionLabel={t("bookingConfirmation.chooseAnotherBay")}
                    onAction={() => {
                        router.back();
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
                </BookingConfirmationContent>
            )}
        </Screen>
    );
}
