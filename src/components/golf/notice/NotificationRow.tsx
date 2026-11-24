import { ActionButton, AnimatedPressable, cn, Skeleton } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import type { NotificationResponse } from "@/service/shared/notification-service";
import { formatRelativeTime } from "@/utils/relative-time";
import { Bell, BellOff, X } from "lucide-react-native";
import { memo, useCallback, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

export function NotificationSeparator() {
    return <View className="h-px bg-border" />;
}

export function NotificationSectionHeader({ label }: { label: string }) {
    return (
        <View accessibilityRole="header" className="bg-background pb-2 pt-3">
            <AppText variant="subtext" color="mutedForeground" textStyle={{ fontWeight: "600" }}>
                {label}
            </AppText>
        </View>
    );
}

export function NoticeListHeader({
    count,
    isUpdating,
    showPermissionBanner,
    onOpenSettings,
    onDismissPermissionBanner,
}: {
    count: string | number;
    isUpdating: boolean;
    showPermissionBanner: boolean;
    onOpenSettings: () => void;
    onDismissPermissionBanner: () => void;
}) {
    const { colors: uiColors } = useTheme();
    const { t } = useTranslation();

    return (
        <View className="pb-3">
            {showPermissionBanner ? (
                <View className="mb-3 gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3">
                    <View className="flex-row items-start gap-2">
                        <BellOff size={16} color={uiColors.warning} strokeWidth={2} />
                        <AppText variant="subtext" color="warning" style={{ flex: 1, minWidth: 0 }}>
                            {t("profile.notificationsDenied")}
                        </AppText>
                        <AnimatedPressable
                            accessibilityRole="button"
                            accessibilityLabel={t("common.closeTitle", {
                                title: t("profile.notificationsDenied"),
                            })}
                            className="min-h-6 min-w-6 items-center justify-center"
                            hitSlop={8}
                            onPress={onDismissPermissionBanner}
                        >
                            <X size={16} color={uiColors.mutedForeground} strokeWidth={2} />
                        </AnimatedPressable>
                    </View>
                    <AnimatedPressable
                        accessibilityRole="button"
                        className="self-start rounded-md bg-warning/20 px-3 py-1.5"
                        onPress={onOpenSettings}
                    >
                        <AppText variant="badge" color="warning">
                            {t("common.openSettings")}
                        </AppText>
                    </AnimatedPressable>
                </View>
            ) : null}
            <View className="flex-row items-center justify-between">
                <AppText variant="subtext" wrap={false} textStyle={{ color: uiColors.mutedForeground }}>
                    {t("notice.notificationsCount", { count })}
                </AppText>

                {isUpdating ? (
                    <AppText variant="subtext" wrap={false} textStyle={{ color: uiColors.mutedForeground }}>
                        {t("notice.updating")}
                    </AppText>
                ) : null}
            </View>
        </View>
    );
}

function NotificationRow({
    item,
    disabled,
    isDeleting,
    onDelete,
    onPress,
    onSwipeableReset,
    onSwipeableWillOpen,
}: {
    item: NotificationResponse;
    disabled: boolean;
    isDeleting: boolean;
    onDelete: (id: number) => void;
    onPress: (item: NotificationResponse) => void;
    onSwipeableReset: (methods: SwipeableMethods) => void;
    onSwipeableWillOpen: (methods: SwipeableMethods) => void;
}) {
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const swipeableRef = useRef<SwipeableMethods | null>(null);
    const lastItemIdRef = useRef(item.id);
    const iconClassName = item.isRead ? "bg-muted" : "bg-primary/10";
    const iconColor = item.isRead ? colors.mutedForeground : colors.primary;

    useLayoutEffect(() => {
        if (lastItemIdRef.current !== item.id) {
            lastItemIdRef.current = item.id;
            if (swipeableRef.current) {
                onSwipeableReset(swipeableRef.current);
                swipeableRef.current.reset();
            }
        }
    }, [item.id, onSwipeableReset]);

    const handleWillOpen = useCallback(() => {
        if (swipeableRef.current) {
            onSwipeableWillOpen(swipeableRef.current);
        }
    }, [onSwipeableWillOpen]);

    const renderRightActions = useCallback(
        () => (
            <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={t("notice.delete")}
                disabled={disabled}
                className={cn("w-24 items-center justify-center bg-danger", disabled && "opacity-60")}
                onPress={() => onDelete(item.id)}
            >
                <AppText variant="label" wrap={false} color="dangerForeground">
                    {isDeleting ? t("notice.deleting") : t("notice.delete")}
                </AppText>
            </AnimatedPressable>
        ),
        [disabled, isDeleting, item.id, onDelete, t],
    );

    return (
        <Swipeable
            ref={swipeableRef}
            enabled={!disabled}
            friction={1}
            overshootLeft={false}
            overshootFriction={8}
            dragOffsetFromLeft={10}
            dragOffsetFromRight={-10}
            rightThreshold={32}
            onSwipeableWillOpen={handleWillOpen}
            renderRightActions={renderRightActions}
        >
            <View className="bg-background">
                <AnimatedPressable
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    haptic="selection"
                    className={cn("py-3 pr-4", disabled && "opacity-60")}
                    disabled={disabled}
                    onPress={() => onPress(item)}
                >
                    <View className="flex-row items-start gap-3">
                        <View className={cn("h-10 w-10 items-center justify-center rounded-xl", iconClassName)}>
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
                                variant="subtext"
                                className={item.isRead ? "text-foreground/70" : "text-foreground/85"}
                                textStyle={{
                                    lineHeight: typography.body.lineHeight,
                                }}
                            >
                                {item.message}
                            </AppText>

                            <View className="flex-row items-center justify-between gap-2">
                                {!item.isRead ? (
                                    <AppText variant="caption" color="primary" wrap={false}>
                                        {t("notice.unread")}
                                    </AppText>
                                ) : (
                                    <View />
                                )}

                                <AppText variant="caption" color="mutedForeground" wrap={false}>
                                    {formatRelativeTime(item.createdAt, i18n.resolvedLanguage ?? i18n.language)}
                                </AppText>
                            </View>
                        </View>
                    </View>
                </AnimatedPressable>
            </View>
        </Swipeable>
    );
}

export const MemoNotificationRow = memo(NotificationRow);

function NotificationRowSkeleton() {
    return (
        <View className="flex-row items-start gap-3 py-3 pr-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <View className="min-w-0 flex-1 gap-2">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
            </View>
        </View>
    );
}

export function NotificationListSkeleton() {
    return (
        <ScrollView
            className="flex-1"
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
        >
            <View className="pt-2">
                {Array.from({ length: 6 }, (_, index) => (
                    <View key={index} className={index < 5 ? "border-b border-border" : undefined}>
                        <NotificationRowSkeleton />
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

export function NoticeListFooter({ onRetry }: { onRetry?: () => void }) {
    const { t } = useTranslation();

    if (!onRetry) {
        return (
            <View className="py-2">
                <NotificationRowSkeleton />
            </View>
        );
    }

    return (
        <View className="items-center gap-3 py-5">
            <AppText variant="subtext" color="mutedForeground" align="center">
                {t("notice.failedMoreTitle", {
                    defaultValue: "Couldn't load more notifications",
                })}
            </AppText>
            <ActionButton label={t("common.refreshTryAgain")} appearance="outlined" onPress={onRetry} />
        </View>
    );
}
