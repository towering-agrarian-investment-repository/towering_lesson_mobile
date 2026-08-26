import {
    getMemberBaySlotGroupsQueryOptions,
    getMemberTicketLessonSlotsQueryOptions,
} from "@/lib/hook/useReservation";
import type { TicketListItemResponse } from "@/types/member-ticket";
import { formatDateForAPI } from "@/utils/time-helper";
import type { QueryClient } from "@tanstack/react-query";

export function prefetchTicketAvailability(
    queryClient: QueryClient,
    ticket: TicketListItemResponse,
) {
    const today = new Date();

    if (ticket.type === "PRIVATE_LESSON" || ticket.type === "GROUP_LESSON") {
        void queryClient.prefetchQuery(
            getMemberTicketLessonSlotsQueryOptions(
                ticket.id,
                today.getFullYear(),
                today.getMonth() + 1,
            ),
        );
        return;
    }

    if (ticket.type === "BAY_USAGE") {
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        void queryClient.prefetchQuery(
            getMemberBaySlotGroupsQueryOptions(
                formatDateForAPI(startDate),
                formatDateForAPI(endDate),
            ),
        );
    }
}
