import {
    AppText,
    CircleLoader,
    cn,
    EmptyState,
    ErrorState,
    getPressedScaleStyle,
    Screen,
    useThemeColors,
} from "@/design-system";
import {
    useGetNotifications,
    useMarkAllAsRead,
    useMarkAsRead,
} from "@/lib/hook/shared/useNotification";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { getMemberReservationDetailQueryOptions } from "@/lib/hook/useReservation";
import {
    NotificationResponse,
    type NotificationReferenceType,
} from "@/service/shared/notification-service";
import { useQueryClient } from "@tanstack/react-query";
import { formatRelativeTime } from "@/utils/relative-time";
import { useNavigation, useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { memo, useCallback, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

function NoticeScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const navigation = useNavigation();
    const { isLocked, runWithNavigationLock, unlock } = useNavigationLock();
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
    const { mutateAsync: markAsRead, isPending: isMarkingAsRead } = useMarkAsRead();
    const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } = useMarkAllAsRead();

    const notifications = data?.items ?? [];
    const hasUnread = notifications.some((item) => !item.isRead);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () =>
                hasUnread ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t("notice.markAllAsRead")}
                        disabled={isMarkingAllAsRead}
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
                ) : null,
        });
    }, [hasUnread, isMarkingAllAsRead, markAllAsRead, navigation]);

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

        return false;
    }, [queryClient, router]);

    const handleNotificationPress = useCallback(async (item: NotificationResponse) => {
        const referenceId =
            item.referenceId != null ? String(item.referenceId) : null;
        const didLock = runWithNavigationLock(() => { });

        if (!didLock) {
            return;
        }

        try {
            if (!item.isRead) {
                await markAsRead(item.id);
            }
        } catch {
            unlock();
            return;
        }

        if (!referenceId) {
            unlock();
            return;
        }

        try {
            const didNavigate = navigateFromNotification(
                item.referenceType,
                referenceId,
            );

            if (!didNavigate) {
                unlock();
            }
        } catch (error) {
            unlock();
            throw error;
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
            <MemoNotificationRow
                item={item}
                isLast={index === notifications.length - 1}
                disabled={isMarkingAsRead || isLocked}
                onPress={() => {
                    void handleNotificationPress(item);
                }}
            />
        ),
        [handleNotificationPress, isLocked, isMarkingAsRead, notifications.length],
    );

    return (
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
                    actionLabel={t("common.refreshTryAgain")}
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
    onPress,
}: {
    item: NotificationResponse;
    isLast: boolean;
    disabled: boolean;
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
        <View className={cn(!isLast && "border-b border-border")}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.title}
                className={cn("py-3", disabled && "opacity-60")}
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
                        <View className="flex-row items-start justify-between gap-3">
                            <AppText
                                selectable
                                variant="label"
                                className={cn(
                                    "min-w-0 flex-1 font-semibold leading-5",
                                    item.isRead
                                        ? "text-foreground/75"
                                        : "text-foreground",
                                )}
                            >
                                {item.title}
                            </AppText>

                            <AppText selectable variant="caption" className="shrink-0">
                                {formatRelativeTime(item.createdAt)}
                            </AppText>
                        </View>

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
                    </View>
                </View>
            </Pressable>
        </View>
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
