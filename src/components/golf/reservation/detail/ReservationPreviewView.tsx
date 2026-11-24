import { ReservationContent } from "@/components/golf/reservation/ReservationSections";
import type { MemberReservationDetailPreview } from "@/lib/hook/useReservation";
import { Divider, Screen, Skeleton } from "@/design-system";
import { formatDateForDisplay, formatTimeRange } from "@/utils/time-helper";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ReservationDetailHeader } from "./ReservationDetailHeader";
import { ReservationDetailRow } from "./ReservationDetailRow";
import { getReservationPolicies } from "./reservation-detail-utils";

export function ReservationPreviewView({ preview }: { preview: MemberReservationDetailPreview }) {
    const { t } = useTranslation();
    const reservation = preview.reservation;
    const isBayReservation = reservation.reservationType === "bay";
    const title =
        (isBayReservation
            ? reservation.bayName
            : (reservation.lessonAvailabilityName ??
              reservation.lessonProgramGroupName ??
              reservation.lessonProgramName)
        )?.trim() || t("common.notAvailable");
    const programValue = isBayReservation
        ? ""
        : [reservation.lessonProgramName, reservation.lessonProgramGroupName].filter(Boolean).join(" / ");
    const policies = getReservationPolicies(t);

    return (
        <Screen contentClassName="grow">
            <View className="grow flex-col gap-6 bg-background">
                <ReservationDetailHeader
                    title={title}
                    reservationStatus={reservation.reservationStatus}
                    ticketType={reservation.ticketType}
                />
                <ReservationContent policies={isBayReservation ? policies.bay : policies.lesson}>
                    <ReservationDetailRow
                        label={t("bookingConfirmation.dateLabel")}
                        value={formatDateForDisplay(reservation.startTime) || "-"}
                    />
                    <Divider className="bg-border" />
                    <ReservationDetailRow
                        label={t("bookingConfirmation.timeLabel")}
                        value={formatTimeRange(reservation.startTime, reservation.endTime)}
                    />
                    {isBayReservation ? (
                        <>
                            <Divider className="bg-border" />
                            <ReservationDetailRow label={t("reservations.bayLabel")} value={title} />
                        </>
                    ) : null}
                    {programValue ? (
                        <>
                            <Divider className="bg-border" />
                            <ReservationDetailRow label={t("reservations.programLabel")} value={programValue} />
                        </>
                    ) : null}
                    <Divider className="bg-border" />
                    <ReservationDetailRow
                        label={t("reservations.notesLabel")}
                        value={reservation.memberNotes?.trim() || "-"}
                    />
                    <View
                        className="gap-3 py-2"
                        accessibilityLiveRegion="polite"
                        accessibilityLabel={t("reservations.loadingDetail")}
                    >
                        <View className="flex-row items-center justify-between gap-4">
                            <Skeleton className="h-4 w-24 rounded-md" />
                            <Skeleton className="h-4 w-36 rounded-md" />
                        </View>
                        <View className="flex-row items-center justify-between gap-4">
                            <Skeleton className="h-4 w-20 rounded-md" />
                            <Skeleton className="h-4 w-28 rounded-md" />
                        </View>
                    </View>
                </ReservationContent>
            </View>
        </Screen>
    );
}
