import { ApiResponse, CursorPageResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import type { MemberTicketDetailResponse, MemberTicketSummaryResponse } from "@/types/member-ticket";
import type { TicketType } from "@/types/member.type";

export const MEMBER_TICKET_PAGE_SIZE = 20;

export type MemberTicketFilters = {
    statuses?: readonly string[];
    types?: readonly TicketType[];
    limit?: number;
};

export const getMemberTickets = async (
    params: MemberTicketFilters & { cursor?: string } = {},
    signal?: AbortSignal,
): Promise<ApiResponse<CursorPageResponse<MemberTicketSummaryResponse>>> => {
    const searchParams = new URLSearchParams({
        limit: String(params.limit ?? MEMBER_TICKET_PAGE_SIZE),
    });

    for (const status of params.statuses ?? []) {
        searchParams.append("statuses", status);
    }

    for (const type of params.types ?? []) {
        searchParams.append("types", type);
    }

    if (params.cursor) searchParams.set("cursor", params.cursor);

    return apiClient<ApiResponse<CursorPageResponse<MemberTicketSummaryResponse>>>(
        `/member/tickets?${searchParams.toString()}`,
        { method: "GET", signal },
    );
};

export const getMemberTicketById = async (
    ticketId: number,
    signal?: AbortSignal,
): Promise<ApiResponse<MemberTicketDetailResponse>> => {
    return apiClient<ApiResponse<MemberTicketDetailResponse>>(`/member/tickets/${ticketId}`, {
        method: "GET",
        signal,
    });
};
