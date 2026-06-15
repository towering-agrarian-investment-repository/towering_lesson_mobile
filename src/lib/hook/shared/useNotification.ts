import { ApiResponse, CursorPageResponse, responseError } from "@/lib/api-response/api-response";
import {
	getNotifications,
	getUnreadNotificationCount,
	markAllNotificationsAsRead,
	markNotificationAsRead,
	NOTIFICATION_CURSOR_PAGE_SIZE,
	type NotificationResponse,
} from "@/service/shared/notification-service";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


export const useGetNotifications = (isRead?: boolean) => {
	return useInfiniteQuery<
		ApiResponse<CursorPageResponse<NotificationResponse>>,
		Error,
		{
			items: NotificationResponse[];
			hasMore: boolean;
		},
		["notifications", boolean | undefined],
		string | null
	>({
		queryKey: ["notifications", isRead],
		initialPageParam: null,
		queryFn: ({ pageParam, signal }) =>
			getNotifications(
				{
					cursor: pageParam ?? undefined,
					limit: NOTIFICATION_CURSOR_PAGE_SIZE,
					isRead,
				},
				signal,
			),
		getNextPageParam: (lastPage) => {
			const page = lastPage.data;
			return page?.hasMore ? page.nextCursor : undefined;
		},
		select: (data) => ({
			items: data.pages.flatMap((page) => page.data?.items ?? []),
			hasMore: data.pages[data.pages.length - 1]?.data?.hasMore ?? false,
		}),
		staleTime: 15_000,
	});
};

export const useGetUnreadNotificationCount = () => {
	return useQuery({
		queryKey: ["notifications", "unread-count"],
		queryFn: getUnreadNotificationCount,
		staleTime: 15_000,
	});
};

export const useMarkAsRead = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: markNotificationAsRead,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
		},
		onError: (error) => {
			responseError({ error });
		},
	});
};

export const useMarkAllAsRead = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: markAllNotificationsAsRead,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
		},
		onError: (error) => {
			responseError({ error });
		},
	});
};
