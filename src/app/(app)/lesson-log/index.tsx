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
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { getMemberLessonLogByIdQueryOptions, useMemberLessonLogs } from "@/lib/hook/useLessonLog";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import type { MemberLessonLogResponse } from "@/types/member-lesson-log";
import { formatDateForDisplay, formatMonthYear, getMonthKey } from "@/utils/time-helper";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import BookOpenText from "lucide-react-native/icons/book-open-text";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import Video from "lucide-react-native/icons/video";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

type LessonLogListEntry =
    { kind: "header"; key: string; label: string } | { kind: "item"; item: MemberLessonLogResponse };

const lessonLogKeyExtractor = (entry: LessonLogListEntry, index: number) =>
    entry.kind === "header"
        ? `section-${entry.key}`
        : entry.item.id != null
          ? `lesson-log-${entry.item.id}`
          : `lesson-log-${index}`;
const getLessonLogItemType = (entry: LessonLogListEntry) => entry.kind;
const LESSON_LOG_LIST_CONTENT_STYLE = {
    paddingTop: 12,
    paddingBottom: 32,
} as const;

function LessonLogSeparator() {
    return <View className="h-3" />;
}

function LessonLogScreen() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
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
    } = useMemberLessonLogs();
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        refetch({ cancelRefetch: false }),
    );

    const lessonLogs = useMemo(() => data?.items ?? [], [data]);
    const groupedLessonLogs = useMemo(() => {
        const entries: LessonLogListEntry[] = [];
        const stickyHeaderIndices: number[] = [];
        const locale = i18n.resolvedLanguage ?? i18n.language;
        let currentKey: string | null = null;

        for (const log of lessonLogs) {
            const key = getMonthKey(log.lessonDate);
            if (key && key !== currentKey) {
                stickyHeaderIndices.push(entries.length);
                entries.push({
                    kind: "header",
                    key,
                    label: formatMonthYear(log.lessonDate, locale),
                });
                currentKey = key;
            }
            entries.push({ kind: "item", item: log });
        }

        return { data: entries, stickyHeaderIndices };
    }, [i18n.language, i18n.resolvedLanguage, lessonLogs]);
    const { runWithNavigationLock } = useNavigationLock();
    const refreshControl = <RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />;
    const handleLessonLogPress = useCallback(
        (item: MemberLessonLogResponse) => {
            const lessonLogId = typeof item.id === "number" ? item.id : null;

            if (lessonLogId != null) {
                void queryClient.prefetchQuery(getMemberLessonLogByIdQueryOptions(lessonLogId));
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
        ({ item }: { item: LessonLogListEntry }) =>
            item.kind === "header" ? (
                <View accessibilityRole="header" className="bg-background pb-2 pt-3">
                    <AppText variant="subtext" color="mutedForeground" textStyle={{ fontWeight: "600" }}>
                        {item.label}
                    </AppText>
                </View>
            ) : (
                <LessonLogRow item={item.item} onPress={handleLessonLogPress} />
            ),
        [handleLessonLogPress],
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
        <Screen scroll={false} bottomPadding={16} contentClassName="grow">
            {isLoading ? (
                <LessonLogListSkeleton />
            ) : isError && !data ? (
                <StateList refreshing={isPullRefreshing} onRefresh={handlePullRefresh}>
                    <ErrorState
                        title={t("lessonLog.failedPostsTitle")}
                        message={t("common.pullToRefreshAndTryAgain")}
                        actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                        actionPending={isRefetching || isPullRefreshing}
                        onAction={handlePullRefresh}
                    />
                </StateList>
            ) : lessonLogs.length === 0 ? (
                <StateList refreshing={isPullRefreshing} onRefresh={handlePullRefresh}>
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
                    data={groupedLessonLogs.data}
                    keyExtractor={lessonLogKeyExtractor}
                    getItemType={getLessonLogItemType}
                    stickyHeaderIndices={groupedLessonLogs.stickyHeaderIndices}
                    stickyHeaderConfig={{ hideRelatedCell: true }}
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
    onPress,
}: {
    item: MemberLessonLogResponse;
    onPress: (item: MemberLessonLogResponse) => void;
}) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const formattedLessonDate = formatDateForDisplay(item.lessonDate);
    const reservationName = item.reservation?.name?.trim();
    const hasSubmittedReview = Boolean(item.comment?.trim()) || (item.ratings ?? 0) > 0;
    const reviewLabel = hasSubmittedReview ? t("lessonLog.commentSubmitted") : t("lessonLog.leaveReview");

    return (
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={t("lessonLog.openLessonLog", {
                coach: item.coachName ?? t("lessonLog.coachFallback"),
                date: formattedLessonDate,
            })}
            className="gap-3 rounded-2xl border border-border bg-card p-4"
            onPress={() => {
                onPress(item);
            }}
        >
            <View className="flex-row items-center justify-between gap-2">
                <AppText
                    variant="subtext"
                    numberOfLines={1}
                    tabular
                    style={{ flex: 1, minWidth: 0 }}
                    textStyle={{ fontWeight: "700" }}
                >
                    {formattedLessonDate}
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
                    <BookOpenText size={19} color={colors.primary} strokeWidth={2.2} />
                </View>

                <View className="min-w-0 flex-1 gap-0.5">
                    <AppText variant="body" numberOfLines={1} textStyle={{ fontWeight: "600" }}>
                        {item.coachName ?? t("lessonLog.coachFallback")}
                    </AppText>

                    {reservationName ? (
                        <AppText variant="caption" color="mutedForeground" numberOfLines={1}>
                            {reservationName}
                        </AppText>
                    ) : null}
                </View>

                <ChevronRight size={18} color={colors.mutedForeground} strokeWidth={2} />
            </View>

            {item.videoUrl ? (
                <View className="flex-row items-center gap-1.5 self-start rounded-md bg-primary/10 px-2 py-0.5">
                    <Video size={12} color={colors.primary} strokeWidth={2} />
                    <AppText variant="badge" color="primary" wrap={false}>
                        {t("lessonLog.videoBadge")}
                    </AppText>
                </View>
            ) : null}

            {item.body?.trim() ? (
                <AppText variant="subtext" color="mutedForeground" numberOfLines={2}>
                    {item.body}
                </AppText>
            ) : null}
        </AnimatedPressable>
    );
});

function LessonLogListSkeleton() {
    return (
        <View className="gap-3 pt-3">
            {Array.from({ length: 5 }, (_, index) => (
                <View key={index} className="gap-3 rounded-2xl border border-border bg-card p-4">
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
