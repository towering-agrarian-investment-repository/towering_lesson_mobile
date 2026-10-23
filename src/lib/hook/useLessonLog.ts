import { MemberLessonLogResponse, MemberLessonLogUpdateRequest } from "@/types/member-lesson-log";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiResponse, CursorPageResponse, responseError, responseStatus } from "../api-response/api-response";
import { getMemberLessonLogById, getMemberLessonLogCount, getMemberLessonLogs, MEMBER_LESSON_LOG_PAGE_SIZE, updateMemberLessonLog } from "@/service/member-lesson-log.service";

export function getMemberLessonLogByIdQueryOptions(id: number) {
	return {
		queryKey: ["member", "lesson-logs", String(id)] as const,
		queryFn: ({ signal }: { signal: AbortSignal }) => getMemberLessonLogById(id, signal),
	};
}

export function useMemberLessonLogs() {
	return useInfiniteQuery<
		ApiResponse<CursorPageResponse<MemberLessonLogResponse>>,
		Error,
		{ items: MemberLessonLogResponse[] },
		["member", "lesson-logs", "list"],
		string | null
	>({
		queryKey: ["member", "lesson-logs", "list"],
		initialPageParam: null,
		queryFn: ({ pageParam, signal }) => getMemberLessonLogs({
			cursor: pageParam ?? undefined,
			limit: MEMBER_LESSON_LOG_PAGE_SIZE,
		}, signal),
		getNextPageParam: (lastPage) => lastPage.data.hasMore
			? lastPage.data.nextCursor ?? undefined
			: undefined,
		select: (data) => ({ items: data.pages.flatMap((page) => page.data.items) }),
		staleTime: 60_000,
	});
}

export function useMemberLessonLogCount() {
	return useQuery<ApiResponse<number>>({
		queryKey: ["member", "lesson-logs", "count"],
		queryFn: ({ signal }) => getMemberLessonLogCount(signal),
		staleTime: 60_000,
	});
}

export function useMemberLessonLogById(id: number) {
	return useQuery<ApiResponse<MemberLessonLogResponse>>({
		...getMemberLessonLogByIdQueryOptions(id),
		enabled: Number.isSafeInteger(id) && id > 0,
		staleTime: 60_000,
	});
}

export function useUpdateMemberLessonLog() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			lessonLogId,
			data,
		}: {
			lessonLogId: number;
			data: MemberLessonLogUpdateRequest;
		}) => updateMemberLessonLog(lessonLogId, data),
		onSuccess: (res, variables) => {
			responseStatus(res);
			queryClient.setQueryData(
				getMemberLessonLogByIdQueryOptions(variables.lessonLogId).queryKey,
				res,
			);
			void queryClient.invalidateQueries({ queryKey: ["member", "lesson-logs", "list"] });
			void queryClient.invalidateQueries({ queryKey: ["member", "lesson-logs", "count"] });
		},
		onError: (error: unknown) => {
			responseError(error);
		},
	});
}
