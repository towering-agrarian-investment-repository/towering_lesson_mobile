import {
    getMemberTicketById,
    getMemberTickets,
    MEMBER_TICKET_PAGE_SIZE,
    type MemberTicketFilters,
} from "@/service/ticket-service";
import type { MemberTicketDetailResponse, MemberTicketSummaryResponse } from "@/types/member-ticket";
import type { TicketType } from "@/types/member.type";
import {
    type InfiniteData,
    type QueryClient,
    queryOptions,
    skipToken,
    useInfiniteQuery,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { ApiResponse, CursorPageResponse } from "../api-response/api-response";

export const MY_TICKET_TYPES: readonly TicketType[] = [
    "BAY_USAGE",
    "PRIVATE_LESSON",
    "GROUP_LESSON",
    "LOCATION",
    "OTHER",
];

export function getMemberTicketsQueryOptions({
    history,
    types,
    limit = MEMBER_TICKET_PAGE_SIZE,
}: MemberTicketFilters = {}) {
    const ticketTypes = types?.length ? types : undefined;

    return {
        queryKey: ["member", "tickets", history, limit, ticketTypes] as const,
        initialPageParam: null as string | null,
        queryFn: ({ pageParam, signal }: { pageParam: string | null; signal: AbortSignal }) =>
            getMemberTickets(
                {
                    history,
                    types: ticketTypes,
                    cursor: pageParam ?? undefined,
                    limit,
                },
                signal,
            ),
        getNextPageParam: (lastPage: ApiResponse<CursorPageResponse<MemberTicketSummaryResponse>>) =>
            lastPage.data.hasMore ? (lastPage.data.nextCursor ?? undefined) : undefined,
        staleTime: 60_000,
    };
}

export function useMemberTickets(filters?: MemberTicketFilters, enabled = true) {
    const options = getMemberTicketsQueryOptions(filters);
    return useInfiniteQuery<
        ApiResponse<CursorPageResponse<MemberTicketSummaryResponse>>,
        Error,
        { items: MemberTicketSummaryResponse[] },
        ReturnType<typeof getMemberTicketsQueryOptions>["queryKey"],
        string | null
    >({
        ...options,
        enabled,
        select: (data) => ({ items: data.pages.flatMap((page) => page.data.items) }),
    });
}

export function getMemberTicketByIdQueryOptions(ticketId?: number) {
    const enabled = ticketId !== undefined && Number.isSafeInteger(ticketId) && ticketId > 0;
    return queryOptions({
        queryKey: ["member", "tickets", "by-id", ticketId] as const,
        queryFn: enabled ? ({ signal }) => getMemberTicketById(ticketId, signal) : skipToken,
        enabled,
        staleTime: 60_000,
    });
}

function findCachedMemberTicket(
    queryClient: QueryClient,
    ticketId: number,
): ApiResponse<MemberTicketDetailResponse> | undefined {
    const lists = queryClient.getQueriesData<
        InfiniteData<ApiResponse<CursorPageResponse<MemberTicketSummaryResponse>>>
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
    const options = getMemberTicketByIdQueryOptions(ticketId);

    return useQuery({
        ...options,
        placeholderData: () =>
            options.enabled && ticketId !== undefined ? findCachedMemberTicket(queryClient, ticketId) : undefined,
        select: (response) => response.data,
    });
}
