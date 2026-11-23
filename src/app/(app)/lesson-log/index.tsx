import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { AppText } from "@/design-system/components/AppText";
import {
    AnimatedPressable,
    EmptyState,
    ErrorState,
    Screen,
    Skeleton,
    StateList,
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
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, View } from "react-native";

const lessonLogKeyExtractor = (item: MemberLessonLogResponse) =>
    String(item.id);
const LESSON_LOG_LIST_CONTENT_STYLE = {
    paddingHorizontal: 24,
} as const;

function LessonLogSeparator() {
    return <View className="h-3" />;
}

function LessonLogScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const {
        data, isLoading, isError, isFetching, refetch, isRefetching,
        fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError,
    } =
        useMemberLessonLogs();
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => refetch({ cancelRefetch: false }));

    const lessonLogs = data?.items ?? [];
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const refreshControl = (
        <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={handlePullRefresh}
        />
    );
    const handleLessonLogPress = useCallback(
        (item: MemberLessonLogResponse) => {
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
        },
        [queryClient, router, runWithNavigationLock],
    );

    const renderLessonLogItem = useCallback(
        ({ item }: { item: MemberLessonLogResponse }) => (
            <LessonLogRow
                item={item}
                disabled={isLocked}
                onPress={handleLessonLogPress}
            />
        ),
        [handleLessonLogPress, isLocked],
    );
    const handleFetchNextPage = useCallback(() => {
        if (hasNextPage && !isFetching) {
            void fetchNextPage({ cancelRefetch: false });
        }
    }, [fetchNextPage, hasNextPage, isFetching]);
    const handleEndReached = useCallback(() => {
        if (!isFetchNextPageError) handleFetchNextPage();
    }, [handleFetchNextPage, isFetchNextPageError]);

    return (
        <Screen
            scroll={false}
            horizontalPadding={false}
            bottomPadding={16}
            contentClassName="grow"
        >
            {isLoading ? (
                <LessonLogListSkeleton />
            ) : isError && !data ? (
                <StateList
                    refreshing={isPullRefreshing}
                    onRefresh={handlePullRefresh}
                    contentContainerStyle={{ paddingHorizontal: 24 }}
                >
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
                </StateList>
            ) : lessonLogs.length === 0 ? (
                <StateList
                    refreshing={isPullRefreshing}
                    onRefresh={handlePullRefresh}
                    contentContainerStyle={{ paddingHorizontal: 24 }}
                >
                    <EmptyState
                        title={t("lessonLog.noPostsTitle")}
                        message={t("lessonLog.noPostsMessage")}
                        actionLabel={t("lessonLog.refresh")}
                        actionPending={isRefetching || isPullRefreshing}
                        onAction={handlePullRefresh}
                    />
                </StateList>
            ) : (
                <FlashList
                    data={lessonLogs}
                    keyExtractor={lessonLogKeyExtractor}
                    renderItem={renderLessonLogItem}
                    ItemSeparatorComponent={LessonLogSeparator}
                    refreshControl={refreshControl}
                    contentContainerStyle={LESSON_LOG_LIST_CONTENT_STYLE}
                    contentInsetAdjustmentBehavior="automatic"
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <View className="px-6 py-3">
                                <Skeleton className="h-16 rounded-2xl" />
                            </View>
                        ) : isFetchNextPageError ? (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityState={{
                                    disabled: isFetching || isFetchingNextPage,
                                    busy: isFetchingNextPage,
                                }}
                                disabled={isFetching || isFetchingNextPage}
                                className="items-center justify-center px-6 disabled:opacity-60"
                                style={{ minHeight: 48 }}
                                onPress={handleFetchNextPage}
                            >
                                <AppText variant="label" color="primary">
                                    {t("common.refreshTryAgain")}
                                </AppText>
                            </Pressable>
                        ) : undefined
                    }
                />
            )}
        </Screen>
    );
}

export default LessonLogScreen;

const LessonLogRow = memo(function LessonLogRow({
    item,
    disabled,
    onPress,
}: {
    item: MemberLessonLogResponse;
    disabled: boolean;
    onPress: (item: MemberLessonLogResponse) => void;
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
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={t("lessonLog.openLessonLog", {
                coach: item.coachName ?? t("lessonLog.coachFallback"),
                date: formatDateForDisplay(item.lessonDate),
            })}
            disabled={disabled}
            className="min-h-16 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 disabled:opacity-60"
            onPress={() => {
                if (disabled) {
                    return;
                }

                triggerSelectionHaptic();
                onPress(item);
            }}
        >
            <View className="min-w-0 flex-1 gap-2">
                <View
                    className={`self-start rounded-full px-3 py-1.5 ${hasSubmittedReview ? "bg-success/10" : "bg-warning/10"
                        }`}
                >
                    <AppText
                        variant="caption"
                        wrap={false}
                        color={hasSubmittedReview ? "success" : "warning"}
                    >
                        {reviewLabel}
                    </AppText>
                </View>

                <AppText variant="body" numberOfLines={2} textStyle={{ fontWeight: "700" as const }}>
                    {`${formatDateForDisplay(item.lessonDate)} / ${item.coachName ?? t("lessonLog.coachFallback")}`}
                </AppText>

                {reservationName ? (
                    <AppText variant="caption" color="mutedForeground" numberOfLines={2}>
                        {reservationName}
                    </AppText>
                ) : null}
            </View>

            <View className="h-8 w-8 items-center justify-center rounded-full bg-muted">
                <ChevronRight
                    size={18}
                    color={colors.mutedForeground}
                    strokeWidth={2.25}
                />
            </View>
        </AnimatedPressable>
    );
});

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
