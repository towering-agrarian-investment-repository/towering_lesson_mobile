import { PendingBottomSheet } from "@/design-system/components/PendingBottomSheet";
import {
  CircleLoader,
  cn,
  EmptyState,
  ErrorState,
  getPressedScaleStyle,
  Screen,
} from "@/design-system";
import { NativeText } from "@/design-system/components/NativeText";
import { AppText } from "@/design-system/components/AppText";
import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
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
import {
  Button,
  Column,
  Host,
  RNHostView,
  Row,
  Spacer,
  Text,
} from "@expo/ui";
import {
  defaultMinSize,
  fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import {
  frame,
  presentationCornerRadius,
} from "@expo/ui/swift-ui/modifiers";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRouter } from "expo-router";
import { Bell, MoreVertical } from "lucide-react-native";
import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { FlatList, RefreshControl } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

const isIOS = process.env.EXPO_OS === "ios";
const fullWidth = isIOS ? [frame({ maxWidth: Infinity })] : [fillMaxWidth()];
const buttonSize = isIOS
  ? [frame({ maxWidth: Infinity, minHeight: 48 })]
  : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })];
const buttonInnerSize = isIOS
  ? [frame({ maxWidth: Infinity, minHeight: 48 })]
  : [fillMaxWidth()];

function NoticeScreen() {
  const { colors, fontScale: uiFontScale } = useTheme();
  const insets = useSafeAreaInsets();
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
    isFetchNextPageError,
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
  const [isDeleteAllConfirmationOpen, setIsDeleteAllConfirmationOpen] =
    useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const refreshLocked = useRef(false);
  const deleteAllLocked = useRef(false);
  const closeDeleteAllSheet = () => {
    if (!deleteAllLocked.current) setIsDeleteAllConfirmationOpen(false);
  };
  const confirmDeleteAll = () => {
    if (deleteAllLocked.current || isDeletingAllNotifications) return;
    deleteAllLocked.current = true;
    deleteAllNotifications(undefined, {
      onSuccess: () => setIsDeleteAllConfirmationOpen(false),
      onSettled: () => {
        deleteAllLocked.current = false;
      },
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
              disabled={isMarkingAllAsRead || isDeletingAllNotifications}
              className={isMarkingAllAsRead ? "opacity-60" : undefined}
              hitSlop={10}
              style={({ pressed }) =>
                getPressedScaleStyle(pressed, isMarkingAllAsRead, 0.99)
              }
              onPress={() => {
                markAllAsRead();
              }}
            >
              <NativeText variant="meta" color="primary" wrap={false}>
                {isMarkingAllAsRead
                  ? t("notice.marking")
                  : t("notice.markAllRead")}
              </NativeText>
            </Pressable>
          ) : null}
          {notifications.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("notice.moreActions", {
                defaultValue: "More actions",
              })}
              disabled={isDeletingAllNotifications || isMarkingAllAsRead}
              className={isDeletingAllNotifications ? "opacity-60" : undefined}
              hitSlop={10}
              style={({ pressed }) =>
                getPressedScaleStyle(pressed, isDeletingAllNotifications, 0.99)
              }
              onPress={() => setIsActionsMenuOpen(true)}
            >
              <MoreVertical size={22} color={colors.foreground} />
            </Pressable>
          ) : null}
        </View>
      ),
    });
  }, [
    colors.foreground,
    hasUnread,
    isDeletingAllNotifications,
    isMarkingAllAsRead,
    markAllAsRead,
    navigation,
    notifications.length,
    t,
  ]);

  const navigateFromNotification = useCallback(
    (referenceType: NotificationReferenceType | null, referenceId: string) => {
      if (
        referenceType === "BOOKING_BAY" ||
        referenceType === "BOOKING_LESSON"
      ) {
        const reservationType =
          referenceType === "BOOKING_BAY" ? "bay" : "lesson";
        const reservationId = Number(referenceId);

        if (Number.isFinite(reservationId)) {
          void queryClient.prefetchQuery(
            getMemberReservationDetailQueryOptions(
              reservationId,
              reservationType,
            ),
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
      const didLock = runWithNavigationLock(() => {});

      if (!didLock) {
        return;
      }

      if (!item.isRead) {
        void markAsRead(item.id).catch(() => {});
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
    if (refreshLocked.current || isFetching) return;
    refreshLocked.current = true;
    setIsPullRefreshing(true);
    try {
      await Promise.all([
        refetch({ cancelRefetch: false }),
        queryClient.invalidateQueries({
          queryKey: ["notifications", "unread-count"],
          exact: true,
        }),
      ]);
    } finally {
      refreshLocked.current = false;
      setIsPullRefreshing(false);
    }
  };

  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetching && !refreshLocked.current) {
      void fetchNextPage({ cancelRefetch: false });
    }
  }, [fetchNextPage, hasNextPage, isFetching]);

  const handleEndReached = useCallback(() => {
    if (!isFetchNextPageError) handleFetchNextPage();
  }, [handleFetchNextPage, isFetchNextPageError]);

  const renderNotificationItem = useCallback(
    ({ item, index }: { item: NotificationResponse; index: number }) => (
      <MemoNotificationRow
        item={item}
        isLast={index === notifications.length - 1}
        disabled={
          isLocked || isDeletingNotification || isDeletingAllNotifications
        }
        isDeleting={isDeletingNotification}
        onDelete={deleteNotification}
        onPress={handleNotificationPress}
      />
    ),
    [
      deleteNotification,
      handleNotificationPress,
      isDeletingAllNotifications,
      isDeletingNotification,
      isLocked,
      notifications.length,
    ],
  );

  return (
    <>
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
          <View
            className="absolute top-16 w-44 rounded-xl border border-border bg-card p-1 shadow-lg"
            style={{ right: Math.max(insets.right, 16) }}
          >
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
              <NativeText variant="label" color="danger" wrap={false}>
                {isDeletingAllNotifications
                  ? t("notice.deleting")
                  : t("notice.deleteAll")}
              </NativeText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <PendingBottomSheet
        isPresented={isDeleteAllConfirmationOpen}
        onDismiss={closeDeleteAllSheet}
        dismissDisabled={isDeletingAllNotifications}
        modifiers={
          isIOS
            ? [
                presentationCornerRadius(24),
              ]
            : undefined
        }
        containerColor={colors.card}
        contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
      >
        <Column spacing={20} modifiers={fullWidth}>
          <Column spacing={8} modifiers={fullWidth}>
            <Text
              textStyle={{
                ...typography.h3,
                lineHeight: typography.h3.lineHeight * uiFontScale,
                color: colors.danger,
                fontSize: typography.h3.fontSize * uiFontScale,
              }}
            >
              {t("notice.deleteAllTitle")}
            </Text>
            <Text
              textStyle={{
                ...typography.muted,
                lineHeight: typography.muted.lineHeight * uiFontScale,
                color: colors.mutedForeground,
                fontSize: typography.muted.fontSize * uiFontScale,
              }}
            >
              {t("notice.deleteAllMessage")}
            </Text>
          </Column>

          <Column spacing={12} modifiers={fullWidth}>
            <Button
              variant="text"
              disabled={isDeletingAllNotifications}
              onPress={confirmDeleteAll}
              style={getNativeButtonStyle(
                colors,
                "filled",
                isDeletingAllNotifications,
                colors.danger,
              )}
              modifiers={buttonSize}
            >
              <Row spacing={8} alignment="center" modifiers={buttonInnerSize}>
                <Spacer flexible />
                {isDeletingAllNotifications ? (
                  <RNHostView matchContents>
                    <ActivityIndicator color={colors.primaryForeground} />
                  </RNHostView>
                ) : null}
                <Text
                  textStyle={{
                    textAlign: "center",
                    ...typography.label,
                    lineHeight: typography.label.lineHeight * uiFontScale,
                    fontWeight: "600",
                    color: colors.primaryForeground,
                    fontSize: typography.label.fontSize * uiFontScale,
                  }}
                >
                  {t("notice.deleteAll")}
                </Text>
                <Spacer flexible />
              </Row>
            </Button>

            <Button
              variant="text"
              disabled={isDeletingAllNotifications}
              onPress={closeDeleteAllSheet}
              style={getNativeButtonStyle(
                colors,
                "text",
                isDeletingAllNotifications,
              )}
              modifiers={buttonSize}
            >
              <Text
                modifiers={buttonInnerSize}
                textStyle={{
                  ...typography.label,
                  lineHeight: typography.label.lineHeight * uiFontScale,
                  fontWeight: "600",
                  color: colors.foreground,
                  fontSize: typography.label.fontSize * uiFontScale,
                  textAlign: "center",
                }}
              >
                {t("common.cancel")}
              </Text>
            </Button>
          </Column>
        </Column>
      </PendingBottomSheet>

      <Screen scroll={false} bottomPadding={0}>
        {isLoading ? (
          <CircleLoader fullScreen />
        ) : isError && !data ? (
          <ErrorState
            title={t("notice.failedNotificationsTitle")}
            message={t("common.pullToRefreshAndTryAgain")}
            actionLabel={
              isRefetching
                ? t("common.refreshing")
                : t("common.refreshTryAgain")
            }
            actionPending={isRefetching}
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
            actionPending={isRefetching}
            onAction={() => {
              void refetch();
            }}
          />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={notifications}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderNotificationItem}
            refreshControl={
              <RefreshControl
                refreshing={isPullRefreshing}
                onRefresh={() => {
                  void handleRefresh();
                }}
              />
            }
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

function NoticeListHeader({
  count,
  isUpdating,
}: {
  count: number;
  isUpdating: boolean;
}) {
  const { colors: uiColors } = useTheme();
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center justify-between pb-3">
      <NativeText
        variant="meta"
        wrap={false}
        textStyle={{ color: uiColors.foreground + "bf" }}
      >
        {t("notice.notificationsCount", { count })}
      </NativeText>

      {isUpdating ? (
        <NativeText
          variant="meta"
          wrap={false}
          textStyle={{ color: uiColors.foreground + "bf" }}
        >
          {t("notice.updating")}
        </NativeText>
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
  onDelete: (id: number) => void;
  onPress: (item: NotificationResponse) => void;
}) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const iconClassName = item.isRead ? "bg-muted" : "bg-primary/10";
  const iconColor = item.isRead ? colors.mutedForeground : colors.primary;

  return (
    <Swipeable
      enabled={!disabled}
      friction={2}
      dragOffsetFromLeft={24}
      dragOffsetFromRight={-24}
      rightThreshold={48}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("notice.delete")}
          disabled={disabled}
          className={cn(
            "w-24 items-center justify-center bg-danger",
            disabled && "opacity-60",
          )}
          onPress={() => onDelete(item.id)}
        >
          <AppText
            variant="label"
            wrap={false}
            color="primaryForeground"
          >
            {isDeleting ? t("notice.deleting") : t("notice.delete")}
          </AppText>
        </Pressable>
      )}
    >
      <View
        className={cn("bg-background", !isLast && "border-b border-border")}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.title}
          className={cn("py-3 pr-4", disabled && "opacity-60")}
          disabled={disabled}
          style={({ pressed }) =>
            getPressedScaleStyle(pressed, disabled, 0.995)
          }
          onPress={() => onPress(item)}
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
              <AppText
                variant="label"
                className={item.isRead ? "text-foreground/75" : "text-foreground"}
                textStyle={{
                  fontWeight: "600" as const,
                  lineHeight: typography.subtext.lineHeight,
                }}
              >
                {item.title}
              </AppText>

              <AppText
                variant="meta"
                className={item.isRead ? "text-foreground/70" : "text-foreground/85"}
                textStyle={{
                  lineHeight: typography.body.lineHeight,
                }}
              >
                {item.message}
              </AppText>

              {!item.isRead ? (
                <AppText variant="caption" color="primary">
                  {t("notice.unread")}
                </AppText>
              ) : null}

              <AppText
                variant="caption"
                color="mutedForeground"
                wrap={false}
                style={{ alignSelf: "flex-end" }}
              >
                {formatRelativeTime(item.createdAt, i18n.resolvedLanguage ?? i18n.language)}
              </AppText>
            </View>
          </View>
        </Pressable>
      </View>
    </Swipeable>
  );
}

const MemoNotificationRow = memo(NotificationRow);

function NoticeListFooter({ onRetry }: { onRetry?: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View className="items-center gap-3 py-5">
      {onRetry ? (
        <>
          <NativeText variant="meta" color="mutedForeground" align="center">
            {t("notice.failedMoreTitle", {
              defaultValue: "Couldn't load more notifications",
            })}
          </NativeText>
          <Host matchContents={{ vertical: true }} style={{ width: "100%" }}>
            <Button
              variant="outlined"
              label={t("common.refreshTryAgain")}
              onPress={onRetry}
              style={getNativeButtonStyle(colors, "outlined")}
              modifiers={buttonSize}
            />
          </Host>
        </>
      ) : (
        <CircleLoader />
      )}
    </View>
  );
}
