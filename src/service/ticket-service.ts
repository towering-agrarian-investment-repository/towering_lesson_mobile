import { ApiResponse, CursorPageResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import { TicketListItemResponse } from "@/types/member-ticket";

export const MEMBER_TICKET_PAGE_SIZE = 20;

export const getMemberTickets = async (
    memberId: number,
    params: { statuses?: readonly string[]; cursor?: string; limit?: number } = {},
    signal?: AbortSignal,
): Promise<ApiResponse<CursorPageResponse<TicketListItemResponse>>> => {
    const searchParams = new URLSearchParams({
        limit: String(params.limit ?? MEMBER_TICKET_PAGE_SIZE),
    });

    for (const status of params.statuses ?? []) {
        searchParams.append("statuses", status);
    }

    if (params.cursor) searchParams.set("cursor", params.cursor);

    return apiClient(
        `/member/${memberId}/tickets?${searchParams.toString()}`,
        { method: "GET", signal }
    );
};
