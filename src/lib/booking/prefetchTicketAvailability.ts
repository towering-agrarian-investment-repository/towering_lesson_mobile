import { getMemberBaySlotGroupsQueryOptions, getMemberTicketLessonSlotsQueryOptions } from "@/lib/hook/useReservation";
import type { MemberTicketSummaryResponse } from "@/types/member-ticket";
import { formatDateForAPI } from "@/utils/time-helper";
import { toAppTimeZoneDate } from "@/utils/timezone";
import type { QueryClient } from "@tanstack/react-query";
import { endOfMonth } from "date-fns/endOfMonth";
import { startOfMonth } from "date-fns/startOfMonth";

export function prefetchTicketAvailability(
    queryClient: QueryClient,
    ticket: Pick<MemberTicketSummaryResponse, "id" | "type">,
) {
    const today = toAppTimeZoneDate(new Date()) ?? new Date();

    if (ticket.type === "PRIVATE_LESSON" || ticket.type === "GROUP_LESSON") {
        void queryClient.prefetchQuery(
            getMemberTicketLessonSlotsQueryOptions(ticket.id, today.getFullYear(), today.getMonth() + 1),
        );
        return;
    }

    if (ticket.type === "BAY_USAGE" && Number.isSafeInteger(ticket.id) && ticket.id > 0) {
        void queryClient.prefetchQuery(
            getMemberBaySlotGroupsQueryOptions(
                ticket.id,
                formatDateForAPI(startOfMonth(today)),
                formatDateForAPI(endOfMonth(today)),
            ),
        );
    }
}
