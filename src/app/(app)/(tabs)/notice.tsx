import {
    AppText,
    CircleLoader,
    EmptyState,
    ErrorState,
    Screen,
} from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
    useGetNotifications,
    useMarkAllAsRead,
    useMarkAsRead,
} from "@/lib/hook/shared/useNotification";
import {
    NotificationResponse,
    type NotificationReferenceType,
} from "@/service/shared/notification-service";
import { formatRelativeTime } from "@/utils/relative-time";
import { useNavigation, useRouter } from "expo-router";
import React, { useCallback, useLayoutEffect } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

function NoticeScreen() {
    const router = useRouter();
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
                        accessibilityLabel="Mark all notifications as read"
                        disabled={isMarkingAllAsRead}
                        className={isMarkingAllAsRead ? "opacity-60" : "active:opacity-80"}
                        hitSlop={10}
                        onPress={() => {
                            markAllAsRead();
                        }}
                    >
                        <AppText variant="meta" className="text-primary">
                            {isMarkingAllAsRead ? "Marking..." : "Mark all read"}
                        </AppText>
                    </Pressable>
                ) : null,
        });
    }, [hasUnread, isMarkingAllAsRead, markAllAsRead, navigation]);

    const navigateFromNotification = (
        referenceType: NotificationReferenceType | null,
        referenceId: string,
    ) => {
        if (referenceType === "BOOKING_BAY") {
            router.push({
                pathname: "/reservation/[id]",
                params: {
                    id: referenceId,
                    type: "bay",
                },
            });
            return;
        }

        if (referenceType === "BOOKING_LESSON") {
            router.push({
                pathname: "/reservation/[id]",
                params: {
                    id: referenceId,
                    type: "lesson",
                },
            });
            return;
        }

        if (referenceType === "BOOKING") {
            router.push({
                pathname: "/reservation/[id]",
                params: {
                    id: referenceId,
                },
            });
        }
    };

    const handleNotificationPress = async (item: NotificationResponse) => {
        const referenceId =
            item.referenceId != null ? String(item.referenceId) : null;
        const didLock = runWithNavigationLock(() => {});

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
            navigateFromNotification(item.referenceType, referenceId);
        } catch (error) {
            unlock();
            throw error;
        }
    };

    const handleRefresh = async () => {
        await refetch();
    };

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
        <Screen scroll={false}>
            {isLoading ? (
                <CircleLoader fullScreen label="Loading notifications..." />
            ) : isError ? (
                <ErrorState
                    title="Failed to load notifications"
                    message="Pull to refresh and try again."
                    actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : notifications.length === 0 ? (
                <EmptyState
                    title="No notifications yet"
                    message="Updates and alerts will appear here."
                />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item, index }) => (
                        <NotificationRow
                            item={item}
                            isLast={index === notifications.length - 1}
                            disabled={isMarkingAsRead || isLocked}
                            onPress={() => {
                                void handleNotificationPress(item);
                            }}
                        />
                    )}
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
}: {
    count: number;
    isUpdating: boolean;
}) {
    return (
        <View className="flex-row items-center justify-between pb-3">
            <AppText selectable variant="meta" className="text-foreground/75">
                {count} notification{count !== 1 ? "s" : ""}
            </AppText>

            {isUpdating ? (
                <AppText selectable variant="meta" className="text-foreground/75">
                    Updating...
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
    return (
        <View className={isLast ? "" : "border-b border-border"}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.title}
                className={`py-3 ${disabled ? "opacity-60" : "active:opacity-80"}`}
                disabled={disabled}
                onPress={onPress}
            >
                <View className="flex-row items-start gap-3">
                    <View
                        className={`mt-1 h-2.5 w-2.5 rounded-full ${item.isRead ? "bg-border" : "bg-primary"}`}
                    />

                    <View className="min-w-0 flex-1 gap-1.5">
                        <View className="flex-row items-start justify-between gap-3">
                            <AppText
                                selectable
                                variant="body"
                                className={item.isRead ? "min-w-0 flex-1 text-sm text-foreground/75" : "min-w-0 flex-1 text-sm text-foreground"}
                            >
                                {item.title}
                            </AppText>

                            <AppText selectable variant="caption" className="shrink-0">
                                {formatRelativeTime(item.createdAt)}
                            </AppText>
                        </View>

                        <AppText
                            selectable
                            variant="subtext"
                            className={item.isRead ? "text-sm text-foreground/70" : "text-sm text-foreground/85"}
                        >
                            {item.message}
                        </AppText>

                        {!item.isRead ? (
                            <AppText selectable variant="caption" className="text-primary">
                                Unread
                            </AppText>
                        ) : null}
                    </View>
                </View>
            </Pressable>
        </View>
    );
}

function NoticeListFooter() {
    return (
        <View className="py-5">
            <CircleLoader />
        </View>
    );
}
