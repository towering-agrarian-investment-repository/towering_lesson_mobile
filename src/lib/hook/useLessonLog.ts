import { MemberLessonLogResponse, MemberLessonLogUpdateRequest } from "@/types/member-lesson-log";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiResponse, responseError, responseStatus } from "../api-response/api-response";
import { getMemberLessonLogById, getMemberLessonLogs, updateMemberLessonLog } from "@/service/member-lesson-log.service";


export function useMemberLessonLogs() {
	return useQuery<ApiResponse<MemberLessonLogResponse[]>>({
		queryKey: ["member", "lesson-logs"],
		queryFn: ({ signal }) => getMemberLessonLogs(signal),
	});
}

export function useMemberLessonLogById(id: number) {
	return useQuery<ApiResponse<MemberLessonLogResponse>>({
		queryKey: ["member", "lesson-logs", String(id)],
		queryFn: ({ signal }) => getMemberLessonLogById(id, signal),
		enabled: Number.isFinite(id),
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
			responseStatus({ res });
			queryClient.invalidateQueries({ queryKey: ["member", "lesson-logs"] });
			queryClient.invalidateQueries({
				queryKey: ["member", "lesson-logs", String(variables.lessonLogId)],
			});
		},
		onError: (error: unknown) => {
			responseError({ error });
		},
	});
}
