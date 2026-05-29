import { getMemberTickets } from "@/service/ticket-service";
import { TicketListItemResponse } from "@/types/member-ticket";
import { useQuery } from "@tanstack/react-query";
import { ApiResponse } from "../api-response/api-response";

const DEFAULT_TICKET_STATUSES = ["ACTIVE", "IN_USE"];


export function useMemberTickets(
    memberId?: number,
    statuses?: string[],

) {
    const resolvedStatuses = statuses ?? DEFAULT_TICKET_STATUSES;

    return useQuery<ApiResponse<TicketListItemResponse[]>>({
        queryKey: ["member", "tickets", memberId, resolvedStatuses],
        queryFn: () => getMemberTickets(memberId!, resolvedStatuses),
        enabled: Boolean(memberId),
    });
}