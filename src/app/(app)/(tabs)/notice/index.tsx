import { DeleteAllNotificationsSheet } from "@/components/golf/notice/DeleteAllNotificationsSheet";
import { NoticeHeaderActions } from "@/components/golf/notice/NoticeHeaderActions";
import {
    MemoNotificationRow,
    NoticeListFooter,
    NoticeListHeader,
    NotificationListSkeleton,
    NotificationSectionHeader,
    NotificationSeparator,
} from "@/components/golf/notice/NotificationRow";
import {
    buildNotificationEntries,
    getNotificationItemType,
    notificationKeyExtractor,
    type NotificationListEntry,
} from "@/components/golf/notice/notice-list-entries";
import {
    EmptyState,
    ErrorState,
    Screen,
    StateList,
    triggerImpactHaptic,
    triggerSelectionHaptic,
} from "@/design-system";
import {
    useDeleteAllNotifications,
    useDeleteNotification,
    useGetNotifications,
    useMarkAllAsRead,
    useMarkAsRead,
} from "@/lib/hook/shared/useNotification";
import { getMemberLessonLogByIdQueryOptions } from "@/lib/hook/useLessonLog";
import { useDayClock } from "@/lib/hook/useMinuteClock";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { getMemberReservationDetailQueryOptions } from "@/lib/hook/useReservation";
import { NotificationResponse, type NotificationReferenceType } from "@/service/shared/notification-service";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useFocusEffect, useIsFocused, useNavigation, useRouter, useScrollToTop } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, RefreshControl } from "react-native";
import { ScrollView as GestureHandlerScrollView } from "react-native-gesture-handler";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

function NoticeScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const navigation = useNavigation();
    const { runWithNavigationLock, unlock } = useNavigationLock();
    const isFocused = useIsFocused();
    const now = useDayClock();
    const listRef = useRef<FlashListRef<NotificationListEntry>>(null);
    useScrollToTop(listRef);
    const [isNotificationPermissionDenied, setIsNotificationPermissionDenied] = useState(false);
    const [isPermissionBannerDismissed, setIsPermissionBannerDismissed] = useState(false);
    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            void Notifications.getPermissionsAsync()
                .then((permission) => {
                    if (isActive) {
                        setIsNotificationPermissionDenied(permission.status === "denied");
                    }
                })
                .catch(() => {
                    // Permission checks must never block the screen.
                });
            return () => {
                isActive = false;
            };
        }, []),
    );

    const {
        data,
        isPending,
        fetchStatus,
        isError,
        isFetching,
        refetch,
        isRefetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isFetchNextPageError,
    } = useGetNotifications(undefined, {
        enabled: isFocused,
        refetchOnWindowFocus: isFocused,
    });
    const { mutateAsync: markAsRead, isPending: isMarkingAsRead } = useMarkAsRead();
    const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } = useMarkAllAsRead();
    const { mutate: deleteNotification, isPending: isDeletingNotification } = useDeleteNotification();
    const { mutate: deleteAllNotifications, isPending: isDeletingAllNotifications } = useDeleteAllNotifications();
    const [isDeleteAllConfirmationOpen, setIsDeleteAllConfirmationOpen] = useState(false);
    const notificationActionLocked = useRef(false);
    const openSwipeableRef = useRef<SwipeableMethods | null>(null);
    const isNotificationActionPending =
        isMarkingAsRead || isMarkingAllAsRead || isDeletingNotification || isDeletingAllNotifications;
    const flashListExtraData = useMemo(
        () => ({
            isNotificationActionPending,
            isDeletingNotification,
        }),
        [isDeletingNotification, isNotificationActionPending],
    );

    const handleSwipeableWillOpen = useCallback((methods: SwipeableMethods) => {
        if (openSwipeableRef.current && openSwipeableRef.current !== methods) {
            openSwipeableRef.current.close();
        }
        openSwipeableRef.current = methods;
        triggerSelectionHaptic();
    }, []);
    const handleSwipeableReset = useCallback((methods: SwipeableMethods) => {
        if (openSwipeableRef.current === methods) {
            openSwipeableRef.current = null;
        }
    }, []);
    const handleCloseOpenSwipeable = useCallback(() => {
        if (openSwipeableRef.current) {
            openSwipeableRef.current.close();
            openSwipeableRef.current = null;
        }
    }, []);
    const handleDeleteNotification = useCallback(
        (id: number) => {
            if (notificationActionLocked.current || isNotificationActionPending) {
                return;
            }
            triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
            notificationActionLocked.current = true;
            deleteNotification(id, {
                onSettled: () => {
                    notificationActionLocked.current = false;
                },
            });
        },
        [deleteNotification, isNotificationActionPending],
    );
    const closeDeleteAllSheet = () => {
        setIsDeleteAllConfirmationOpen(false);
    };
    const confirmDeleteAll = () => {
        if (notificationActionLocked.current || isNotificationActionPending) return;
        triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
        notificationActionLocked.current = true;
        setIsDeleteAllConfirmationOpen(false);
        deleteAllNotifications(undefined, {
            onSettled: () => {
                notificationActionLocked.current = false;
            },
        });
    };

    const notifications = useMemo(() => data?.items ?? [], [data]);
    const groupedNotifications = useMemo(
        () => buildNotificationEntries(notifications, now, t),
        [notifications, now, t],
    );
    const hasUnread = notifications.some((item) => !item.isRead);

    const handleMarkAllRead = useCallback(() => {
        if (isNotificationActionPending || notificationActionLocked.current) {
            return;
        }
        notificationActionLocked.current = true;
        markAllAsRead(undefined, {
            onSettled: () => {
                notificationActionLocked.current = false;
            },
        });
    }, [isNotificationActionPending, markAllAsRead]);

    const handleDeleteAllRequest = useCallback(() => {
        if (isNotificationActionPending || notificationActionLocked.current) {
            return;
        }
        setIsDeleteAllConfirmationOpen(true);
    }, [isNotificationActionPending]);

    const hasNotifications = notifications.length > 0;

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () =>
                hasNotifications ? (
                    <NoticeHeaderActions
                        hasUnread={hasUnread}
                        isMarkingAllAsRead={isMarkingAllAsRead}
                        isDeletingAllNotifications={isDeletingAllNotifications}
                        isPending={isNotificationActionPending}
                        onMarkAllRead={handleMarkAllRead}
                        onDeleteAll={handleDeleteAllRequest}
                    />
                ) : null,
        });
    }, [
        handleDeleteAllRequest,
        handleMarkAllRead,
        hasNotifications,
        hasUnread,
        isDeletingAllNotifications,
        isMarkingAllAsRead,
        isNotificationActionPending,
        navigation,
    ]);

    const navigateFromNotification = useCallback(
        (referenceType: NotificationReferenceType | null, referenceId: string) => {
            if (referenceType === "BOOKING_BAY" || referenceType === "BOOKING_LESSON") {
                const reservationType = referenceType === "BOOKING_BAY" ? "bay" : "lesson";
                const reservationId = Number(referenceId);

                if (Number.isFinite(reservationId)) {
                    void queryClient.prefetchQuery(
                        getMemberReservationDetailQueryOptions(reservationId, reservationType),
                    );
                }

                router.push({
                    pathname: "/reservation/[id]",
                    params: {
                        id: referenceId,
                        type: reservationType,
                    },
                });
                return true;
            }

            if (referenceType === "LESSON_LOG") {
                const lessonLogId = Number(referenceId);

                if (Number.isFinite(lessonLogId)) {
                    void queryClient.prefetchQuery(getMemberLessonLogByIdQueryOptions(lessonLogId));
                }

                router.push({
                    pathname: "/lesson-log/[id]",
                    params: {
                        id: referenceId,
                    },
                });
                return true;
            }

            return false;
        },
        [queryClient, router],
    );

    const handleNotificationPress = useCallback(
        (item: NotificationResponse) => {
            if (notificationActionLocked.current || isNotificationActionPending) {
                return;
            }
            const referenceId = item.referenceId != null ? String(item.referenceId) : null;
            const didLock = runWithNavigationLock(() => {});

            if (!didLock) {
                return;
            }

            if (!item.isRead) {
                notificationActionLocked.current = true;
                void markAsRead(item.id)
                    .catch(() => {})
                    .finally(() => {
                        notificationActionLocked.current = false;
                    });
            }

            if (!referenceId) {
                unlock();
                return;
            }

            const didNavigate = navigateFromNotification(item.referenceType, referenceId);

            if (!didNavigate) {
                unlock();
            }
        },
        [isNotificationActionPending, markAsRead, navigateFromNotification, runWithNavigationLock, unlock],
    );

    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        Promise.all([
            refetch({ cancelRefetch: false }),
            queryClient.invalidateQueries({
                queryKey: ["notifications", "unread-count"],
                exact: true,
            }),
        ]),
    );

    const handleFetchNextPage = useCallback(() => {
        if (hasNextPage && !isFetching && !isPullRefreshing) {
            void fetchNextPage({ cancelRefetch: false });
        }
    }, [fetchNextPage, hasNextPage, isFetching, isPullRefreshing]);

    const handleEndReached = useCallback(() => {
        if (!isFetchNextPageError) handleFetchNextPage();
    }, [handleFetchNextPage, isFetchNextPageError]);

    const renderNotificationItem = useCallback(
        ({ item }: { item: NotificationListEntry }) =>
            item.kind === "header" ? (
                <NotificationSectionHeader label={item.label} />
            ) : (
                <MemoNotificationRow
                    item={item.item}
                    disabled={isNotificationActionPending}
                    isDeleting={isDeletingNotification}
                    onDelete={handleDeleteNotification}
                    onPress={handleNotificationPress}
                    onSwipeableReset={handleSwipeableReset}
                    onSwipeableWillOpen={handleSwipeableWillOpen}
                />
            ),
        [
            handleDeleteNotification,
            handleNotificationPress,
            handleSwipeableReset,
            handleSwipeableWillOpen,
            isDeletingNotification,
            isNotificationActionPending,
        ],
    );

    return (
        <>
            <DeleteAllNotificationsSheet
                isPresented={isDeleteAllConfirmationOpen}
                isDeleting={isDeletingAllNotifications}
                onDismiss={closeDeleteAllSheet}
                onConfirm={confirmDeleteAll}
            />

            <Screen
                scroll={false}
                bottomSafeArea={process.env.EXPO_OS === "ios"}
                bottomPadding={notifications.length === 0 ? 16 : 0}
            >
                {!data && fetchStatus === "paused" ? (
                    <ErrorState title={t("notice.failedNotificationsTitle")} />
                ) : isPending ? (
                    <NotificationListSkeleton />
                ) : isError && !data ? (
                    <StateList
                        refreshing={isPullRefreshing}
                        onRefresh={() => {
                            void handlePullRefresh();
                        }}
                    >
                        <ErrorState
                            title={t("notice.failedNotificationsTitle")}
                            message={t("common.pullToRefreshAndTryAgain")}
                            actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                            actionPending={isRefetching || isPullRefreshing}
                            onAction={() => {
                                void refetch();
                            }}
                        />
                    </StateList>
                ) : notifications.length === 0 ? (
                    <StateList
                        refreshing={isPullRefreshing}
                        onRefresh={() => {
                            void handlePullRefresh();
                        }}
                    >
                        <EmptyState
                            title={t("notice.noNotificationsTitle")}
                            message={t("notice.noNotificationsMessage")}
                            actionLabel={t("common.refresh", {
                                defaultValue: "Refresh",
                            })}
                            actionPending={isRefetching || isPullRefreshing}
                            onAction={() => {
                                void refetch();
                            }}
                        />
                    </StateList>
                ) : (
                    <FlashList
                        ref={listRef}
                        data={groupedNotifications.data}
                        extraData={flashListExtraData}
                        keyExtractor={notificationKeyExtractor}
                        getItemType={getNotificationItemType}
                        stickyHeaderIndices={groupedNotifications.stickyHeaderIndices}
                        stickyHeaderConfig={{ hideRelatedCell: true }}
                        renderItem={renderNotificationItem}
                        renderScrollComponent={GestureHandlerScrollView}
                        ItemSeparatorComponent={NotificationSeparator}
                        onScrollBeginDrag={handleCloseOpenSwipeable}
                        refreshControl={
                            <RefreshControl
                                refreshing={isPullRefreshing}
                                onRefresh={() => {
                                    void handlePullRefresh();
                                }}
                            />
                        }
                        contentInsetAdjustmentBehavior="automatic"
                        showsVerticalScrollIndicator={false}
                        onEndReached={handleEndReached}
                        onEndReachedThreshold={0.4}
                        ListHeaderComponent={
                            <NoticeListHeader
                                count={hasNextPage ? `${notifications.length}+` : notifications.length}
                                isUpdating={isFetching && !isFetchingNextPage}
                                showPermissionBanner={isNotificationPermissionDenied && !isPermissionBannerDismissed}
                                onOpenSettings={() => {
                                    void Linking.openSettings();
                                }}
                                onDismissPermissionBanner={() => setIsPermissionBannerDismissed(true)}
                            />
                        }
                        ListFooterComponent={
                            isFetchingNextPage ? (
                                <NoticeListFooter />
                            ) : isFetchNextPageError ? (
                                <NoticeListFooter onRetry={handleFetchNextPage} />
                            ) : undefined
                        }
                    />
                )}
            </Screen>
        </>
    );
}

export default NoticeScreen;
