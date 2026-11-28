import {
    cancelBayReservationById,
    createMemberBayReservation,
    getBayReservationById,
    getMemberBaySlotGroups,
    rescheduleBayReservationById,
    updateBayReservationMemberNotes,
} from "@/service/member-bay-reservation.service";
import {
    cancelLessonReservationById,
    createMemberLessonReservation,
    getLessonReservationById,
    getTicketLessonSlots,
} from "@/service/member-lesson-reservation.service";
import {
    getMemberReservations,
    getMemberReservationsByDate,
    getTodayMemberReservations,
    MEMBER_RESERVATION_CURSOR_PAGE_SIZE,
    MemberReservationType,
} from "@/service/reservation.service";
import {
    MemberBaySlotGroupResponse,
    MemberBayReservationResponse,
    CreateBayReservationRequest,
    RescheduleBayReservationRequest,
    UpdateBayReservationNotesRequest,
} from "@/types/member-bay";
import {
    CreateLessonReservationRequest,
    MemberLessonReservationResponse,
    MemberLessonSlotResponse,
} from "@/types/member-lesson";
import { MemberReservationDomain, MemberReservationSummaryResponse } from "@/types/member-reservation";
import {
    type InfiniteData,
    QueryClient,
    skipToken,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    API_ERROR_CODE,
    ApiResponse,
    ApiErrorResponse,
    CursorPageResponse,
    isApiError,
    responseError,
    responseStatus,
} from "../api-response/api-response";

export type MemberReservationDetailResponse = MemberLessonReservationResponse | MemberBayReservationResponse;

export type MemberReservationDetailPreview = {
    isListPreview: true;
    reservation: MemberReservationSummaryResponse;
};

export function isReservationSlotUnavailable(error: unknown): error is ApiErrorResponse {
    return isApiError(error, {
        httpStatus: 409,
        errorCode: API_ERROR_CODE.RESERVATION_SLOT_UNAVAILABLE,
    });
}

type RescheduleMemberBayReservationVariables = {
    reservationId: number;
    data: RescheduleBayReservationRequest;
};

export function getMemberBaySlotGroupsQueryOptions(ticketId: number, startDate: string, endDate: string) {
    return {
        queryKey: ["member", "bay-slot-groups", ticketId, startDate, endDate] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) => getMemberBaySlotGroups(ticketId, startDate, endDate, signal),
        staleTime: 10_000,
    };
}

export function getMemberReservationsQueryOptions(type: MemberReservationType, from?: string, to?: string) {
    const queryKey = ["member", "reservations", type, from ?? null, to ?? null] as const;

    return {
        queryKey,
        initialPageParam: null as string | null,
        staleTime: 30_000,
        queryFn: ({ pageParam, signal }: { pageParam: string | null; signal: AbortSignal }) =>
            getMemberReservations(
                {
                    type,
                    cursor: pageParam ?? undefined,
                    limit: MEMBER_RESERVATION_CURSOR_PAGE_SIZE,
                    from,
                    to,
                },
                signal,
            ),
        getNextPageParam: (lastPage: ApiResponse<CursorPageResponse<MemberReservationSummaryResponse>>) => {
            const page = lastPage.data;
            return page.hasMore ? page.nextCursor : undefined;
        },
    };
}

export function useMemberReservations(type: MemberReservationType, from?: string, to?: string, enabled = true) {
    return useInfiniteQuery<
        ApiResponse<CursorPageResponse<MemberReservationSummaryResponse>>,
        Error,
        {
            items: MemberReservationSummaryResponse[];
        },
        ReturnType<typeof getMemberReservationsQueryOptions>["queryKey"],
        string | null
    >({
        ...getMemberReservationsQueryOptions(type, from, to),
        enabled,
        placeholderData: (previousData, previousQuery) =>
            previousQuery?.queryKey[2] === type ? previousData : undefined,
        select: (data) => ({
            items: data.pages.flatMap((page) => page.data.items),
        }),
    });
}

export function useTodayMemberReservations() {
    return useQuery<ApiResponse<MemberReservationSummaryResponse[]>, Error, MemberReservationSummaryResponse[]>({
        queryKey: ["member", "reservations", "today"],
        queryFn: ({ signal }) => getTodayMemberReservations(signal),
        select: (response) => response.data,
        staleTime: 30_000,
    });
}

export function useMemberReservationsForDay(dateKey: string | null, enabled = true) {
    return useQuery<ApiResponse<MemberReservationSummaryResponse[]>, Error, MemberReservationSummaryResponse[]>({
        queryKey: ["member", "reservations", "by-date", dateKey],
        queryFn: dateKey ? ({ signal }) => getMemberReservationsByDate(dateKey, signal) : skipToken,
        enabled: enabled && Boolean(dateKey),
        select: (response) => response.data,
        staleTime: 30_000,
    });
}

export function getMemberReservationDetailQueryOptions(
    id: number,
    domain: "bay",
): {
    queryKey: readonly ["member", "reservations", "detail", "bay", number];
    queryFn: ({ signal }: { signal: AbortSignal }) => Promise<ApiResponse<MemberBayReservationResponse>>;
    staleTime: number;
};
export function getMemberReservationDetailQueryOptions(
    id: number,
    domain: "lesson",
): {
    queryKey: readonly ["member", "reservations", "detail", "lesson", number];
    queryFn: ({ signal }: { signal: AbortSignal }) => Promise<ApiResponse<MemberLessonReservationResponse>>;
    staleTime: number;
};
export function getMemberReservationDetailQueryOptions(
    id: number,
    domain: MemberReservationDomain,
): {
    queryKey: readonly ["member", "reservations", "detail", MemberReservationDomain, number];
    queryFn: ({
        signal,
    }: {
        signal: AbortSignal;
    }) => Promise<ApiResponse<MemberBayReservationResponse> | ApiResponse<MemberLessonReservationResponse>>;
    staleTime: number;
};
export function getMemberReservationDetailQueryOptions(id: number, domain: MemberReservationDomain) {
    return {
        queryKey: ["member", "reservations", "detail", domain, id] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) => {
            if (domain === "bay") {
                return getBayReservationById(id, signal);
            }

            return getLessonReservationById(id, signal);
        },
        staleTime: 30_000,
    };
}

function refreshMemberReservationDetail(
    queryClient: QueryClient,
    id: number | undefined,
    domain: MemberReservationDomain,
) {
    if (id == null) {
        return;
    }

    // Mutation responses may omit related names; populate details through GET.
    void queryClient.invalidateQueries({
        queryKey: getMemberReservationDetailQueryOptions(id, domain).queryKey,
        exact: true,
    });
}

function patchCancelledReservationInLists(
    queryClient: QueryClient,
    reservationId: number,
    domain: MemberReservationDomain,
) {
    const patchSummary = <T extends MemberReservationSummaryResponse>(item: T): T =>
        item.id === reservationId && item.reservationType === domain
            ? { ...item, reservationStatus: "CANCELLED" }
            : item;

    queryClient.setQueriesData<ApiResponse<MemberReservationSummaryResponse[]>>(
        { queryKey: ["member", "reservations", "today"] },
        (old) => (old ? { ...old, data: old.data.map(patchSummary) } : old),
    );
    queryClient.setQueriesData<ApiResponse<MemberReservationSummaryResponse[]>>(
        { queryKey: ["member", "reservations", "by-date"] },
        (old) => (old ? { ...old, data: old.data.map(patchSummary) } : old),
    );
    for (const type of ["all", "bay", "private", "group", "program"] as const) {
        queryClient.setQueriesData<InfiniteData<ApiResponse<CursorPageResponse<MemberReservationSummaryResponse>>>>(
            { queryKey: ["member", "reservations", type] },
            (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: {
                            ...page.data,
                            items: page.data.items.map(patchSummary),
                        },
                    })),
                };
            },
        );
    }
}

function refreshMemberReservationLists(queryClient: QueryClient) {
    void queryClient.invalidateQueries({
        queryKey: ["member", "reservations"],
        predicate: (query) => query.queryKey[2] !== "detail",
    });
    void queryClient.invalidateQueries({
        queryKey: ["member", "activity"],
    });
}

function refreshMemberTickets(queryClient: QueryClient) {
    void queryClient.invalidateQueries({
        queryKey: ["member", "tickets"],
        refetchType: "active",
    });
}

function getMemberReservationDetailPreview(
    queryClient: QueryClient,
    id: number,
    domain: MemberReservationDomain,
): ApiResponse<MemberReservationDetailPreview> | undefined {
    const today = queryClient.getQueryData<ApiResponse<MemberReservationSummaryResponse[]>>([
        "member",
        "reservations",
        "today",
    ]);
    const todayReservation = today?.data.find(
        (reservation) => reservation.id === id && reservation.reservationType === domain,
    );
    if (today && todayReservation) {
        return { status: today.status, data: { isListPreview: true, reservation: todayReservation } };
    }

    for (const type of ["all", "bay", "private", "group", "program"] as const) {
        const lists = queryClient.getQueriesData<
            InfiniteData<ApiResponse<CursorPageResponse<MemberReservationSummaryResponse>>>
        >({ queryKey: ["member", "reservations", type] });
        for (const [, list] of lists) {
            for (const page of list?.pages ?? []) {
                const reservation = page.data.items.find((item) => item.id === id && item.reservationType === domain);
                if (reservation) {
                    return { status: page.status, data: { isListPreview: true, reservation } };
                }
            }
        }
    }

    return undefined;
}

export function useMemberReservationById(id: number, domain?: MemberReservationDomain) {
    const queryClient = useQueryClient();
    return useQuery<ApiResponse<MemberReservationDetailResponse | MemberReservationDetailPreview>>({
        ...getMemberReservationDetailQueryOptions(id, (domain ?? "lesson") as MemberReservationDomain),
        enabled: Number.isFinite(id) && id > 0 && Boolean(domain),
        placeholderData: () => (domain ? getMemberReservationDetailPreview(queryClient, id, domain) : undefined),
        staleTime: 30_000,
    });
}

export function useMemberBaySlotGroups(
    ticketId: number,
    startDate: string,
    endDate: string,
    enabled = true,
    refetchOnWindowFocus = true,
) {
    return useQuery<ApiResponse<MemberBaySlotGroupResponse[]>>({
        ...getMemberBaySlotGroupsQueryOptions(ticketId, startDate, endDate),
        enabled: enabled && Number.isSafeInteger(ticketId) && ticketId > 0 && Boolean(startDate) && Boolean(endDate),
        refetchOnWindowFocus,
        // Keep date navigation smooth without displaying another ticket's schedule.
        placeholderData: (previousData, previousQuery) =>
            previousQuery?.queryKey[2] === ticketId ? previousData : undefined,
    });
}

export function useCreateMemberBayReservation() {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<MemberBayReservationResponse>, unknown, CreateBayReservationRequest>({
        mutationFn: createMemberBayReservation,
        retry: false,
        onSuccess: (res) => {
            refreshMemberReservationDetail(queryClient, res.data?.id, "bay");
            refreshMemberReservationLists(queryClient);
            refreshMemberTickets(queryClient);
            void queryClient.invalidateQueries({
                queryKey: ["member", "bay-slot-groups"],
                refetchType: "none",
            });
        },
        onError: (error) => {
            if (!isReservationSlotUnavailable(error)) {
                responseError(error);
            }
        },
    });
}

export function useUpdateMemberBayReservationNotes() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<null>, unknown, { reservationId: number; data: UpdateBayReservationNotesRequest }>({
        mutationFn: ({ reservationId, data }) => updateBayReservationMemberNotes(reservationId, data),
        onSuccess: (response, { reservationId, data }) => {
            if (response?.status?.message) {
                responseStatus(response);
            }
            queryClient.setQueryData<ApiResponse<MemberReservationDetailResponse | MemberReservationDetailPreview>>(
                getMemberReservationDetailQueryOptions(reservationId, "bay").queryKey,
                (previous) => {
                    if (previous && !("isListPreview" in previous.data) && previous.data.reservationType === "bay") {
                        return {
                            status: response?.status ?? previous.status,
                            data: {
                                ...previous.data,
                                memberNotes: data.memberNotes,
                            },
                        };
                    }

                    return previous;
                },
                { updatedAt: 0 },
            );
            refreshMemberReservationDetail(queryClient, reservationId, "bay");
            refreshMemberReservationLists(queryClient);
        },
        onError: responseError,
    });
}

export function useCreateMemberLessonReservation() {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<MemberLessonReservationResponse>, unknown, CreateLessonReservationRequest>({
        mutationFn: createMemberLessonReservation,
        retry: false,
        onSuccess: (res) => {
            refreshMemberReservationDetail(queryClient, res.data?.id, "lesson");
            refreshMemberReservationLists(queryClient);
            refreshMemberTickets(queryClient);
            void queryClient.invalidateQueries({
                queryKey: ["member", "ticket-lesson-slots"],
                refetchType: "none",
            });
        },
        onError: (error) => {
            if (!isReservationSlotUnavailable(error)) {
                responseError(error);
            }
        },
    });
}

export function getMemberTicketLessonSlotsQueryOptions(ticketId: number, year: number, month: number) {
    return {
        queryKey: ["member", "ticket-lesson-slots", ticketId, year, month] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) => getTicketLessonSlots(ticketId, year, month, signal),
        staleTime: 30_000,
    };
}

export function useMemberTicketLessonSlots(
    ticketId: number | null | undefined,
    year: number,
    month: number,
    enabled = true,
    refetchOnWindowFocus = true,
) {
    return useQuery<ApiResponse<MemberLessonSlotResponse[]>>({
        ...getMemberTicketLessonSlotsQueryOptions(ticketId as number, year, month),
        enabled: enabled && Boolean(ticketId) && Boolean(year) && Boolean(month),
        refetchOnWindowFocus,
        placeholderData: (previousData, previousQuery) =>
            previousQuery?.queryKey[2] === ticketId ? previousData : undefined,
    });
}

export function useCancelMemberLessonReservation() {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<null>, unknown, number>({
        mutationFn: cancelLessonReservationById,
        onSuccess: (res, reservationId) => {
            responseStatus(res);
            patchCancelledReservationInLists(queryClient, reservationId, "lesson");
            refreshMemberReservationLists(queryClient);
            refreshMemberTickets(queryClient);
            void queryClient.invalidateQueries({
                queryKey: ["member", "ticket-lesson-slots"],
                refetchType: "none",
            });
            void queryClient.invalidateQueries({
                queryKey: ["member", "reservations", "detail", "lesson", reservationId],
                refetchType: "none",
            });
        },
        onError: (error) => {
            responseError(error);
        },
    });
}

export function useCancelMemberBayReservation() {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<null>, unknown, number>({
        mutationFn: cancelBayReservationById,
        onSuccess: (res, reservationId) => {
            responseStatus(res);
            patchCancelledReservationInLists(queryClient, reservationId, "bay");
            refreshMemberReservationLists(queryClient);
            refreshMemberTickets(queryClient);
            void queryClient.invalidateQueries({
                queryKey: ["member", "bay-slot-groups"],
                refetchType: "none",
            });
            void queryClient.invalidateQueries({
                queryKey: ["member", "reservations", "detail", "bay", reservationId],
                refetchType: "none",
            });
        },
        onError: (error) => {
            responseError(error);
        },
    });
}

export function useRescheduleMemberBayReservation() {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<MemberBayReservationResponse>, unknown, RescheduleMemberBayReservationVariables>({
        mutationFn: ({ reservationId, data }) => rescheduleBayReservationById(reservationId, data),
        retry: false,
        onSuccess: (_res, { reservationId }) => {
            refreshMemberReservationDetail(queryClient, reservationId, "bay");
            refreshMemberReservationLists(queryClient);
            refreshMemberTickets(queryClient);
            void queryClient.invalidateQueries({
                queryKey: ["member", "bay-slot-groups"],
                refetchType: "none",
            });
        },
        onError: (error) => {
            if (!isReservationSlotUnavailable(error)) {
                responseError(error);
            }
        },
    });
}
