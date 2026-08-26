import { getMemberTickets } from "@/service/ticket-service";
import { TicketListItemResponse } from "@/types/member-ticket";
import { useQuery } from "@tanstack/react-query";
import { ApiResponse } from "../api-response/api-response";

const DEFAULT_TICKET_STATUSES = ["ACTIVE", "IN_USE"];


export function getMemberTicketsQueryOptions(
    memberId?: number,
    statuses?: string[],
) {
    const resolvedStatuses = statuses ?? DEFAULT_TICKET_STATUSES;

    return {
        queryKey: ["member", "tickets", memberId, resolvedStatuses],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
            getMemberTickets(memberId!, resolvedStatuses, signal),
        enabled: Boolean(memberId),
        staleTime: 60_000,
    };
}

export function useMemberTickets(
    memberId?: number,
    statuses?: string[],
) {
    return useQuery<ApiResponse<TicketListItemResponse[]>>(
        getMemberTicketsQueryOptions(memberId, statuses),
    );
}
