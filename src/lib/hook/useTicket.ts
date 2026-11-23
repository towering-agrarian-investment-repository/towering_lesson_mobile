import { getMemberTicketById, getMemberTickets, MEMBER_TICKET_PAGE_SIZE } from "@/service/ticket-service";
import type { TicketDetailResponse, TicketListItemResponse } from "@/types/member-ticket";
import { type InfiniteData, type QueryClient, useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiResponse, CursorPageResponse } from "../api-response/api-response";

const DEFAULT_TICKET_STATUSES = ["ACTIVE", "IN_USE"];


export function getMemberTicketsQueryOptions(
    statuses?: readonly string[],
    limit = MEMBER_TICKET_PAGE_SIZE,
) {
    const resolvedStatuses = statuses ?? DEFAULT_TICKET_STATUSES;

    return {
        queryKey: ["member", "tickets", resolvedStatuses, limit] as const,
        initialPageParam: null as string | null,
        queryFn: ({ pageParam, signal }: { pageParam: string | null; signal: AbortSignal }) =>
            getMemberTickets({
                statuses: resolvedStatuses,
                cursor: pageParam ?? undefined,
                limit,
            }, signal),
        getNextPageParam: (lastPage: ApiResponse<CursorPageResponse<TicketListItemResponse>>) =>
            lastPage.data.hasMore ? lastPage.data.nextCursor ?? undefined : undefined,
        staleTime: 60_000,
    };
}

export function useMemberTickets(
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
        ...getMemberTicketsQueryOptions(statuses, limit),
        placeholderData: (previousData, previousQuery) =>
            previousQuery?.queryKey[3] === limit ? previousData : undefined,
        select: (data) => ({ items: data.pages.flatMap((page) => page.data.items) }),
    });
}

export function getMemberTicketByIdQueryOptions(ticketId: number) {
    return {
        queryKey: ["member", "tickets", "by-id", ticketId] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
            getMemberTicketById(ticketId, signal),
        staleTime: 60_000,
    };
}

function findCachedMemberTicket(
    queryClient: QueryClient,
    ticketId: number,
): ApiResponse<TicketDetailResponse> | undefined {
    const lists = queryClient.getQueriesData<
        InfiniteData<ApiResponse<CursorPageResponse<TicketListItemResponse>>>
    >({
        queryKey: ["member", "tickets"],
        predicate: (query) => query.queryKey[2] !== "by-id",
    });

    for (const [, list] of lists) {
        for (const page of list?.pages ?? []) {
            const ticket = page.data.items.find((item) => item.id === ticketId);
            if (ticket) {
                return { status: page.status, data: ticket };
            }
        }
    }

    return undefined;
}

export function useMemberTicketById(ticketId?: number) {
    const queryClient = useQueryClient();
    const isEnabled = Number.isSafeInteger(ticketId) && (ticketId as number) > 0;

    return useQuery<
        ApiResponse<TicketDetailResponse>,
        Error,
        TicketDetailResponse
    >({
        queryKey: ["member", "tickets", "by-id", ticketId] as const,
        queryFn: ({ signal }) => getMemberTicketById(ticketId!, signal),
        enabled: isEnabled,
        staleTime: 60_000,
        placeholderData: () =>
            isEnabled ? findCachedMemberTicket(queryClient, ticketId!) : undefined,
        select: (response) => response.data,
    });
}
