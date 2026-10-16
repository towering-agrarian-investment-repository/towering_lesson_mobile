import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { defaultMinSize, fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame, interactiveDismissDisabled, presentationCornerRadius } from "@expo/ui/swift-ui/modifiers";
import {
    CircleLoader,
    cn,
    EmptyState,
    ErrorState,
    getPressedScaleStyle,
    Screen,
    useThemeColors,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import {
    useDeleteAllNotifications,
    useDeleteNotification,
    useGetNotifications,
    useMarkAllAsRead,
    useMarkAsRead,
} from "@/lib/hook/shared/useNotification";
import { getMemberLessonLogByIdQueryOptions } from "@/lib/hook/useLessonLog";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { getMemberReservationDetailQueryOptions } from "@/lib/hook/useReservation";
import {
    NotificationResponse,
    type NotificationReferenceType,
} from "@/service/shared/notification-service";
import { formatRelativeTime } from "@/utils/relative-time";
import { BottomSheet, Button, Column, Host, RNHostView, Row, Text, Spacer } from "@expo/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRouter } from "expo-router";
import { Bell, MoreVertical } from "lucide-react-native";
import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
    useReducedMotion,
} from "react-native-reanimated";

function NoticeScreen() {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
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
    const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } =
        useMarkAllAsRead();
    const { mutate: deleteNotification, isPending: isDeletingNotification } =
        useDeleteNotification();
    const {
        mutate: deleteAllNotifications,
        isPending: isDeletingAllNotifications,
    } = useDeleteAllNotifications();
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const [isDeleteAllConfirmationOpen, setIsDeleteAllConfirmationOpen] = useState(false);
    const deleteAllLocked = useRef(false);
    const closeDeleteAllSheet = () => { if (!deleteAllLocked.current) setIsDeleteAllConfirmationOpen(false); };
    const confirmDeleteAll = () => {
        if (deleteAllLocked.current || isDeletingAllNotifications) return;
        deleteAllLocked.current = true;
        deleteAllNotifications(undefined, {
            onSuccess: () => setIsDeleteAllConfirmationOpen(false),
            onSettled: () => { deleteAllLocked.current = false; },
        });
    };

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
                            disabled={
                                isMarkingAllAsRead || isDeletingAllNotifications
                            }
                            className={
                                isMarkingAllAsRead ? "opacity-60" : undefined
                            }
                            hitSlop={10}
                            style={({ pressed }) =>
                                getPressedScaleStyle(
                                    pressed,
                                    isMarkingAllAsRead,
                                    0.99,
                                )
                            }
                            onPress={() => {
                                markAllAsRead();
                            }}
                        >
                            <Host matchContents ignoreSafeArea="all">
                                <Text
                                    textStyle={{
                                        ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                                        color: uiColors.primary,
                                        fontSize:
                                            typography.meta.fontSize *
                                            uiFontScale,
                                    }}
                                >
                                    {isMarkingAllAsRead
                                        ? t("notice.marking")
                                        : t("notice.markAllRead")}
                                </Text>
                            </Host>
                        </Pressable>
                    ) : null}
                    {notifications.length > 0 ? (
                        <View className="relative">
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={t("notice.moreActions", {
                                    defaultValue: "More actions",
                                })}
                                disabled={
                                    isDeletingAllNotifications ||
                                    isMarkingAllAsRead
                                }
                                className={
                                    isDeletingAllNotifications
                                        ? "opacity-60"
                                        : undefined
                                }
                                hitSlop={10}
                                style={({ pressed }) =>
                                    getPressedScaleStyle(
                                        pressed,
                                        isDeletingAllNotifications,
                                        0.99,
                                    )
                                }
                                onPress={() =>
                                    setIsActionsMenuOpen((open) => !open)
                                }
                            >
                                <MoreVertical
                                    size={22}
                                    color={colors.foreground}
                                />
                            </Pressable>

                            <Modal
                                transparent
                                visible={isActionsMenuOpen}
                                animationType="fade"
                                onRequestClose={() =>
                                    setIsActionsMenuOpen(false)
                                }
                            >
                                <Pressable
                                    className="flex-1"
                                    onPress={() => setIsActionsMenuOpen(false)}
                                >
                                    <View className="absolute right-4 top-16 w-44 rounded-xl border border-border bg-card p-1 shadow-lg">
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={t(
                                                "notice.deleteAll",
                                            )}
                                            disabled={
                                                isDeletingAllNotifications
                                            }
                                            className="rounded-lg px-3 py-2 active:bg-muted"
                                            onPress={() => {
                                                setIsActionsMenuOpen(false);
                                                setIsDeleteAllConfirmationOpen(true);
                                            }}
                                        >
                                            <Host
                                                matchContents
                                                ignoreSafeArea="all"
                                            >
                                                <Text
                                                    textStyle={{
                                                        ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                                        color: uiColors.danger,
                                                        fontSize:
                                                            typography.label
                                                                .fontSize *
                                                            uiFontScale,
                                                    }}
                                                >
                                                    {isDeletingAllNotifications
                                                        ? t("notice.deleting")
                                                        : t("notice.deleteAll")}
                                                </Text>
                                            </Host>
                                        </Pressable>
                                    </View>
                                </Pressable>
                            </Modal>
                        </View>
                    ) : null}
                </View>
            ),
        });
    }, [
        colors.foreground,
        deleteAllNotifications,
        hasUnread,
        isActionsMenuOpen,
        isDeletingAllNotifications,
        isMarkingAllAsRead,
        markAllAsRead,
        navigation,
        notifications.length,
        uiColors,
        uiFontScale,
        t,
    ]);

    const navigateFromNotification = useCallback(
        (
            referenceType: NotificationReferenceType | null,
            referenceId: string,
        ) => {
            if (referenceType === "BOOKING_BAY") {
                void queryClient.prefetchQuery(
                    getMemberReservationDetailQueryOptions(
                        Number(referenceId),
                        "bay",
                    ),
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
                    getMemberReservationDetailQueryOptions(
                        Number(referenceId),
                        "lesson",
                    ),
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
        },
        [queryClient, router],
    );

    const handleNotificationPress = useCallback(
        (item: NotificationResponse) => {
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
        },
        [markAsRead, navigateFromNotification, runWithNavigationLock, unlock],
    );

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
                layout={
                    reduceMotion ? undefined : LinearTransition.duration(180)
                }
            >
                <MemoNotificationRow
                    item={item}
                    isLast={index === notifications.length - 1}
                    disabled={
                        isLocked ||
                        isDeletingNotification ||
                        isDeletingAllNotifications
                    }
                    isDeleting={isDeletingNotification}
                    onDelete={() => deleteNotification(item.id)}
                    onPress={() => {
                        void handleNotificationPress(item);
                    }}
                />
            </Animated.View>
        ),
        [
            deleteNotification,
            handleNotificationPress,
            isDeletingAllNotifications,
            isDeletingNotification,
            isLocked,
            notifications.length,
            reduceMotion,
        ],
    );

    return (
        <>
            <BottomSheet
                isPresented={isDeleteAllConfirmationOpen}
                onDismiss={closeDeleteAllSheet}
                shouldDismissOnBackPress={!isDeletingAllNotifications}
                shouldDismissOnClickOutside={!isDeletingAllNotifications}
                modifiers={process.env.EXPO_OS === "ios" ? [interactiveDismissDisabled(isDeletingAllNotifications), presentationCornerRadius(24)] : undefined}
                containerColor={uiColors.card}
                contentColor={uiColors.foreground}
                contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
            >
                <Column spacing={20} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity })] : [fillMaxWidth()]}>
                    <Column spacing={8} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity })] : [fillMaxWidth()]}>
                        <Text textStyle={{ ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale, color: uiColors.danger, fontSize: typography.h3.fontSize * uiFontScale }}>{t("notice.deleteAllTitle")}</Text>
                        <Text textStyle={{ ...typography.muted, lineHeight: typography.muted.lineHeight * uiFontScale, color: uiColors.mutedForeground, fontSize: typography.muted.fontSize * uiFontScale }}>{t("notice.deleteAllMessage")}</Text>
                    </Column>
                    <Column spacing={12} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity })] : [fillMaxWidth()]}>
                        <Button variant="text" disabled={isDeletingAllNotifications} onPress={confirmDeleteAll} style={getNativeButtonStyle(uiColors, "filled", isDeletingAllNotifications, uiColors.danger)} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })]}>
                            <Row spacing={8} alignment="center" modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth()]}>
                                <Spacer flexible />
                                {isDeletingAllNotifications ? <RNHostView matchContents><ActivityIndicator color={uiColors.primaryForeground} /></RNHostView> : null}
                                <Text textStyle={{ textAlign: "center", ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale, fontWeight: "600", color: uiColors.primaryForeground, fontSize: typography.label.fontSize * uiFontScale }}>{t("notice.deleteAll")}</Text>
                                <Spacer flexible />
                            </Row>
                        </Button>
                        <Button variant="text" disabled={isDeletingAllNotifications} onPress={closeDeleteAllSheet} style={getNativeButtonStyle(uiColors, "text", isDeletingAllNotifications)} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })]}>
                            <Text modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth()]} textStyle={{ ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale, fontWeight: "600", color: uiColors.foreground, fontSize: typography.label.fontSize * uiFontScale, textAlign: "center" }}>{t("common.cancel")}</Text>
                        </Button>
                    </Column>
                </Column>
            </BottomSheet>
            <Screen scroll={false}>
                {isLoading ? (
                    <CircleLoader fullScreen />
                ) : isError ? (
                    <ErrorState
                        title={t("notice.failedNotificationsTitle")}
                        message={t("common.pullToRefreshAndTryAgain")}
                        actionLabel={
                            isRefetching
                                ? t("common.refreshing")
                                : t("common.refreshTryAgain")
                        }
                        onAction={() => {
                            void refetch();
                        }}
                    />
                ) : notifications.length === 0 ? (
                    <EmptyState
                        title={t("notice.noNotificationsTitle")}
                        message={t("notice.noNotificationsMessage")}
                        actionLabel={t("common.refresh", {
                            defaultValue: "Refresh",
                        })}
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
                            isFetchingNextPage ? (
                                <NoticeListFooter />
                            ) : undefined
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    return (
        <View className="flex-row items-center justify-between pb-3">
            <Host matchContents ignoreSafeArea="all">
                <Text
                    textStyle={{
                        ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                        color: uiColors.foreground + "bf",
                        fontSize: typography.meta.fontSize * uiFontScale,
                    }}
                >
                    {t("notice.notificationsCount", { count })}
                </Text>
            </Host>

            {isUpdating ? (
                <Host matchContents ignoreSafeArea="all">
                    <Text
                        textStyle={{
                            ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                            color: uiColors.foreground + "bf",
                            fontSize: typography.meta.fontSize * uiFontScale,
                        }}
                    >
                        {t("notice.updating")}
                    </Text>
                </Host>
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const colors = useThemeColors();
    const iconClassName = item.isRead ? "bg-muted" : "bg-primary/10";
    const iconColor = item.isRead ? colors.mutedForeground : colors.primary;

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
                    <Host matchContents ignoreSafeArea="all">
                        <Text
                            textStyle={{
                                ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                color: "#ffffff",
                                fontSize:
                                    typography.label.fontSize * uiFontScale,
                            }}
                        >
                            {isDeleting
                                ? t("notice.deleting")
                                : t("notice.delete")}
                        </Text>
                    </Host>
                </Pressable>
            )}
        >
            <View
                className={cn(
                    "bg-background",
                    !isLast && "border-b border-border",
                )}
            >
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    className={cn("py-3 pr-4", disabled && "opacity-60")}
                    disabled={disabled}
                    style={({ pressed }) =>
                        getPressedScaleStyle(pressed, disabled, 0.995)
                    }
                    onPress={onPress}
                >
                    <View className="flex-row items-start gap-3">
                        <View
                            className={cn(
                                "h-10 w-10 items-center justify-center rounded-xl",
                                iconClassName,
                            )}
                        >
                            <Bell size={18} color={iconColor} />
                        </View>

                        <View className="min-w-0 flex-1 gap-1.5">
                            <Host
                                matchContents={{ vertical: true }}
                                ignoreSafeArea="all"
                                style={{ width: "100%" }}
                            >
                                <Text
                                    textStyle={{
                                        ...typography.label,
                                        fontWeight: "600" as const,
                                        lineHeight: typography.subtext.lineHeight * uiFontScale,
                                        color: item.isRead
                                            ? uiColors.foreground + "bf"
                                            : uiColors.foreground,
                                        fontSize:
                                            typography.label.fontSize *
                                            uiFontScale,
                                    }}
                                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                    {item.title}
                                </Text>
                            </Host>

                            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                <Text
                                    textStyle={{
                                        ...typography.meta,
                                        lineHeight: typography.body.lineHeight * uiFontScale,
                                        color: item.isRead
                                            ? uiColors.foreground + "b3"
                                            : uiColors.foreground + "d9",
                                        fontSize:
                                            typography.meta.fontSize *
                                            uiFontScale,
                                    }}
                                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                    {item.message}
                                </Text>
                            </Host>

                            {!item.isRead ? (
                                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                    <Text
                                        textStyle={{
                                            ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                            color: uiColors.primary,
                                            fontSize:
                                                typography.caption.fontSize *
                                                uiFontScale,
                                        }}
                                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                        {t("notice.unread")}
                                    </Text>
                                </Host>
                            ) : null}

                            <Host
                                matchContents
                                ignoreSafeArea="all"
                                style={{ alignSelf: "flex-end" }}
                            >
                                <Text
                                    textStyle={{
                                        ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                        color: uiColors.mutedForeground,
                                        fontSize:
                                            typography.caption.fontSize *
                                            uiFontScale,
                                    }}
                                >
                                    {formatRelativeTime(item.createdAt)}
                                </Text>
                            </Host>
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
