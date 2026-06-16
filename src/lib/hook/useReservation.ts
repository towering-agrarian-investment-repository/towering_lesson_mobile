import {
    cancelBayReservationById,
    createMemberBayReservation,
    getBayReservationById,
    getMemberBaySlotGroups,
    rescheduleBayReservationById,
} from "@/service/member-bay-reservation.service";
import {
    cancelLessonReservationById,
    createMemberLessonReservation,
    getLessonReservationById,
    getTicketLessonSlots,
    rescheduleLessonReservationById,
} from "@/service/member-lesson-reservation.service";
import { getMemberReservations, getTodayMemberReservations, MEMBER_RESERVATION_CURSOR_PAGE_SIZE, MemberReservationType } from "@/service/reservation.service";
import {
    BaySlotGroupScheduleResponse,
    MemberBayReservationResponse,
    CreateBayReservationRequest,
    RescheduleBayReservationRequest,
} from "@/types/member-bay";
import {
    CreateLessonReservationRequest,
    MemberLessonReservationResponse,
    MemberLessonSlotResponse,
    RescheduleLessonReservationRequest,
} from "@/types/member-lesson";
import { MemberReservationDomain, MemberReservationResponse, MemberReservationSummaryResponse } from "@/types/member-reservation";
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiResponse, CursorPageResponse, responseError, responseStatus } from "../api-response/api-response";


export type MemberReservationDetailResponse =
    | MemberLessonReservationResponse
    | MemberBayReservationResponse;

type RescheduleMemberLessonReservationVariables = {
    reservationId: number;
    data: RescheduleLessonReservationRequest;
};

type RescheduleMemberBayReservationVariables = {
    reservationId: number;
    data: RescheduleBayReservationRequest;
};

export function getMemberBaySlotGroupsQueryOptions(startDate: string, endDate: string) {
    return {
        queryKey: ["member", "bay-slot-groups", startDate, endDate] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
            getMemberBaySlotGroups(startDate, endDate, signal),
    };
}

export function getMemberReservationsQueryOptions(type: MemberReservationType) {
    const queryKey: ["member", "reservations", MemberReservationType] = [
        "member",
        "reservations",
        type,
    ];

    return {
        queryKey,
        initialPageParam: null as string | null,
        queryFn: ({ pageParam, signal }: { pageParam: string | null; signal: AbortSignal }) =>
            getMemberReservations({
                type,
                cursor: pageParam ?? undefined,
                limit: MEMBER_RESERVATION_CURSOR_PAGE_SIZE,
            }, signal),
        getNextPageParam: (lastPage: ApiResponse<CursorPageResponse<MemberReservationResponse>>) => {
            const page = lastPage.data;
            return page?.hasMore ? page.nextCursor : undefined;
        },
    };
}

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
        ...getMemberReservationsQueryOptions(type),
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
        queryFn: ({ signal }) => getTodayMemberReservations(signal),
        select: (response) => response.data ?? [],
        staleTime: 30_000,
    });
}

export function getMemberReservationDetailQueryOptions(
    id: number,
    domain: "bay",
): {
    queryKey: readonly ["member", "reservations", "detail", "bay", number];
    queryFn: ({ signal }: { signal: AbortSignal }) => Promise<ApiResponse<MemberBayReservationResponse>>;
};
export function getMemberReservationDetailQueryOptions(
    id: number,
    domain: "lesson",
): {
    queryKey: readonly ["member", "reservations", "detail", "lesson", number];
    queryFn: ({ signal }: { signal: AbortSignal }) => Promise<ApiResponse<MemberLessonReservationResponse>>;
};
export function getMemberReservationDetailQueryOptions(
    id: number,
    domain: MemberReservationDomain,
): {
    queryKey: readonly ["member", "reservations", "detail", MemberReservationDomain, number];
    queryFn: ({ signal }: { signal: AbortSignal }) => Promise<ApiResponse<MemberBayReservationResponse> | ApiResponse<MemberLessonReservationResponse>>;
};
export function getMemberReservationDetailQueryOptions(
    id: number,
    domain: MemberReservationDomain,
) {
    return {
        queryKey: ["member", "reservations", "detail", domain, id] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) => {
            if (domain === "bay") {
                return getBayReservationById(id, signal);
            }

            return getLessonReservationById(id, signal);
        },
    };
}

export function useMemberReservationById(id: number, domain?: MemberReservationDomain) {
    return useQuery<ApiResponse<MemberReservationDetailResponse>>({
        ...getMemberReservationDetailQueryOptions(
            id,
            (domain ?? "lesson") as MemberReservationDomain,
        ),
        enabled: Number.isFinite(id) && id > 0 && Boolean(domain),
        staleTime: 30_000,
    });
}



export function useMemberBaySlotGroups(startDate: string, endDate: string, enabled = true) {
    return useQuery<ApiResponse<BaySlotGroupScheduleResponse[]>>({
        ...getMemberBaySlotGroupsQueryOptions(startDate, endDate),
        enabled: enabled && Boolean(startDate) && Boolean(endDate),
        placeholderData: keepPreviousData,
        staleTime: 30_000,
    });
}

export function useCreateMemberBayReservation() {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<MemberBayReservationResponse>,
        unknown,
        CreateBayReservationRequest
    >({
        mutationFn: createMemberBayReservation,
        onSuccess: (res) => {
            responseStatus({ res });
            queryClient.invalidateQueries({ queryKey: ["member", "bay-slot-groups"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations", "today"] });
        },
        onError: (error) => {
            responseError({ error });
        },
    });
}


export function useCreateMemberLessonReservation() {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<MemberLessonReservationResponse>,
        unknown,
        CreateLessonReservationRequest
    >({
        mutationFn: createMemberLessonReservation,
        onSuccess: (res) => {
            responseStatus({ res });
            queryClient.invalidateQueries({ queryKey: ["member", "ticket-lesson-slots"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations", "today"] });
        },
        onError: (error) => {
            responseError({ error });
        },
    });
}

export function getMemberTicketLessonSlotsQueryOptions(
    ticketId: number,
    year: number,
    month: number,
) {
    return {
        queryKey: ["member", "ticket-lesson-slots", ticketId, year, month] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
            getTicketLessonSlots(ticketId, year, month, signal),
    };
}


export function useMemberTicketLessonSlots(
    ticketId: number | null | undefined,
    year: number,
    month: number,
    enabled = true,
) {
    return useQuery<ApiResponse<MemberLessonSlotResponse[]>>({
        ...getMemberTicketLessonSlotsQueryOptions(ticketId as number, year, month),
        enabled: enabled && Boolean(ticketId) && Boolean(year) && Boolean(month),
        placeholderData: keepPreviousData,
        staleTime: 30_000,
    });
}

export function useCancelMemberLessonReservation() {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<void>, unknown, number>({
        mutationFn: cancelLessonReservationById,
        onSuccess: (res, reservationId) => {
            responseStatus({ res });
            queryClient.invalidateQueries({ queryKey: ["member", "ticket-lesson-slots"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations", "today"] });
            queryClient.invalidateQueries({
                queryKey: ["member", "reservations", "detail", "lesson", reservationId],
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
            queryClient.invalidateQueries({ queryKey: ["member", "bay-slot-groups"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations", "today"] });
            queryClient.invalidateQueries({
                queryKey: ["member", "reservations", "detail", "bay", reservationId],
            });
        },
        onError: (error) => {
            responseError({ error });
        },
    });
}

export function useRescheduleMemberLessonReservation() {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<MemberLessonReservationResponse>,
        unknown,
        RescheduleMemberLessonReservationVariables
    >({
        mutationFn: ({ reservationId, data }) =>
            rescheduleLessonReservationById(reservationId, data),
        onSuccess: (res, { reservationId }) => {
            responseStatus({ res });
            queryClient.invalidateQueries({ queryKey: ["member", "ticket-lesson-slots"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations", "today"] });
            queryClient.invalidateQueries({
                queryKey: ["member", "reservations", "detail", "lesson", reservationId],
            });
        },
        onError: (error) => {
            responseError({ error });
        },
    });
}

export function useRescheduleMemberBayReservation() {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<MemberBayReservationResponse>,
        unknown,
        RescheduleMemberBayReservationVariables
    >({
        mutationFn: ({ reservationId, data }) =>
            rescheduleBayReservationById(reservationId, data),
        onSuccess: (res, { reservationId }) => {
            responseStatus({ res });
            queryClient.invalidateQueries({ queryKey: ["member", "bay-slot-groups"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations"] });
            queryClient.invalidateQueries({ queryKey: ["member", "reservations", "today"] });
            queryClient.invalidateQueries({
                queryKey: ["member", "reservations", "detail", "bay", reservationId],
            });
        },
        onError: (error) => {
            responseError({ error });
        },
    });
}
