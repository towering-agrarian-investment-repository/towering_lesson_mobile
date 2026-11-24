import { ApiResponse, CursorPageResponse, responseError } from "@/lib/api-response/api-response";
import {
    deleteAllNotifications,
    deleteNotification,
    getNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    NOTIFICATION_CURSOR_PAGE_SIZE,
    type NotificationResponse,
} from "@/service/shared/notification-service";
import {
    type InfiniteData,
    type QueryClient,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

type NotificationInfiniteData = InfiniteData<ApiResponse<CursorPageResponse<NotificationResponse>>>;

type NotificationMutationContext = {
    mutationId: number;
    previousLists: [readonly unknown[], NotificationInfiniteData | undefined][];
    previousUnreadCount: ApiResponse<number> | undefined;
};

type NotificationMutationTracker = {
    activeCount: number;
    latestId: number;
};

const mutationTrackers = new WeakMap<QueryClient, NotificationMutationTracker>();

function getMutationTracker(queryClient: QueryClient): NotificationMutationTracker {
    let tracker = mutationTrackers.get(queryClient);
    if (!tracker) {
        tracker = { activeCount: 0, latestId: 0 };
        mutationTrackers.set(queryClient, tracker);
    }
    return tracker;
}

async function snapshotNotifications(queryClient: QueryClient): Promise<NotificationMutationContext> {
    const tracker = getMutationTracker(queryClient);
    tracker.activeCount += 1;
    const mutationId = ++tracker.latestId;

    await queryClient.cancelQueries({ queryKey: ["notifications"] });
    const previousLists = queryClient.getQueriesData<NotificationInfiniteData>({
        queryKey: ["notifications"],
        predicate: (query) => query.queryKey[1] !== "unread-count",
    });
    const previousUnreadCount = queryClient.getQueryData<ApiResponse<number>>(["notifications", "unread-count"]);
    return { mutationId, previousLists, previousUnreadCount };
}

function restoreNotifications(queryClient: QueryClient, context?: NotificationMutationContext) {
    if (!context) return;
    const tracker = getMutationTracker(queryClient);
    if (context.mutationId !== tracker.latestId) {
        return;
    }
    for (const [key, data] of context.previousLists) {
        queryClient.setQueryData(key, data);
    }
    queryClient.setQueryData(["notifications", "unread-count"], context.previousUnreadCount);
}

function settleNotificationMutation(queryClient: QueryClient) {
    const tracker = getMutationTracker(queryClient);
    tracker.activeCount = Math.max(0, tracker.activeCount - 1);
    if (tracker.activeCount === 0) {
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
}

export const useGetNotifications = (
    isRead?: boolean,
    options?: {
        enabled?: boolean;
        refetchOnWindowFocus?: boolean;
    },
) => {
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
        enabled: options?.enabled ?? true,
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
            return page.hasMore ? page.nextCursor : undefined;
        },
        select: (data) => ({
            items: data.pages.flatMap((page) => page.data.items),
            hasMore: data.pages[data.pages.length - 1]?.data.hasMore ?? false,
        }),
        staleTime: 15_000,
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
    });
};

export const useGetUnreadNotificationCount = () => {
    return useQuery({
        queryKey: ["notifications", "unread-count"],
        queryFn: ({ signal }) => getUnreadNotificationCount(signal),
        staleTime: 15_000,
        refetchOnWindowFocus: true,
    });
};

export const useMarkAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<null>, unknown, number, NotificationMutationContext>({
        mutationFn: markNotificationAsRead,
        onMutate: async (notificationId) => {
            const context = await snapshotNotifications(queryClient);
            let wasUnread = false;

            queryClient.setQueriesData<NotificationInfiniteData>(
                {
                    queryKey: ["notifications"],
                    predicate: (query) => query.queryKey[1] !== "unread-count",
                },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            data: {
                                ...page.data,
                                items: page.data.items.map((item) => {
                                    if (item.id === notificationId) {
                                        if (!item.isRead) wasUnread = true;
                                        return { ...item, isRead: true };
                                    }
                                    return item;
                                }),
                            },
                        })),
                    };
                },
            );

            if (wasUnread) {
                queryClient.setQueryData<ApiResponse<number>>(["notifications", "unread-count"], (old) =>
                    old ? { ...old, data: Math.max(0, (old.data ?? 0) - 1) } : old,
                );
            }

            return context;
        },
        onError: (error, _id, context) => {
            restoreNotifications(queryClient, context);
            responseError(error);
        },
        onSettled: () => {
            settleNotificationMutation(queryClient);
        },
    });
};

export const useMarkAllAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<null>, unknown, void, NotificationMutationContext>({
        mutationFn: markAllNotificationsAsRead,
        onMutate: async () => {
            const context = await snapshotNotifications(queryClient);

            queryClient.setQueriesData<NotificationInfiniteData>(
                {
                    queryKey: ["notifications"],
                    predicate: (query) => query.queryKey[1] !== "unread-count",
                },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            data: {
                                ...page.data,
                                items: page.data.items.map((item) => ({
                                    ...item,
                                    isRead: true,
                                })),
                            },
                        })),
                    };
                },
            );

            queryClient.setQueryData<ApiResponse<number>>(["notifications", "unread-count"], (old) =>
                old ? { ...old, data: 0 } : old,
            );

            return context;
        },
        onError: (error, _vars, context) => {
            restoreNotifications(queryClient, context);
            responseError(error);
        },
        onSettled: () => {
            settleNotificationMutation(queryClient);
        },
    });
};

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<null>, unknown, number, NotificationMutationContext>({
        mutationFn: deleteNotification,
        onMutate: async (notificationId) => {
            const context = await snapshotNotifications(queryClient);
            let deletedUnread = false;

            queryClient.setQueriesData<NotificationInfiniteData>(
                {
                    queryKey: ["notifications"],
                    predicate: (query) => query.queryKey[1] !== "unread-count",
                },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            data: {
                                ...page.data,
                                items: page.data.items.filter((item) => {
                                    if (item.id === notificationId) {
                                        if (!item.isRead) deletedUnread = true;
                                        return false;
                                    }
                                    return true;
                                }),
                            },
                        })),
                    };
                },
            );

            if (deletedUnread) {
                queryClient.setQueryData<ApiResponse<number>>(["notifications", "unread-count"], (old) =>
                    old ? { ...old, data: Math.max(0, (old.data ?? 0) - 1) } : old,
                );
            }

            return context;
        },
        onError: (error, _id, context) => {
            restoreNotifications(queryClient, context);
            responseError(error);
        },
        onSettled: () => {
            settleNotificationMutation(queryClient);
        },
    });
};

export const useDeleteAllNotifications = () => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<null>, unknown, void, NotificationMutationContext>({
        mutationFn: deleteAllNotifications,
        onMutate: async () => {
            const context = await snapshotNotifications(queryClient);

            queryClient.setQueriesData<NotificationInfiniteData>(
                {
                    queryKey: ["notifications"],
                    predicate: (query) => query.queryKey[1] !== "unread-count",
                },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            data: {
                                ...page.data,
                                items: [],
                                hasMore: false,
                                nextCursor: null,
                            },
                        })),
                    };
                },
            );

            queryClient.setQueryData<ApiResponse<number>>(["notifications", "unread-count"], (old) =>
                old ? { ...old, data: 0 } : old,
            );

            return context;
        },
        onError: (error, _vars, context) => {
            restoreNotifications(queryClient, context);
            responseError(error);
        },
        onSettled: () => {
            settleNotificationMutation(queryClient);
        },
    });
};
