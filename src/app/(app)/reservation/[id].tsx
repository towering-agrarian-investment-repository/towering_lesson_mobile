import {
    BayReservationNoteFooter,
    BayReservationNoteForm,
    BayReservationNoteRow,
    useBayReservationNoteEditor,
} from "@/components/golf/reservation/BayReservationNoteEditor";
import { ReservationContent } from "@/components/golf/reservation/ReservationSections";
import { ReservationCancelSheet } from "@/components/golf/reservation/detail/ReservationCancelSheet";
import { ReservationCoachAvatar } from "@/components/golf/reservation/detail/ReservationCoachAvatar";
import { ReservationDetailHeader } from "@/components/golf/reservation/detail/ReservationDetailHeader";
import { ReservationDetailRow } from "@/components/golf/reservation/detail/ReservationDetailRow";
import { ReservationPreviewView } from "@/components/golf/reservation/detail/ReservationPreviewView";
import {
    getReservationPolicies,
    getReservationTitle,
    isBayReservationDetail,
    isLessonReservationDetail,
    isReservationDomain,
} from "@/components/golf/reservation/detail/reservation-detail-utils";
import { ActionButton, Divider, EmptyState, ErrorState, Screen, Skeleton, triggerSuccessHaptic } from "@/design-system";
import { prefetchTicketAvailability } from "@/lib/booking/prefetchTicketAvailability";
import { canRescheduleBayReservation } from "@/lib/booking/ticket-eligibility";
import { useIsOnline } from "@/lib/hook/useIsOnline";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
    useCancelMemberBayReservation,
    useCancelMemberLessonReservation,
    useMemberReservationById,
} from "@/lib/hook/useReservation";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { getEffectiveTicketStatus } from "@/utils/status-tone";
import { formatDateForDisplay, formatTimeRange } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import { Href, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

type ReservationParams = {
    id: string;
    type?: string;
};

export default function ReservationDetailScreen() {
    const { t } = useTranslation();
    const isOnline = useIsOnline();
    const { id, type } = useLocalSearchParams<ReservationParams>();

    const [isCancelSheetVisible, setIsCancelSheetVisible] = useState(false);
    const cancelLocked = useRef(false);
    const router = useRouter();
    const navigation = useNavigation();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();

    const reservationType = isReservationDomain(type) ? type : undefined;

    const { data, isLoading, isError, refetch, isRefetching } = useMemberReservationById(Number(id), reservationType);
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        refetch({ cancelRefetch: false }),
    );

    const reservation = data?.data;
    const bayReservationDetail =
        reservation && !("isListPreview" in reservation) && isBayReservationDetail(reservation) ? reservation : null;

    const { mutate: cancelLessonReservation, isPending: isCancellingLesson } = useCancelMemberLessonReservation();

    const { mutate: cancelBayReservation, isPending: isCancellingBay } = useCancelMemberBayReservation();
    const noteEditor = useBayReservationNoteEditor({
        reservation: bayReservationDetail,
        enabled: type === "bay",
        isOnline,
        disabled: isCancellingBay,
        requireCanEditFlag: true,
    });

    if (isLoading) {
        return (
            <Screen contentClassName="flex-col gap-6">
                <View className="flex-col gap-4">
                    <Skeleton className="h-8 w-2/3 rounded-xl" />
                    <Skeleton className="h-6 w-1/3 rounded-full" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                </View>

                <View className="flex-col gap-4">
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton key={index} className="h-16 w-full rounded-xl" />
                    ))}
                </View>
            </Screen>
        );
    }

    if (isError && (!data || "isListPreview" in data.data)) {
        return (
            <Screen
                contentClassName="grow"
                bottomPadding={16}
                refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
            >
                <ErrorState
                    title={t("reservations.failedDetailTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </Screen>
        );
    }

    if (reservation && "isListPreview" in reservation) {
        return <ReservationPreviewView preview={reservation} />;
    }

    if (!reservation) {
        return (
            <Screen
                contentClassName="grow"
                bottomPadding={16}
                refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
            >
                <EmptyState
                    title={t("reservations.notAvailableTitle")}
                    message={reservationType ? t("reservations.notFoundMessage") : t("reservations.typeMissingMessage")}
                    actionLabel={t("navigation.screens.myReservations")}
                    onAction={() => {
                        runWithNavigationLock(() => {
                            router.dismissTo("/reservation");
                        });
                    }}
                />
            </Screen>
        );
    }

    const isBayReservation = isBayReservationDetail(reservation);
    const lessonReservation = isLessonReservationDetail(reservation) ? reservation : null;
    const isProgramReservation = lessonReservation?.lessonProgramEnrollmentId != null;
    const reservationTicket = reservation.ticket;
    const isRefundedTicket = getEffectiveTicketStatus(reservationTicket?.status) === "REFUNDED";
    const ticketDetailsId = isRefundedTicket ? undefined : reservationTicket?.id;

    const canCancelReservation = reservation.reservationStatus === "RESERVED" && reservation.isCancellable;
    const canRescheduleReservation = isBayReservation && canRescheduleBayReservation(reservation);
    const isCancelling = isBayReservation ? isCancellingBay : isCancellingLesson;
    const isCancelDisabled = !isOnline || !canCancelReservation || isCancelling || noteEditor.isSavingNote;
    const isRescheduleDisabled = !isOnline || isLocked || noteEditor.isSavingNote;

    const title = getReservationTitle(reservation, t);
    const dateValue = formatDateForDisplay(reservation.startTime) || "-";
    const timeValue = formatTimeRange(reservation.startTime, reservation.endTime);
    const lessonNameValue = isProgramReservation ? lessonReservation.lessonName?.trim() || "-" : null;

    const programValue = isBayReservation
        ? "-"
        : [lessonReservation?.lessonProgramName, lessonReservation?.lessonProgramGroupName]
              .filter(Boolean)
              .join(" / ") || "-";

    const coachName = isBayReservation ? "-" : lessonReservation?.coach?.name?.trim() || "-";

    const noteValue = reservation.memberNotes?.trim();

    const reservationPolicies = getReservationPolicies(t);
    const policies = isBayReservation ? reservationPolicies.bay : reservationPolicies.lesson;

    const lessonDetailsHref =
        !isBayReservation && lessonReservation?.lessonId != null && lessonReservation?.lessonProgramGroupId != null
            ? {
                  pathname: "/groups/[groupId]/lessons/[lessonId]",
                  params: {
                      groupId: String(lessonReservation.lessonProgramGroupId),
                      lessonId: String(lessonReservation.lessonId),
                  },
              }
            : null;
    const lessonLogHref =
        !isBayReservation && lessonReservation?.lessonLog?.id != null
            ? {
                  pathname: "/lesson-log/[id]",
                  params: {
                      id: String(lessonReservation.lessonLog.id),
                  },
              }
            : null;
    const lessonLogValue = isBayReservation
        ? ""
        : lessonReservation?.lessonLog?.name?.trim() || t("reservations.viewLessonPost");

    const handleCancelReservation = () => {
        if (isCancelDisabled) {
            return;
        }

        setIsCancelSheetVisible(true);
    };

    const handleRescheduleReservation = () => {
        if (isRescheduleDisabled || !canRescheduleReservation || !reservation.ticket?.id) {
            return;
        }

        prefetchTicketAvailability(queryClient, reservation.ticket);
        runWithNavigationLock(() => {
            router.push({
                pathname: "/select-date",
                params: {
                    ticketId: String(reservation.ticket.id),
                    ticketName: reservation.ticket.name,
                    ticketType: reservation.ticket.type,
                    mode: "reschedule",
                    reservationId: String(reservation.id),
                    notes: reservation.memberNotes ?? "",
                },
            });
        });
    };

    const confirmCancelReservation = () => {
        if (isCancelDisabled || cancelLocked.current) {
            return;
        }

        cancelLocked.current = true;
        if (isBayReservation) {
            cancelBayReservation(reservation.id, {
                onSuccess: handleCancellationSuccess,
                onSettled: () => {
                    cancelLocked.current = false;
                },
            });
            return;
        }

        cancelLessonReservation(reservation.id, {
            onSuccess: handleCancellationSuccess,
            onSettled: () => {
                cancelLocked.current = false;
            },
        });
    };

    const closeCancelSheet = () => {
        if (!cancelLocked.current) setIsCancelSheetVisible(false);
    };

    const handleCancellationSuccess = () => {
        setIsCancelSheetVisible(false);
        triggerSuccessHaptic();
        router.dismissTo("/reservation");
    };

    return (
        <>
            <ReservationCancelSheet
                isPresented={isCancelSheetVisible}
                isCancelling={isCancelling}
                isConfirmDisabled={isCancelDisabled}
                isOnline={isOnline}
                title={title}
                dateValue={dateValue}
                timeValue={timeValue}
                showRefundNote={Boolean(ticketDetailsId)}
                onConfirm={confirmCancelReservation}
                onDismiss={closeCancelSheet}
            />
            <Screen
                contentClassName="grow"
                keyboardAware={noteEditor.canEditNote}
                refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
                footer={
                    noteEditor.isNoteEditorOpen ? (
                        <BayReservationNoteFooter
                            control={noteEditor.control}
                            initialNote={noteEditor.initialNote}
                            isSaving={noteEditor.isSavingNote}
                            isActionDisabled={noteEditor.isEditTriggerDisabled}
                            onSave={noteEditor.submitNote}
                            onCancel={noteEditor.closeNoteEditor}
                        />
                    ) : canCancelReservation ? (
                        <View className="gap-2">
                            {canRescheduleReservation ? (
                                <ActionButton
                                    label={t("reservations.reschedule")}
                                    disabled={isRescheduleDisabled}
                                    haptic="selection"
                                    onPress={handleRescheduleReservation}
                                />
                            ) : null}

                            <ActionButton
                                label={t("reservations.cancelTitle")}
                                appearance="outlined"
                                tone="danger"
                                disabled={isCancelDisabled}
                                loading={isCancelling}
                                haptic="impact"
                                onPress={handleCancelReservation}
                            />
                        </View>
                    ) : null
                }
            >
                <View className="grow flex-col gap-6 bg-background">
                    <ReservationDetailHeader
                        title={title}
                        reservationStatus={reservation.reservationStatus}
                        ticketType={isProgramReservation ? "LESSON_PROGRAM" : reservation.ticket?.type}
                    />

                    <ReservationContent policies={policies}>
                        <ReservationDetailRow label={t("bookingConfirmation.dateLabel")} value={dateValue} />

                        <Divider className="bg-border" />

                        <ReservationDetailRow label={t("bookingConfirmation.timeLabel")} value={timeValue} />

                        {isBayReservation ? (
                            <>
                                <Divider className="bg-border" />
                                <ReservationDetailRow label={t("reservations.bayLabel")} value={title} />
                                {noteValue || noteEditor.canEditNote ? (
                                    <>
                                        <Divider className="bg-border" />
                                        {noteEditor.isNoteEditorOpen ? (
                                            <BayReservationNoteForm
                                                control={noteEditor.control}
                                                editable={!noteEditor.isSavingNote}
                                                showDisclaimer
                                            />
                                        ) : noteEditor.canEditNote ? (
                                            <BayReservationNoteRow
                                                value={noteValue}
                                                disabled={noteEditor.isEditTriggerDisabled}
                                                onPress={noteEditor.openNoteEditor}
                                            />
                                        ) : (
                                            <ReservationDetailRow
                                                label={t("bookingConfirmation.noteLabel")}
                                                value={noteValue || "-"}
                                            />
                                        )}
                                    </>
                                ) : null}
                            </>
                        ) : null}

                        {programValue !== "-" ? (
                            <>
                                <Divider className="bg-border" />
                                <ReservationDetailRow label={t("reservations.programLabel")} value={programValue} />
                            </>
                        ) : null}

                        {isBayReservation ? null : (
                            <>
                                <Divider className="bg-border" />
                                <ReservationDetailRow
                                    label={t("reservations.coachLabel")}
                                    value={coachName}
                                    leftElement={
                                        <ReservationCoachAvatar
                                            name={coachName}
                                            imageUrl={lessonReservation?.coach?.profileImage}
                                        />
                                    }
                                />
                            </>
                        )}

                        {lessonNameValue ? (
                            <>
                                <Divider className="bg-border" />
                                <ReservationDetailRow
                                    label={t("reservations.lessonLabel")}
                                    value={lessonNameValue}
                                    disabled={isLocked}
                                    onPress={
                                        lessonDetailsHref
                                            ? () => {
                                                  runWithNavigationLock(() => {
                                                      router.push(lessonDetailsHref as Href);
                                                  });
                                              }
                                            : undefined
                                    }
                                />
                            </>
                        ) : null}

                        {lessonLogHref ? (
                            <>
                                <Divider className="bg-border" />
                                <ReservationDetailRow
                                    label={t("reservations.lessonPostLabel")}
                                    value={lessonLogValue}
                                    disabled={isLocked}
                                    onPress={() => {
                                        runWithNavigationLock(() => {
                                            const routes = navigation.getState()?.routes ?? [];
                                            const previousRoute =
                                                routes.length >= 2 ? routes[routes.length - 2] : undefined;
                                            const previousParams = previousRoute?.params as
                                                { id?: string | number } | undefined;
                                            if (
                                                (previousRoute?.name === "lesson-log/[id]/index" ||
                                                    previousRoute?.name === "lesson-log/[id]") &&
                                                String(previousParams?.id) === lessonLogHref.params.id
                                            ) {
                                                router.back();
                                                return;
                                            }
                                            router.push(lessonLogHref as Href);
                                        });
                                    }}
                                />
                            </>
                        ) : null}

                        {reservationTicket?.name ? (
                            <>
                                <Divider className="bg-border" />
                                <ReservationDetailRow
                                    label={t("bookingConfirmation.ticketLabel")}
                                    value={reservationTicket.name}
                                    disabled={isLocked}
                                    onPress={
                                        ticketDetailsId
                                            ? () => {
                                                  runWithNavigationLock(() => {
                                                      router.push({
                                                          pathname: "/tickets/[id]",
                                                          params: { id: String(ticketDetailsId) },
                                                      });
                                                  });
                                              }
                                            : undefined
                                    }
                                />
                            </>
                        ) : null}

                        {!isBayReservation ? (
                            <>
                                <Divider className="bg-border" />
                                <ReservationDetailRow label={t("reservations.notesLabel")} value={noteValue || "-"} />
                            </>
                        ) : null}
                    </ReservationContent>
                </View>
            </Screen>
        </>
    );
}
