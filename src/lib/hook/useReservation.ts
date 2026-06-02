import { cancelBayReservationById, createMemberBayReservation, getBayReservationById, getMemberBaySlotGroups } from "@/service/member-bay-reservation.service";
import { cancelLessonReservationById, createMemberLessonReservation, getLessonReservationById, getTicketLessonSlots } from "@/service/member-lesson-reservation.service";
import { getMemberReservations, getTodayMemberReservations, MEMBER_RESERVATION_CURSOR_PAGE_SIZE, MemberReservationType } from "@/service/reservation.service";
import { BaySlotGroupScheduleResponse, MemberBayReservationRequest, MemberBayReservationResponse } from "@/types/member-bay";
import { LessonAvailabilityResponse, MemberCreateLessonReservationRequest, MemberLessonReservationResponse } from "@/types/member-lesson";
import { MemberReservationDomain, MemberReservationResponse, MemberReservationSummaryResponse } from "@/types/member-reservation";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiResponse, CursorPageResponse, responseError, responseStatus } from "../api-response/api-response";


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



export function useMemberBaySlotGroups(startDate: string, endDate: string, enabled = true) {
    return useQuery<ApiResponse<BaySlotGroupScheduleResponse[]>>({
        queryKey: ["member", "bay-slot-groups", startDate, endDate],
        queryFn: () => getMemberBaySlotGroups(startDate, endDate),
        enabled: enabled && Boolean(startDate) && Boolean(endDate),
    });
}

export function useCreateMemberBayReservation() {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<MemberBayReservationResponse>,
        unknown,
        MemberBayReservationRequest
    >({
        mutationFn: createMemberBayReservation,
        onSuccess: (res) => {
            // responseStatus({ res });
            queryClient.invalidateQueries({ queryKey: ["member", "bay-slot-groups"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations"] });
        },
        onError: (error) => {
            // responseError({ error });
        },
    });
}


export function useCreateMemberLessonReservation() {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<MemberLessonReservationResponse>,
        unknown,
        MemberCreateLessonReservationRequest
    >({
        mutationFn: createMemberLessonReservation,
        onSuccess: (res) => {
            responseStatus({ res });
            queryClient.invalidateQueries({ queryKey: ["member", "ticket-lesson-slots"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations"] });
        },
        onError: (error) => {
            responseError({ error });
        },
    });
}


export function useMemberTicketLessonSlots(
    ticketId: number | null | undefined,
    year: number,
    month: number,
    enabled = true,
) {
    return useQuery<ApiResponse<LessonAvailabilityResponse[]>>({
        queryKey: ["member", "ticket-lesson-slots", ticketId, year, month],
        queryFn: () => getTicketLessonSlots(ticketId as number, year, month),
        enabled: enabled && Boolean(ticketId) && Boolean(year) && Boolean(month),
    });
}

export function useCancelMemberLessonReservation() {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<void>, unknown, number>({
        mutationFn: cancelLessonReservationById,
        onSuccess: (res, reservationId) => {
            responseStatus({ res });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations", "today"] });
            queryClient.invalidateQueries({
                queryKey: ["member", "reservations", "detail", "lesson", reservationId],
            });
            queryClient.invalidateQueries({
                queryKey: ["member", "reservations", "detail", "unknown", reservationId],
            });
        },
        onError: (error) => {
            responseError({ error });
        },
    });
}

export function useCancelMemberBayReservation() {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<void>, unknown, number>({
        mutationFn: cancelBayReservationById,
        onSuccess: (res, reservationId) => {
            responseStatus({ res });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations", "today"] });
            queryClient.invalidateQueries({
                queryKey: ["member", "reservations", "detail", "bay", reservationId],
            });
            queryClient.invalidateQueries({
                queryKey: ["member", "reservations", "detail", "unknown", reservationId],
            });
        },
        onError: (error) => {
            responseError({ error });
        },
    });
}
