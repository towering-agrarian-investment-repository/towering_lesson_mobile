import { getMemberTickets, MEMBER_TICKET_PAGE_SIZE } from "@/service/ticket-service";
import { TicketListItemResponse } from "@/types/member-ticket";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ApiResponse, CursorPageResponse } from "../api-response/api-response";

const DEFAULT_TICKET_STATUSES = ["ACTIVE", "IN_USE"];


export function getMemberTicketsQueryOptions(
    memberId?: number,
    statuses?: readonly string[],
    limit = MEMBER_TICKET_PAGE_SIZE,
) {
    const resolvedStatuses = statuses ?? DEFAULT_TICKET_STATUSES;

    return {
        queryKey: ["member", "tickets", memberId, resolvedStatuses, limit] as const,
        initialPageParam: null as string | null,
        queryFn: ({ pageParam, signal }: { pageParam: string | null; signal: AbortSignal }) =>
            getMemberTickets(memberId!, {
                statuses: resolvedStatuses,
                cursor: pageParam ?? undefined,
                limit,
            }, signal),
        getNextPageParam: (lastPage: ApiResponse<CursorPageResponse<TicketListItemResponse>>) =>
            lastPage.data.hasMore ? lastPage.data.nextCursor ?? undefined : undefined,
        enabled: Boolean(memberId),
        staleTime: 60_000,
    };
}

export function useMemberTickets(
    memberId?: number,
    statuses?: readonly string[],
    limit = MEMBER_TICKET_PAGE_SIZE,
) {
    return useInfiniteQuery<
        ApiResponse<CursorPageResponse<TicketListItemResponse>>,
        Error,
        { items: TicketListItemResponse[] },
        ReturnType<typeof getMemberTicketsQueryOptions>["queryKey"],
        string | null
    >({
        ...getMemberTicketsQueryOptions(memberId, statuses, limit),
        select: (data) => ({ items: data.pages.flatMap((page) => page.data.items) }),
    });
}

export function useMemberTicketById(memberId?: number, ticketId?: number) {
    return useQuery({
        queryKey: ["member", "tickets", "by-id", memberId, ticketId],
        enabled: Boolean(memberId) && Number.isSafeInteger(ticketId) && (ticketId ?? 0) > 0,
        staleTime: 60_000,
        queryFn: async ({ signal }) => {
            let cursor: string | undefined;
            while (true) {
                const response = await getMemberTickets(memberId!, { cursor, limit: 100 }, signal);
                const ticket = response.data.items.find((item) => item.id === ticketId);
                if (ticket) return ticket;
                if (!response.data.hasMore || !response.data.nextCursor) return null;
                cursor = response.data.nextCursor;
            }
        },
    });
}
