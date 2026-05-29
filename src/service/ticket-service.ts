import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import { TicketListItemResponse } from "@/types/member-ticket";

export const getMemberTickets = async (
    memberId: number,
    statuses?: string[],
): Promise<ApiResponse<TicketListItemResponse[]>> => {
    const searchParams = new URLSearchParams();

    for (const status of statuses ?? []) {
        searchParams.append("statuses", status);
    }

    const query = searchParams.toString();

    return apiClient(
        `/member/${memberId}/tickets${query ? `?${query}` : ""}`,
        { method: "GET" }
    );
};