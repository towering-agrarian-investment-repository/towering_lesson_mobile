import {
    AppText,
    CircleLoader,
    cn,
    ConfirmSheet,
    EmptyState,
    ErrorState,
    getPressedScaleStyle,
    Screen,
    useThemeColors,
} from "@/design-system";
import {
    useGetNotifications,
    useDeleteAllNotifications,
    useDeleteNotification,
    useMarkAllAsRead,
    useMarkAsRead,
} from "@/lib/hook/shared/useNotification";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { getMemberLessonLogByIdQueryOptions } from "@/lib/hook/useLessonLog";
import { getMemberReservationDetailQueryOptions } from "@/lib/hook/useReservation";
import {
    NotificationResponse,
    type NotificationReferenceType,
} from "@/service/shared/notification-service";
import { useQueryClient } from "@tanstack/react-query";
import { formatRelativeTime } from "@/utils/relative-time";
import { useNavigation, useRouter } from "expo-router";
import { Bell, MoreVertical } from "lucide-react-native";
import { memo, useCallback, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Modal, Pressable, RefreshControl, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
    useReducedMotion,
} from "react-native-reanimated";

function NoticeScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const navigation = useNavigation();
    const colors = useThemeColors();
    const { isLocked, runWithNavigationLock, unlock } = useNavigationLock();
    const reduceMotion = useReducedMotion();
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
    } = useGetNotifications();
    const { mutateAsync: markAsRead } = useMarkAsRead();
    const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } = useMarkAllAsRead();
    const { mutate: deleteNotification, isPending: isDeletingNotification } = useDeleteNotification();
    const { mutate: deleteAllNotifications, isPending: isDeletingAllNotifications } = useDeleteAllNotifications();
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const [isDeleteAllConfirmationOpen, setIsDeleteAllConfirmationOpen] =
        useState(false);

    const notifications = data?.items ?? [];
    const hasUnread = notifications.some((item) => !item.isRead);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View className="flex-row items-center gap-4">
                    {hasUnread ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t("notice.markAllAsRead")}
                            disabled={isMarkingAllAsRead || isDeletingAllNotifications}
                            className={isMarkingAllAsRead ? "opacity-60" : undefined}
                            hitSlop={10}
                            style={({ pressed }) => getPressedScaleStyle(pressed, isMarkingAllAsRead, 0.99)}
                            onPress={() => {
                                markAllAsRead();
                            }}
                        >
                            <AppText variant="meta" className="text-primary">
                                {isMarkingAllAsRead ? t("notice.marking") : t("notice.markAllRead")}
                            </AppText>
                        </Pressable>
                    ) : null}
                    {notifications.length > 0 ? (
                        <View className="relative">
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={t("notice.moreActions", { defaultValue: "More actions" })}
                                disabled={isDeletingAllNotifications || isMarkingAllAsRead}
                                className={isDeletingAllNotifications ? "opacity-60" : undefined}
                                hitSlop={10}
                                style={({ pressed }) => getPressedScaleStyle(pressed, isDeletingAllNotifications, 0.99)}
                                onPress={() => setIsActionsMenuOpen((open) => !open)}
                            >
                                <MoreVertical size={22} color={colors.foreground} />
                            </Pressable>

                            <Modal
                                transparent
                                visible={isActionsMenuOpen}
                                animationType="fade"
                                onRequestClose={() => setIsActionsMenuOpen(false)}
                            >
                                <Pressable
                                    className="flex-1"
                                    onPress={() => setIsActionsMenuOpen(false)}
                                >
                                    <View className="absolute right-4 top-16 w-44 rounded-xl border border-border bg-card p-1 shadow-lg">
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={t("notice.deleteAll")}
                                            disabled={isDeletingAllNotifications}
                                            className="rounded-lg px-3 py-2 active:bg-muted"
                                            onPress={() => {
                                                setIsActionsMenuOpen(false);
                                                setIsDeleteAllConfirmationOpen(true);
                                            }}
                                        >
                                            <AppText variant="label" className="text-danger">
                                                {isDeletingAllNotifications ? t("notice.deleting") : t("notice.deleteAll")}
                                            </AppText>
                                        </Pressable>
                                    </View>
                                </Pressable>
                            </Modal>
                        </View>
                    ) : null}
                </View>
            ),
        });
    }, [colors.foreground, deleteAllNotifications, hasUnread, isActionsMenuOpen, isDeletingAllNotifications, isMarkingAllAsRead, markAllAsRead, navigation, notifications.length, t]);

    const navigateFromNotification = useCallback((
        referenceType: NotificationReferenceType | null,
        referenceId: string,
    ) => {
        if (referenceType === "BOOKING_BAY") {
            void queryClient.prefetchQuery(
                getMemberReservationDetailQueryOptions(Number(referenceId), "bay"),
            );
            router.push({
                pathname: "/reservation/[id]",
                params: {
                    id: referenceId,
                    type: "bay",
                },
            });
            return true;
        }

        if (referenceType === "BOOKING_LESSON") {
            void queryClient.prefetchQuery(
                getMemberReservationDetailQueryOptions(Number(referenceId), "lesson"),
            );
            router.push({
                pathname: "/reservation/[id]",
                params: {
                    id: referenceId,
                    type: "lesson",
                },
            });
            return true;
        }

        if (referenceType === "LESSON_LOG") {
            const lessonLogId = Number(referenceId);

            if (Number.isFinite(lessonLogId)) {
                void queryClient.prefetchQuery(
                    getMemberLessonLogByIdQueryOptions(lessonLogId),
                );
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
    }, [queryClient, router]);

    const handleNotificationPress = useCallback((item: NotificationResponse) => {
        const referenceId =
            item.referenceId != null ? String(item.referenceId) : null;
        const didLock = runWithNavigationLock(() => { });

        if (!didLock) {
            return;
        }

        if (!item.isRead) {
            void markAsRead(item.id).catch(() => { });
        }

        if (!referenceId) {
            unlock();
            return;
        }

        const didNavigate = navigateFromNotification(
            item.referenceType,
            referenceId,
        );

        if (!didNavigate) {
            unlock();
        }
    }, [markAsRead, navigateFromNotification, runWithNavigationLock, unlock]);

    const handleRefresh = async () => {
        await refetch();
    };

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
    const renderNotificationItem = useCallback(
        ({ item, index }: { item: NotificationResponse; index: number }) => (
            <Animated.View
                entering={reduceMotion ? undefined : FadeIn.duration(180)}
                exiting={reduceMotion ? undefined : FadeOut.duration(140)}
                layout={reduceMotion ? undefined : LinearTransition.duration(180)}
            >
                <MemoNotificationRow
                    item={item}
                    isLast={index === notifications.length - 1}
                    disabled={isLocked || isDeletingNotification || isDeletingAllNotifications}
                    isDeleting={isDeletingNotification}
                    onDelete={() => deleteNotification(item.id)}
                    onPress={() => {
                        void handleNotificationPress(item);
                    }}
                />
            </Animated.View>
        ),
        [deleteNotification, handleNotificationPress, isDeletingAllNotifications, isDeletingNotification, isLocked, notifications.length, reduceMotion],
    );

    return (
        <>
            <ConfirmSheet
                visible={isDeleteAllConfirmationOpen}
                title={t("notice.deleteAllTitle")}
                message={t("notice.deleteAllMessage")}
                confirmLabel={t("notice.deleteAll")}
                variant="danger"
                loading={isDeletingAllNotifications}
                onClose={() => {
                    if (!isDeletingAllNotifications) {
                        setIsDeleteAllConfirmationOpen(false);
                    }
                }}
                onConfirm={() => {
                    deleteAllNotifications(undefined, {
                        onSuccess: () => {
                            setIsDeleteAllConfirmationOpen(false);
                        },
                    });
                }}
            />

            <Screen scroll={false}>
            {isLoading ? (
                <CircleLoader fullScreen label={t("notice.loadingNotifications")} />
            ) : isError ? (
                <ErrorState
                    title={t("notice.failedNotificationsTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : notifications.length === 0 ? (
                <EmptyState
                    title={t("notice.noNotificationsTitle")}
                    message={t("notice.noNotificationsMessage")}
                    actionLabel={t("common.refresh", { defaultValue: "Refresh" })}
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderNotificationItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => {
                                void handleRefresh();
                            }}
                        />
                    }
                    contentContainerStyle={{
                        paddingBottom: 32,
                    }}
                    contentInsetAdjustmentBehavior="automatic"
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.4}
                    ListHeaderComponent={
                        <NoticeListHeader
                            count={notifications.length}
                            isUpdating={isFetching && !isFetchingNextPage}
                            t={t}
                        />
                    }
                    ListFooterComponent={
                        isFetchingNextPage ? <NoticeListFooter /> : null
                    }
                />
            )}
            </Screen>
        </>
    );
}

export default NoticeScreen;

function NoticeListHeader({
    count,
    isUpdating,
    t,
}: {
    count: number;
    isUpdating: boolean;
    t: (key: string, options?: Record<string, unknown>) => string;
}) {
    return (
        <View className="flex-row items-center justify-between pb-3">
            <AppText selectable variant="meta" className="text-foreground/75">
                {t("notice.notificationsCount", { count })}
            </AppText>

            {isUpdating ? (
                <AppText selectable variant="meta" className="text-foreground/75">
                    {t("notice.updating")}
                </AppText>
            ) : null}
        </View>
    );
}

function NotificationRow({
    item,
    isLast,
    disabled,
    isDeleting,
    onDelete,
    onPress,
}: {
    item: NotificationResponse;
    isLast: boolean;
    disabled: boolean;
    isDeleting: boolean;
    onDelete: () => void;
    onPress: () => void;
}) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const iconClassName = item.isRead
        ? "bg-muted"
        : "bg-primary/10";
    const iconColor = item.isRead
        ? colors.mutedForeground
        : colors.primary;

    return (
        <Swipeable
            friction={2}
            rightThreshold={32}
            renderRightActions={() => (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("notice.delete")}
                    disabled={disabled}
                    className={cn(
                        "w-24 items-center justify-center bg-danger",
                        disabled && "opacity-60",
                    )}
                    onPress={onDelete}
                >
                    <AppText variant="label" className="text-white">
                        {isDeleting ? t("notice.deleting") : t("notice.delete")}
                    </AppText>
                </Pressable>
            )}
        >
            <View className={cn("bg-background", !isLast && "border-b border-border")}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    className={cn("py-3 pr-4", disabled && "opacity-60")}
                    disabled={disabled}
                    style={({ pressed }) => getPressedScaleStyle(pressed, disabled, 0.995)}
                    onPress={onPress}
                >
                    <View className="flex-row items-start gap-3">
                    <View
                        className={cn(
                            "h-10 w-10 items-center justify-center rounded-xl",
                            iconClassName,
                        )}
                    >
                        <Bell
                            size={18}
                            color={iconColor}
                        />
                    </View>

                    <View className="min-w-0 flex-1 gap-1.5">
                        <AppText
                            selectable
                            variant="label"
                            className={cn(
                                "w-full font-semibold leading-5",
                                item.isRead
                                    ? "text-foreground/75"
                                    : "text-foreground",
                            )}
                        >
                            {item.title}
                        </AppText>

                        <AppText
                            selectable
                            variant="meta"
                            className={cn(
                                "leading-6",
                                item.isRead
                                    ? "text-foreground/70"
                                    : "text-foreground/85",
                            )}
                        >
                            {item.message}
                        </AppText>

                        {!item.isRead ? (
                            <AppText selectable variant="caption" className="text-primary">
                                {t("notice.unread")}
                            </AppText>
                        ) : null}

                        <AppText selectable variant="caption" className="self-end">
                            {formatRelativeTime(item.createdAt)}
                        </AppText>
                    </View>
                    </View>
                </Pressable>
            </View>
        </Swipeable>
    );
}

const MemoNotificationRow = memo(NotificationRow);

function NoticeListFooter() {
    return (
        <View className="py-5">
            <CircleLoader />
        </View>
    );
}
