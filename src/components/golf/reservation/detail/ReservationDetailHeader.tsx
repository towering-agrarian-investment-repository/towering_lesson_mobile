import { TicketTypeIcon } from "@/components/golf/TicketTypeIcon";
import { cn } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { colorWithOpacity } from "@/design-system/utils/color";
import { useTheme } from "@/design-system/utils/theme";
import { formatTicketTypeLabel, getTicketTypeTone } from "@/design-system/utils/ticket-type";
import { getReservationStatusColor, getReservationStatusLabel } from "@/utils/status-tone";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type ReservationDetailHeaderProps = {
    title: string;
    reservationStatus?: string | null;
    ticketType?: string | null;
};

export function ReservationDetailHeader({ title, reservationStatus, ticketType }: ReservationDetailHeaderProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const ticketTone = ticketType ? getTicketTypeTone(ticketType) : null;
    const typeLabel = ticketType ? formatTicketTypeLabel(ticketType, t) : null;
    const statusLabel = getReservationStatusLabel(reservationStatus, t);
    const statusColor = getReservationStatusColor(colors, reservationStatus);

    return (
        <View className="flex-col gap-2.5">
            {ticketTone || statusLabel !== "-" ? (
                <View className="flex-row items-center justify-between gap-2">
                    <View className="min-w-0 flex-1 flex-row items-center gap-2">
                        {ticketType && ticketTone ? (
                            <>
                                <View
                                    className={cn(
                                        "h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                                        ticketTone.badgeClassName,
                                    )}
                                >
                                    <TicketTypeIcon
                                        type={ticketType}
                                        size={15}
                                        color={colors[ticketTone.color]}
                                        strokeWidth={2.2}
                                    />
                                </View>
                                {typeLabel ? (
                                    <AppText
                                        variant="subtext"
                                        color="mutedForeground"
                                        numberOfLines={1}
                                        style={{ flex: 1, minWidth: 0 }}
                                        textStyle={{ fontWeight: "600" }}
                                    >
                                        {typeLabel}
                                    </AppText>
                                ) : null}
                            </>
                        ) : null}
                    </View>

                    {statusLabel !== "-" ? (
                        <View
                            className="shrink-0 rounded-md px-2.5 py-1"
                            style={{
                                backgroundColor: colorWithOpacity(statusColor, 0.12),
                            }}
                        >
                            <AppText
                                variant="badge"
                                wrap={false}
                                textStyle={{
                                    color: statusColor,
                                    fontWeight: "600",
                                }}
                            >
                                {statusLabel}
                            </AppText>
                        </View>
                    ) : null}
                </View>
            ) : null}

            <AppText variant="h2" textStyle={{ fontWeight: "700" }}>
                {title}
            </AppText>
        </View>
    );
}
