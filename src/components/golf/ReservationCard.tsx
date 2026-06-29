import {
    AppText,
    Card,
    Divider,
    getPressedScaleStyle,
    useThemeColors,
} from "@/design-system";
import {
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import type {
    MemberReservationResponse,
    MemberReservationSummaryResponse,
} from "@/types/member-reservation";
import { fmtTime } from "@/utils/time-helper";
import { format, isToday } from "date-fns";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

type Props = {
    reservation: MemberReservationResponse | MemberReservationSummaryResponse;
    disabled?: boolean;
    onPress?: (
        reservation: MemberReservationResponse | MemberReservationSummaryResponse,
    ) => void;
};

function ReservationCard({ reservation, disabled = false, onPress }: Props) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const startDate = new Date(reservation.startTime);
    const endDate = new Date(reservation.endTime);
    const tone = getTicketTypeTone(reservation.ticketType);
    const isTodayReservation = isToday(startDate);

    const title =
        reservation.bayName ??
        reservation.lessonAvailabilityName ??
        reservation.lessonProgramGroupName ??
        reservation.lessonProgramName ??
        t("reservations.reservationFallbackWithId", { id: reservation.id });
    const reservationDateLabel = format(startDate, "EEE, MMM d");

    const handlePress = () => {
        if (disabled) {
            return;
        }

        onPress?.(reservation);
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={({ pressed }) => getPressedScaleStyle(pressed, disabled, 0.99)}
        >
            <Card
                className={`flex-col gap-3 overflow-hidden rounded-2xl p-5 ${
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
                            {t("reservations.timeLabel")}
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

                    <View className="h-9 w-9 items-center justify-center rounded-full bg-muted">
                        <ChevronRight
                            size={18}
                            color={tone.name === "default" ? colors.mutedForeground : colors.foreground}
                            strokeWidth={2.3}
                        />
                    </View>
                </View>
            </Card>
        </Pressable>
    );
}

function areReservationCardsEqual(prev: Props, next: Props) {
    const previousReservation = prev.reservation;
    const nextReservation = next.reservation;

    return (
        prev.disabled === next.disabled &&
        prev.onPress === next.onPress &&
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
