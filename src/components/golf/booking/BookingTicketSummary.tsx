import { AppText, Badge, Card, Skeleton } from "@/design-system";
import {
    formatTicketTypeLabel,
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import type { TicketListItemResponse } from "@/types/member-ticket";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type ReservationTicket = {
    id: number;
    name: string;
    type: string | null;
};

type BookingTicketSummaryProps = {
    reservationTicket: ReservationTicket | null;
    ticket?: TicketListItemResponse;
    loading: boolean;
    hasError: boolean;
    variant?: "card" | "flat";
    showTypeBadge?: boolean;
    usageDisplay?: "full" | "remaining";
};

type BookingTicketSummaryContentProps = Omit<
    BookingTicketSummaryProps,
    "reservationTicket" | "variant"
> & {
    reservationTicket: ReservationTicket;
};

function BookingTicketSummaryContent({
    reservationTicket,
    ticket,
    loading,
    hasError,
    showTypeBadge,
    usageDisplay,
}: BookingTicketSummaryContentProps) {
    const { t } = useTranslation();
    const ticketType = ticket?.type ?? reservationTicket.type;
    const ticketTone = ticketType ? getTicketTypeTone(ticketType) : null;

    return (
        <>
            <AppText variant="caption" className="font-semibold text-muted-foreground">
                {t("bookingConfirmation.ticketLabel")}
            </AppText>

            <View className="flex-row items-center justify-between gap-3">
                <AppText
                    variant="label"
                    selectable
                    className="min-w-0 flex-1 text-base font-bold text-foreground"
                    numberOfLines={2}
                >
                    {ticket?.name ?? reservationTicket.name}
                </AppText>

                {showTypeBadge && ticketType && ticketTone ? (
                    <Badge
                        label={formatTicketTypeLabel(ticketType)}
                        className={`${ticketTone.badgeClassName} px-2 py-0.5`}
                        textClassName={`${ticketTone.badgeTextClassName} text-xs font-semibold leading-4`}
                    />
                ) : null}
            </View>

            {loading ? (
                <View className="gap-2">
                    <Skeleton className="h-4 w-32 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded-full" />
                </View>
            ) : ticket ? (
                ticket.isUnlimited ? (
                    <AppText variant="caption" selectable className="text-muted-foreground">
                        {t("tickets.unlimitedUsage")}
                    </AppText>
                ) : ticket.totalCount != null && usageDisplay === "remaining" ? (
                    <AppText
                        variant="body"
                        selectable
                        className="font-semibold text-foreground"
                        style={{ fontVariant: ["tabular-nums"] }}
                    >
                        {t("tickets.remainingBalance", {
                            remaining: ticket.remainingCount,
                        })}
                    </AppText>
                ) : ticket.totalCount != null ? (
                    <View className="gap-1">
                        <AppText
                            variant="body"
                            selectable
                            className="font-semibold text-foreground"
                            style={{ fontVariant: ["tabular-nums"] }}
                        >
                            {t("tickets.usage", {
                                used: ticket.usedCount,
                                total: ticket.totalCount,
                            })}
                        </AppText>
                        <AppText
                            variant="caption"
                            selectable
                            className="text-muted-foreground"
                            style={{ fontVariant: ["tabular-nums"] }}
                        >
                            {t("tickets.usageRemaining", {
                                remaining: ticket.remainingCount,
                                total: ticket.totalCount,
                            })}
                        </AppText>
                    </View>
                ) : (
                    <AppText variant="caption" selectable className="text-muted-foreground">
                        {t("tickets.flexibleUsage")}
                    </AppText>
                )
            ) : hasError ? (
                <AppText variant="caption" selectable className="text-muted-foreground">
                    {t("tickets.loadError")}
                </AppText>
            ) : null}
        </>
    );
}

export function BookingTicketSummary({
    reservationTicket,
    ticket,
    loading,
    hasError,
    variant = "card",
    showTypeBadge = true,
    usageDisplay = "full",
}: BookingTicketSummaryProps) {
    if (!reservationTicket) {
        return null;
    }

    const content = (
        <BookingTicketSummaryContent
            reservationTicket={reservationTicket}
            ticket={ticket}
            loading={loading}
            hasError={hasError}
            showTypeBadge={showTypeBadge}
            usageDisplay={usageDisplay}
        />
    );

    if (variant === "flat") {
        return <View className="gap-3 py-1">{content}</View>;
    }

    return <Card className="gap-3 p-4">{content}</Card>;
}
