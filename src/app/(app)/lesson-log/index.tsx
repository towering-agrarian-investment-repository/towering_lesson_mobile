import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { AppText } from "@/design-system/components/AppText";
import {
    AnimatedPressable,
    EmptyState,
    ErrorState,
    ListRetryFooter,
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
import { BookOpenText, ChevronRight } from "lucide-react-native";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

const lessonLogKeyExtractor = (item: MemberLessonLogResponse) =>
    String(item.id);
const LESSON_LOG_LIST_CONTENT_STYLE = {
    paddingTop: 12,
    paddingBottom: 32,
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
            bottomPadding={16}
            contentClassName="grow"
        >
            {isLoading ? (
                <LessonLogListSkeleton />
            ) : isError && !data ? (
                <StateList
                    refreshing={isPullRefreshing}
                    onRefresh={handlePullRefresh}
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
                            <View className="py-3">
                                <Skeleton className="h-20 rounded-2xl" />
                            </View>
                        ) : isFetchNextPageError ? (
                            <ListRetryFooter
                                disabled={isFetching || isFetchingNextPage}
                                busy={isFetchingNextPage}
                                onRetry={handleFetchNextPage}
                            />
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
            className="gap-3 rounded-2xl border border-border bg-card p-4 disabled:opacity-60"
            onPress={() => {
                if (disabled) {
                    return;
                }

                triggerSelectionHaptic();
                onPress(item);
            }}
        >
            <View className="flex-row items-center justify-between gap-2">
                <AppText
                    variant="meta"
                    numberOfLines={1}
                    style={{ flex: 1, minWidth: 0 }}
                    textStyle={{
                        fontWeight: "700",
                        fontVariant: ["tabular-nums"],
                    }}
                >
                    {formatDateForDisplay(item.lessonDate)}
                </AppText>

                <View
                    className={`shrink-0 rounded-md px-2 py-0.5 ${
                        hasSubmittedReview ? "bg-success/10" : "bg-warning/10"
                    }`}
                >
                    <AppText
                        variant="badge"
                        wrap={false}
                        color={hasSubmittedReview ? "success" : "warning"}
                        textStyle={{ fontWeight: "600" }}
                    >
                        {reviewLabel}
                    </AppText>
                </View>
            </View>

            <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <BookOpenText
                        size={19}
                        color={colors.primary}
                        strokeWidth={2.2}
                    />
                </View>

                <View className="min-w-0 flex-1 gap-0.5">
                    <AppText
                        variant="body"
                        numberOfLines={1}
                        textStyle={{ fontWeight: "600" }}
                    >
                        {item.coachName ?? t("lessonLog.coachFallback")}
                    </AppText>

                    {reservationName ? (
                        <AppText
                            variant="caption"
                            color="mutedForeground"
                            numberOfLines={1}
                        >
                            {reservationName}
                        </AppText>
                    ) : null}
                </View>

                <ChevronRight
                    size={18}
                    color={colors.mutedForeground}
                    strokeWidth={2}
                />
            </View>
        </AnimatedPressable>
    );
});

function LessonLogListSkeleton() {
    return (
        <View className="gap-3 pt-3">
            {Array.from({ length: 5 }, (_, index) => (
                <View
                    key={index}
                    className="gap-3 rounded-2xl border border-border bg-card p-4"
                >
                    <View className="flex-row items-center justify-between gap-2">
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <Skeleton className="h-5 w-24 rounded-md" />
                    </View>
                    <View className="flex-row items-center gap-3">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                        <View className="min-w-0 flex-1 gap-1.5">
                            <Skeleton className="h-5 w-36 rounded-md" />
                            <Skeleton className="h-3.5 w-28 rounded-md" />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
}
