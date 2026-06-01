import { ApiResponse, CursorPageResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import { MemberReservationCalendarResponse, MemberReservationResponse, MemberReservationSummaryResponse } from "@/types/member-reservation";


export type MemberReservationType = "all" | "bay" | "private" | "group" | "program";

export type MemberReservationHistoryParams = {
    type: MemberReservationType;
    cursor?: string;
    limit?: number;
};

export type MemberReservationCalendarParams = {
    type: MemberReservationType;
    from: string;
    to: string;
};

export const MEMBER_RESERVATION_CURSOR_PAGE_SIZE = 20;

export async function getMemberReservations({
    type,
    cursor,
    limit = MEMBER_RESERVATION_CURSOR_PAGE_SIZE,
}: MemberReservationHistoryParams): Promise<
    ApiResponse<CursorPageResponse<MemberReservationResponse>>
> {
    const params = new URLSearchParams({
        type,
        limit: String(limit),
    });

    if (cursor) {
        params.set("cursor", cursor);
    }

    return apiClient(`/member/reservations?${params.toString()}`, {
        method: "GET",
    });
}

export async function getMemberReservationCalendar({
    type,
    from,
    to,
}: MemberReservationCalendarParams): Promise<ApiResponse<MemberReservationCalendarResponse[]>> {
    const params = new URLSearchParams({
        type,
        from,
        to,
    });

    return apiClient(`/member/reservations/calendar?${params.toString()}`, {
        method: "GET",
    });
}

export async function getTodayMemberReservations(): Promise<
    ApiResponse<MemberReservationSummaryResponse[]>
> {
    return apiClient("/member/reservations/today", {
        method: "GET",
    });
}
