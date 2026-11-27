import { isBookableTicketType } from "@/design-system/utils/ticket-type";
import type { MemberBayReservationResponse } from "@/types/member-bay";
import type { MemberTicketSummaryResponse } from "@/types/member-ticket";
import { getEffectiveTicketStatus, getTicketStatusGroup } from "@/utils/status-tone";

type BookingTicket = Pick<
    MemberTicketSummaryResponse,
    "status" | "type" | "fullyUsed" | "isUnlimited" | "remainingCount"
>;

export function canBookWithTicket(ticket?: BookingTicket | null): boolean {
    return (
        !!ticket &&
        getTicketStatusGroup(ticket.status, ticket.fullyUsed) === "active" &&
        isBookableTicketType(ticket.type) &&
        (ticket.isUnlimited || ticket.remainingCount > 0)
    );
}

export function canRescheduleBayReservation(
    reservation: Pick<MemberBayReservationResponse, "reservationStatus" | "isCancellable" | "ticket">,
): boolean {
    return (
        reservation.reservationStatus === "RESERVED" &&
        reservation.isCancellable &&
        Boolean(reservation.ticket?.id) &&
        getEffectiveTicketStatus(reservation.ticket?.status) !== "REFUNDED"
    );
}
