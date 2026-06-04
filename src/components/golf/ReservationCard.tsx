import { AppText, Card, Divider } from "@/design-system";
import {
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import type {
    MemberReservationResponse,
    MemberReservationSummaryResponse,
} from "@/types/member-reservation";
import { fmtTime } from "@/utils/time-helper";
import { format, isToday } from "date-fns";
import { Link } from "expo-router";
import { memo } from "react";
import { Pressable, View } from "react-native";

type Props = {
    reservation: MemberReservationResponse | MemberReservationSummaryResponse;
};

function ReservationCard({ reservation }: Props) {
    const reservationKind = reservation.reservationType;
    const startDate = new Date(reservation.startTime);
    const endDate = new Date(reservation.endTime);
    const tone = getTicketTypeTone(reservation.ticketType);
    const isTodayReservation = isToday(startDate);

    const detailHref = {
        pathname: "/reservation/[id]",
        params: {
            id: String(reservation.id),
            type: reservationKind,
        },
    } as const;

    const title =
        reservation.bayName ??
        reservation.lessonAvailabilityName ??
        reservation.lessonProgramGroupName ??
        reservation.lessonProgramName ??
        `Reservation #${reservation.id}`;
    const reservationDateLabel = format(startDate, "EEE, MMM d");

    return (
        <Link href={detailHref} asChild>
            <Pressable className="active:bg-muted">
                <Card
                    className={`flex-col gap-3 overflow-hidden p-5 ${
                        isTodayReservation
                            ? tone.emphasisBorderClassName
                            : tone.borderClassName
                    }`}
                >
                    <View className="flex-row items-center gap-3">
                        <View className={`h-2.5 w-2.5 rounded-full ${tone.dotClassName}`} />

                        <AppText
                            variant="label"
                            className="min-w-0 flex-1 font-medium"
                            numberOfLines={1}
                        >
                            {title}
                        </AppText>

                    </View>

                    <Divider className="bg-border" />

                    <View className="flex-row items-center gap-3">
                        <ReservationDateBadge date={startDate} tone={tone} />

                        <View className="min-w-0 flex-1 flex-col gap-3">
                            <AppText variant="eyebrow" className="text-foreground/75">
                                Time
                            </AppText>

                            <AppText
                                variant="h3"
                                className="text-foreground"
                                numberOfLines={1}
                            >
                                {fmtTime(startDate)} - {fmtTime(endDate)}
                            </AppText>

                            <AppText
                                variant="meta"
                                className="text-foreground/75"
                                numberOfLines={1}
                            >
                                {reservationDateLabel}
                            </AppText>
                        </View>

                        <AppText className={`text-lg ${tone.iconClassName}`}>
                            {">"}
                        </AppText>
                    </View>
                </Card>
            </Pressable>
        </Link>
    );
}

function areReservationCardsEqual(prev: Props, next: Props) {
    const previousReservation = prev.reservation;
    const nextReservation = next.reservation;

    return (
        previousReservation.id === nextReservation.id &&
        previousReservation.reservationType === nextReservation.reservationType &&
        previousReservation.ticketType === nextReservation.ticketType &&
        previousReservation.startTime === nextReservation.startTime &&
        previousReservation.endTime === nextReservation.endTime &&
        previousReservation.bayName === nextReservation.bayName &&
        previousReservation.lessonAvailabilityName ===
            nextReservation.lessonAvailabilityName &&
        previousReservation.lessonProgramGroupName ===
            nextReservation.lessonProgramGroupName &&
        previousReservation.lessonProgramName === nextReservation.lessonProgramName
    );
}

function ReservationDateBadge({
    date,
    tone,
}: {
    date: Date;
    tone: ReturnType<typeof getTicketTypeTone>;
}) {
    return (
        <View
            className={`h-[82px] w-[72px] shrink-0 overflow-hidden rounded-lg border ${tone.borderClassName} ${tone.surfaceClassName}`}
        >
            <View className="flex-1 items-center justify-center px-2">
                <AppText
                    variant="badge"
                    className={tone.badgeTextClassName}
                    numberOfLines={1}
                >
                    {format(date, "MMM").toUpperCase()}
                </AppText>

                <AppText
                    variant="h2"
                    className={tone.badgeTextClassName}
                    numberOfLines={1}
                    style={{ fontVariant: ["tabular-nums"] }}
                >
                    {format(date, "dd")}
                </AppText>
            </View>
        </View>
    );
}

export default memo(ReservationCard, areReservationCardsEqual);
