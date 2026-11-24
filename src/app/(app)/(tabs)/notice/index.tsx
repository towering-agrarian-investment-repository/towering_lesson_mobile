import { DeleteAllNotificationsSheet } from "@/components/golf/notice/DeleteAllNotificationsSheet";
import {
    MemoNotificationRow,
    NoticeListFooter,
    NoticeListHeader,
    NotificationListSkeleton,
    NotificationSectionHeader,
    NotificationSeparator,
} from "@/components/golf/notice/NotificationRow";
import {
    cn,
    EmptyState,
    ErrorState,
    Screen,
    StateList,
    triggerImpactHaptic,
    triggerSelectionHaptic,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
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
import { toAppTimeZoneDate } from "@/utils/timezone";
import * as Notifications from "expo-notifications";
import { differenceInCalendarDays } from "date-fns";
import { MenuView, type MenuAction } from "@expo/ui/community/menu";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useIsFocused, useNavigation, useRouter, useScrollToTop } from "expo-router";
import { MoreVertical } from "lucide-react-native";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { Linking, RefreshControl, View } from "react-native";
import { ScrollView as GestureHandlerScrollView } from "react-native-gesture-handler";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

type NotificationSectionKey = "today" | "yesterday" | "thisWeek" | "earlier";
type NotificationListEntry =
    { kind: "header"; key: string; label: string } | { kind: "item"; item: NotificationResponse };

const notificationKeyExtractor = (entry: NotificationListEntry) =>
    entry.kind === "header" ? `section-${entry.key}` : String(entry.item.id);

const getNotificationItemType = (entry: NotificationListEntry) =>
    entry.kind === "header" ? "header" : entry.item.isRead ? "read" : "unread";

function getNotificationSectionKey(createdAt: string, referenceTime: number): NotificationSectionKey | null {
    const created = toAppTimeZoneDate(createdAt);
    const reference = toAppTimeZoneDate(referenceTime);
    if (!created || !reference) return null;

    const daysAgo = differenceInCalendarDays(reference, created);
    if (daysAgo <= 0) return "today";
    if (daysAgo === 1) return "yesterday";
    if (daysAgo <= 6) return "thisWeek";
    return "earlier";
}

function NoticeScreen() {
    const { colors, resolvedScheme } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const navigation = useNavigation();
    const { isLocked, runWithNavigationLock, unlock } = useNavigationLock();
    const isFocused = useIsFocused();
    const now = useDayClock();
    const listRef = useRef<FlashListRef<NotificationListEntry>>(null);
    useScrollToTop(listRef);
    const [isNotificationPermissionDenied, setIsNotificationPermissionDenied] = useState(false);
    const [isPermissionBannerDismissed, setIsPermissionBannerDismissed] = useState(false);
    const [hasVisited, setHasVisited] = useState(false);
    useFocusEffect(
        useCallback(() => {
            setHasVisited(true);
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
        isLoading,
        isError,
        isFetching,
        refetch,
        isRefetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isFetchNextPageError,
    } = useGetNotifications(undefined, {
        enabled: isFocused || hasVisited,
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
            isLocked,
            isNotificationActionPending,
            isDeletingNotification,
        }),
        [isDeletingNotification, isLocked, isNotificationActionPending],
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
            if (notificationActionLocked.current || isNotificationActionPending || isLocked) {
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
        [deleteNotification, isLocked, isNotificationActionPending],
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
    const groupedNotifications = useMemo(() => {
        const entries: NotificationListEntry[] = [];
        const stickyHeaderIndices: number[] = [];
        let currentKey: NotificationSectionKey | null = null;

        for (const notification of notifications) {
            const key = getNotificationSectionKey(notification.createdAt, now);
            if (key && key !== currentKey) {
                stickyHeaderIndices.push(entries.length);
                entries.push({
                    kind: "header",
                    key,
                    label:
                        key === "today"
                            ? t("notice.groupToday")
                            : key === "yesterday"
                              ? t("notice.groupYesterday")
                              : key === "thisWeek"
                                ? t("notice.groupThisWeek")
                                : t("notice.groupEarlier"),
                });
                currentKey = key;
            }
            entries.push({ kind: "item", item: notification });
        }

        return { data: entries, stickyHeaderIndices };
    }, [notifications, now, t]);
    const hasUnread = notifications.some((item) => !item.isRead);

    useLayoutEffect(() => {
        const moreActions: MenuAction[] = [
            ...(hasUnread
                ? [
                      {
                          id: "mark-all-read",
                          title: isMarkingAllAsRead ? t("notice.marking") : t("notice.markAllRead"),
                          image: "checkmark.circle" as const,
                          attributes: {
                              disabled: isNotificationActionPending,
                          },
                      },
                  ]
                : []),
            {
                id: "delete-all",
                title: isDeletingAllNotifications ? t("notice.deleting") : t("notice.deleteAll"),
                image: "trash",
                imageColor: colors.danger,
                titleColor: colors.danger,
                attributes: {
                    destructive: true,
                    disabled: isNotificationActionPending,
                },
            },
        ];

        navigation.setOptions({
            headerRight: () =>
                notifications.length > 0 ? (
                    <MenuView
                        actions={moreActions}
                        colorScheme={resolvedScheme}
                        onPressAction={({ nativeEvent }) => {
                            if (isNotificationActionPending || notificationActionLocked.current) {
                                return;
                            }
                            if (nativeEvent.event === "mark-all-read") {
                                notificationActionLocked.current = true;
                                markAllAsRead(undefined, {
                                    onSettled: () => {
                                        notificationActionLocked.current = false;
                                    },
                                });
                                return;
                            }
                            if (nativeEvent.event === "delete-all") {
                                setIsDeleteAllConfirmationOpen(true);
                            }
                        }}
                    >
                        <View
                            accessibilityRole="button"
                            accessibilityLabel={t("notice.moreActions", {
                                defaultValue: "More actions",
                            })}
                            accessibilityState={{
                                disabled: isNotificationActionPending,
                                busy: isMarkingAllAsRead || isDeletingAllNotifications,
                            }}
                            className={cn("items-center justify-center", isNotificationActionPending && "opacity-60")}
                            style={{ minHeight: 48, minWidth: 48 }}
                        >
                            <MoreVertical size={22} color={colors.foreground} />
                        </View>
                    </MenuView>
                ) : null,
        });
    }, [
        colors.danger,
        colors.foreground,
        hasUnread,
        isDeletingAllNotifications,
        isMarkingAllAsRead,
        isNotificationActionPending,
        markAllAsRead,
        navigation,
        notifications.length,
        resolvedScheme,
        t,
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
                    disabled={isLocked || isNotificationActionPending}
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
            isLocked,
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
                bottomPadding={isLoading || (isError && !data) || notifications.length === 0 ? 16 : 0}
            >
                {isLoading ? (
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
