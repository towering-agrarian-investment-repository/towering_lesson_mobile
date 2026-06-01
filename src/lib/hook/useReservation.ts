import { getBayReservationById } from "@/service/member-bay-reservation.service";
import { getLessonReservationById } from "@/service/member-lesson-reservation.service";
import { getMemberReservations, getTodayMemberReservations, MEMBER_RESERVATION_CURSOR_PAGE_SIZE, MemberReservationType } from "@/service/reservation.service";
import { MemberBayReservationResponse } from "@/types/member-bay";
import { MemberLessonReservationResponse } from "@/types/member-lesson";
import { MemberReservationDomain, MemberReservationResponse, MemberReservationSummaryResponse } from "@/types/member-reservation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ApiResponse, CursorPageResponse } from "../api-response/api-response";


export type MemberReservationDetailResponse =
    | MemberLessonReservationResponse
    | MemberBayReservationResponse;


export function useMemberReservations(type: MemberReservationType) {
    return useInfiniteQuery<
        ApiResponse<CursorPageResponse<MemberReservationResponse>>,
        Error,
        {
            items: MemberReservationResponse[];
            hasMore: boolean;
        },
        ["member", "reservations", MemberReservationType],
        string | null
    >({
        queryKey: ["member", "reservations", type],
        initialPageParam: null,
        queryFn: ({ pageParam }) =>
            getMemberReservations({
                type,
                cursor: pageParam ?? undefined,
                limit: MEMBER_RESERVATION_CURSOR_PAGE_SIZE,
            }),
        getNextPageParam: (lastPage) => {
            const page = lastPage.data;
            return page?.hasMore ? page.nextCursor : undefined;
        },
        select: (data) => ({
            items: data.pages.flatMap((page) => page.data?.items ?? []),
            hasMore: data.pages[data.pages.length - 1]?.data?.hasMore ?? false,
        }),
    });
}


export function useTodayMemberReservations() {
    return useQuery<
        ApiResponse<MemberReservationSummaryResponse[]>,
        Error,
        MemberReservationSummaryResponse[]
    >({
        queryKey: ["member", "reservations", "today"],
        queryFn: getTodayMemberReservations,
        select: (response) => response.data ?? [],
    });
}

export function useMemberReservationById(id: number, domain?: MemberReservationDomain) {
    return useQuery<ApiResponse<MemberReservationDetailResponse>>({
        queryKey: ["member", "reservations", "detail", domain ?? "unknown", id],
        queryFn: async () => {
            if (domain === "bay") {
                return getBayReservationById(id);
            }

            if (domain === "lesson") {
                return getLessonReservationById(id);
            }

            const [lessonResult, bayResult] = await Promise.allSettled([
                getLessonReservationById(id),
                getBayReservationById(id),
            ]);

            if (lessonResult.status === "fulfilled") {
                return lessonResult.value;
            }

            if (bayResult.status === "fulfilled") {
                return bayResult.value;
            }

            throw lessonResult.reason ?? bayResult.reason ?? new Error("Failed to load reservation");
        },
        enabled: Number.isFinite(id) && id > 0,
    });
}