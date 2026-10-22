import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { NativeText } from "@/design-system/components/NativeText";
import {
    EmptyState,
    ErrorState,
    Screen,
    Skeleton,
    triggerSelectionHaptic,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import {
    getMemberLessonLogByIdQueryOptions,
    useMemberLessonLogs,
} from "@/lib/hook/useLessonLog";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import type { MemberLessonLogResponse } from "@/types/member-lesson-log";
import { formatDateForDisplay } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

function LessonLogScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data, isLoading, isError, refetch, isRefetching } =
        useMemberLessonLogs();
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => refetch({ cancelRefetch: false }));

    const lessonLogs = data?.data ?? [];
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const refreshControl = (
        <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={handlePullRefresh}
        />
    );
    const renderLessonLogItem = useCallback(
        ({ item }: { item: MemberLessonLogResponse }) => (
            <LessonLogRow
                item={item}
                disabled={isLocked}
                onPress={() => {
                    const lessonLogId =
                        typeof item.id === "number" ? item.id : null;

                    if (lessonLogId != null) {
                        void queryClient.prefetchQuery(
                            getMemberLessonLogByIdQueryOptions(lessonLogId),
                        );
                    }

                    runWithNavigationLock(() => {
                        router.push({
                            pathname: "/lesson-log/[id]",
                            params: {
                                id: String(item.id),
                            },
                        });
                    });
                }}
            />
        ),
        [isLocked, queryClient, router, runWithNavigationLock],
    );

    return (
        <Screen
            scroll={false}
            horizontalPadding={false}
            contentClassName="grow"
        >
            {isLoading ? (
                <LessonLogListSkeleton />
            ) : isError && !data ? (
                <LessonLogStateList
                    refreshControl={refreshControl}
                    emptyComponent={
                        <ErrorState
                            title={t("lessonLog.failedPostsTitle")}
                            message={t("common.pullToRefreshAndTryAgain")}
                            actionLabel={
                                isRefetching
                                    ? t("common.refreshing")
                                    : t("common.refreshTryAgain")
                            }
                            actionPending={isRefetching || isPullRefreshing}
                            onAction={handlePullRefresh}
                        />
                    }
                />
            ) : lessonLogs.length === 0 ? (
                <LessonLogStateList
                    refreshControl={refreshControl}
                    emptyComponent={
                        <EmptyState
                            title={t("lessonLog.noPostsTitle")}
                            message={t("lessonLog.noPostsMessage")}
                            actionLabel={t("lessonLog.refresh")}
                            actionPending={isRefetching || isPullRefreshing}
                            onAction={handlePullRefresh}
                        />
                    }
                />
            ) : (
                <FlatList
                    data={lessonLogs}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderLessonLogItem}
                    refreshControl={refreshControl}
                    contentContainerStyle={{
                        gap: 12,
                        paddingHorizontal: 24,
                    }}
                    contentInsetAdjustmentBehavior="automatic"
                    showsVerticalScrollIndicator={false}
                />
            )}
        </Screen>
    );
}

export default LessonLogScreen;

function LessonLogRow({
    item,
    disabled,
    onPress,
}: {
    item: MemberLessonLogResponse;
    disabled: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const reservationName = item.reservation?.name?.trim();
    const hasSubmittedReview =
        Boolean(item.comment?.trim()) || (item.ratings ?? 0) > 0;
    const reviewLabel = hasSubmittedReview
        ? t("lessonLog.commentSubmitted")
        : t("lessonLog.leaveReview");

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("lessonLog.openLessonLog", {
                coach: item.coachName ?? t("lessonLog.coachFallback"),
                date: formatDateForDisplay(item.lessonDate),
            })}
            disabled={disabled}
            className="min-h-16 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 disabled:opacity-60"
            style={({ pressed }) => ({
                transform: [{ scale: pressed && !disabled ? 0.992 : 1 }],
            })}
            onPress={() => {
                if (disabled) {
                    return;
                }

                triggerSelectionHaptic();
                onPress();
            }}
        >
            <View className="min-w-0 flex-1 gap-2">
                <View
                    className={`self-start rounded-full px-3 py-1.5 ${hasSubmittedReview ? "bg-success/10" : "bg-warning/10"
                        }`}
                >
                    <NativeText
                        variant="caption"
                        wrap={false}
                        textStyle={{
                            color: hasSubmittedReview
                                ? colors.success
                                : colors.warning
                        }}
                    >
                        {reviewLabel}
                    </NativeText>
                </View>

                <NativeText variant="body" numberOfLines={2} textStyle={{ fontWeight: "700" as const }}>
                    {`${formatDateForDisplay(item.lessonDate)} / ${item.coachName ?? t("lessonLog.coachFallback")}`}
                </NativeText>

                {reservationName ? (
                    <NativeText variant="caption" color="mutedForeground" numberOfLines={2}>
                        {reservationName}
                    </NativeText>
                ) : null}
            </View>

            <View className="h-8 w-8 items-center justify-center rounded-full bg-muted">
                <ChevronRight
                    size={18}
                    color={colors.mutedForeground}
                    strokeWidth={2.25}
                />
            </View>
        </Pressable>
    );
}

function LessonLogStateList({
    emptyComponent,
    refreshControl,
}: {
    emptyComponent: React.ReactElement;
    refreshControl: React.ReactElement<
        React.ComponentProps<typeof RefreshControl>
    >;
}) {
    return (
        <FlatList
            data={[]}
            renderItem={() => null}
            refreshControl={refreshControl}
            contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                paddingHorizontal: 24,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={emptyComponent}
        />
    );
}

function LessonLogListSkeleton() {
    return (
        <View className="gap-3 px-6">
            {Array.from({ length: 5 }, (_, index) => (
                <View
                    key={index}
                    className="min-h-16 flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-4"
                >
                    <View className="flex-1 gap-2">
                        <Skeleton className="h-5 w-4/5 rounded-full" />
                        <Skeleton className="h-4 w-2/5 rounded-full" />
                        <Skeleton className="h-4 w-1/3 rounded-full" />
                    </View>

                    <Skeleton className="h-5 w-5 rounded-full" />
                </View>
            ))}
        </View>
    );
}
