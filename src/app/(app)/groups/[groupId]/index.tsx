import { getGroupStatusTone } from "@/components/golf/MemberGroups";
import {
    AppText,
    Badge,
    cn,
    CompactEmptyState,
    Divider,
    ErrorState,
    ListRow,
    Screen,
    Skeleton,
    SwipeableTabBar,
    type SwipeableTabRoute,
    triggerSelectionHaptic,
    useThemeColors,
} from "@/design-system";
import { motionCssEase, motionDuration } from "@/design-system/utils/motion";
import {
    getMemberHomeworkByIdQueryOptions,
    getMemberLessonByGroupQueryOptions,
    useMemberGroupById,
} from "@/lib/hook/useMemberLessonFlow";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import type { MemberHomeworkSummaryResponse } from "@/types/member-homework";
import type { MemberLessonSummaryResponse } from "@/types/member-lesson";
import { formatType } from "@/utils/format-enum";
import { getGroupName, getHomeworkTitle, getLessonName } from "@/utils/member-lesson";
import { getHomeworkReviewTone, getHomeworkSubmissionTone, getLessonStatusTone } from "@/utils/status-tone";
import { fmtDate, fmtTime, formatDateForDisplay } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, Calendar, Check, ClipboardCheck, Clock } from "lucide-react-native";
import { memo, useCallback, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, type ListRenderItem, RefreshControl, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { TabView, type TabBarProps } from "react-native-tab-view";

const PROGRESS_EASING = motionCssEase;
const GROUP_DETAIL_LIST_STYLE = { paddingTop: 12, paddingBottom: 24 } as const;

function GroupDetailSeparator() {
    return <View className="h-3" />;
}

const lessonKeyExtractor = (lesson: MemberLessonSummaryResponse) => `lesson-${lesson.lessonId}`;
const homeworkKeyExtractor = (homework: MemberHomeworkSummaryResponse) => `homework-${homework.homeworkId}`;

type GroupParams = {
    groupId: string;
};

export default function GroupDetailScreen() {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const reducedMotion = useReducedMotion();
    const { groupId } = useLocalSearchParams<GroupParams>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const [activeIndex, setActiveIndex] = useState(0);
    const { data, isLoading, isError, refetch, isRefetching } = useMemberGroupById(Number(groupId));
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        refetch({ cancelRefetch: false }),
    );

    const group = data?.data.group;
    const lessons = useMemo(
        () =>
            [...(data?.data.lessons ?? [])].sort(
                (a, b) => (a.orderIndex ?? Number.MAX_SAFE_INTEGER) - (b.orderIndex ?? Number.MAX_SAFE_INTEGER),
            ),
        [data?.data.lessons],
    );
    const groupHomeworks = useMemo(() => data?.data.homeworks ?? [], [data?.data.homeworks]);

    const routes = useMemo<SwipeableTabRoute[]>(
        () => [
            {
                key: "lessons",
                title: `${t("groupsFlow.lessonsTitle")} (${lessons.length})`,
            },
            {
                key: "homework",
                title: `${t("groupsFlow.homeworkTitle")} (${groupHomeworks.length})`,
            },
        ],
        [groupHomeworks.length, lessons.length, t],
    );

    const handleTabChange = useCallback(
        (nextIndex: number) => {
            if (nextIndex === activeIndex) {
                return;
            }
            triggerSelectionHaptic();
            setActiveIndex(nextIndex);
        },
        [activeIndex],
    );

    const handleLessonPress = useCallback(
        (lessonId: number) => {
            void queryClient.prefetchQuery(getMemberLessonByGroupQueryOptions(Number(groupId), lessonId));
            runWithNavigationLock(() => {
                router.push({
                    pathname: "/groups/[groupId]/lessons/[lessonId]",
                    params: {
                        groupId,
                        lessonId: String(lessonId),
                    },
                });
            });
        },
        [groupId, queryClient, router, runWithNavigationLock],
    );

    const handleHomeworkPress = useCallback(
        (homeworkId: number) => {
            void queryClient.prefetchQuery(getMemberHomeworkByIdQueryOptions(homeworkId));
            runWithNavigationLock(() => {
                router.push({
                    pathname: "/homework/[homeworkId]",
                    params: {
                        homeworkId: String(homeworkId),
                    },
                });
            });
        },
        [queryClient, router, runWithNavigationLock],
    );

    const renderLessonItem: ListRenderItem<MemberLessonSummaryResponse> = useCallback(
        ({ item }) => <LessonRow lesson={item} disabled={isLocked} onPress={handleLessonPress} />,
        [handleLessonPress, isLocked],
    );

    const renderHomeworkItem: ListRenderItem<MemberHomeworkSummaryResponse> = useCallback(
        ({ item }) => <HomeworkRow homework={item} disabled={isLocked} onPress={handleHomeworkPress} />,
        [handleHomeworkPress, isLocked],
    );

    const renderTabBar = useCallback(
        (props: TabBarProps<SwipeableTabRoute>) => <SwipeableTabBar {...props} onTabPress={handleTabChange} />,
        [handleTabChange],
    );

    const renderScene = useCallback(
        ({ route }: { route: { key: string } }) =>
            route.key === "lessons" ? (
                <FlatList
                    data={lessons}
                    extraData={isLocked}
                    keyExtractor={lessonKeyExtractor}
                    renderItem={renderLessonItem}
                    ItemSeparatorComponent={GroupDetailSeparator}
                    contentContainerStyle={GROUP_DETAIL_LIST_STYLE}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
                    ListEmptyComponent={<CompactEmptyState title={t("groupsFlow.noLessons")} />}
                />
            ) : (
                <FlatList
                    data={groupHomeworks}
                    extraData={isLocked}
                    keyExtractor={homeworkKeyExtractor}
                    renderItem={renderHomeworkItem}
                    ItemSeparatorComponent={GroupDetailSeparator}
                    contentContainerStyle={GROUP_DETAIL_LIST_STYLE}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
                    ListEmptyComponent={<CompactEmptyState title={t("groupsFlow.noHomework")} />}
                />
            ),
        [
            groupHomeworks,
            handlePullRefresh,
            isLocked,
            isPullRefreshing,
            lessons,
            renderHomeworkItem,
            renderLessonItem,
            t,
        ],
    );

    const completedLessons = lessons.filter((lesson) => lesson.lessonStatus === "COMPLETED").length;
    const totalLessons = lessons.length;
    const progress =
        totalLessons > 0 ? Math.min(100, Math.max(0, Math.round((completedLessons / totalLessons) * 100))) : 0;
    const scheduleLabel = getRangeLabel(fmtDate(group?.programStartDate), fmtDate(group?.programEndDate));
    const timeframeLabel =
        group?.sessionStartTime && group?.sessionEndTime
            ? `${fmtTime(group.sessionStartTime)} - ${fmtTime(group.sessionEndTime)}`
            : group?.sessionStartTime || group?.sessionEndTime
              ? fmtTime(group.sessionStartTime || group.sessionEndTime)
              : "—";

    const refreshControl = <RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />;

    if (isLoading) {
        return (
            <Screen contentClassName="gap-6">
                <GroupDetailSkeleton />
            </Screen>
        );
    }

    if (isError && !data) {
        return (
            <Screen contentClassName="grow" bottomPadding={16} refreshControl={refreshControl}>
                <ErrorState
                    title={t("groupsFlow.failedGroupTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={() => {
                        void refetch();
                    }}
                />
            </Screen>
        );
    }

    if (!group) {
        return (
            <Screen contentClassName="grow" bottomPadding={16} refreshControl={refreshControl}>
                <CompactEmptyState
                    title={t("groupsFlow.groupNotAvailableTitle")}
                    message={t("groupsFlow.groupNotFoundMessage")}
                />
            </Screen>
        );
    }

    const statusTone = getGroupStatusTone(group.groupStatus);
    const programName = group.lessonProgramName?.trim();

    return (
        <Screen scroll={false} bottomPadding={0}>
            <View className="gap-3 pb-3">
                <View className="gap-2">
                    {group.groupStatus ? (
                        <Badge
                            label={formatType(group.groupStatus, t)}
                            className={statusTone.className}
                            color={statusTone.color}
                        />
                    ) : null}

                    <View className="gap-1">
                        <AppText variant="h2">{getGroupName(group)}</AppText>

                        {programName ? (
                            <AppText variant="subtext" color="mutedForeground" numberOfLines={2}>
                                {programName}
                            </AppText>
                        ) : null}
                    </View>
                </View>

                <View className="gap-2">
                    <View className="flex-row items-baseline justify-between gap-3">
                        <AppText variant="h3" color="foreground" wrap={false} tabular textStyle={{ fontWeight: "700" }}>
                            {`${progress}%`}
                        </AppText>
                        <AppText
                            variant="caption"
                            color="mutedForeground"
                            align="right"
                            numberOfLines={1}
                            tabular
                            style={{ flex: 1, minWidth: 0 }}
                        >
                            {progress === 100
                                ? t("groupsFlow.allLessonsCompleted")
                                : t("groupsFlow.lessonsCompleted", {
                                      completed: completedLessons,
                                      total: totalLessons,
                                  })}
                        </AppText>
                    </View>

                    <View className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <Animated.View
                            className="h-full w-full rounded-full bg-primary"
                            style={{
                                transformOrigin: "left",
                                transform: [{ scaleX: progress / 100 }],
                                transitionProperty: "transform",
                                transitionDuration: reducedMotion ? 0 : motionDuration.slow,
                                transitionTimingFunction: PROGRESS_EASING,
                            }}
                        />
                    </View>
                </View>

                <View>
                    <Divider className="bg-border/70" />
                    <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
                        <View className="flex-row items-center gap-1.5">
                            <Calendar size={15} color={colors.mutedForeground} strokeWidth={2} />
                            <AppText
                                variant="subtext"
                                color="foreground"
                                wrap={false}
                                tabular
                                textStyle={{ fontWeight: "600" }}
                            >
                                {scheduleLabel}
                            </AppText>
                        </View>

                        {timeframeLabel !== "—" ? (
                            <View className="flex-row items-center gap-1.5">
                                <Clock size={15} color={colors.mutedForeground} strokeWidth={2} />
                                <AppText
                                    variant="subtext"
                                    color="foreground"
                                    wrap={false}
                                    tabular
                                    textStyle={{ fontWeight: "600" }}
                                >
                                    {timeframeLabel}
                                </AppText>
                            </View>
                        ) : null}
                    </View>
                    <Divider className="bg-border/70" />
                </View>
            </View>

            <TabView
                animationEnabled={!reducedMotion}
                navigationState={{ index: activeIndex, routes }}
                onIndexChange={handleTabChange}
                renderScene={renderScene}
                renderTabBar={renderTabBar}
                style={{ flex: 1 }}
            />
        </Screen>
    );
}

const LessonRow = memo(function LessonRow({
    lesson,
    disabled,
    onPress,
}: {
    lesson: MemberLessonSummaryResponse;
    disabled: boolean;
    onPress: (lessonId: number) => void;
}) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const isCompleted = lesson.lessonStatus === "COMPLETED";
    const lessonStatusTone = getLessonStatusTone(lesson.lessonStatus);
    const rowClassName = isCompleted
        ? "border-border/60 bg-surface/70 px-4 py-3.5"
        : "border-border bg-card px-4 py-3.5";

    return (
        <ListRow
            title={getLessonName(lesson)}
            subtitle={formatDateForDisplay(lesson.startTime ?? null) || undefined}
            meta={
                !isCompleted && lesson.lessonStatus ? (
                    <Badge
                        label={formatType(lesson.lessonStatus, t)}
                        size="sm"
                        className={lessonStatusTone.className}
                        color={lessonStatusTone.color}
                    />
                ) : !isCompleted && lesson.orderIndex != null ? (
                    `#${lesson.orderIndex}`
                ) : undefined
            }
            leading={
                <RowIcon tone={isCompleted ? "success" : "primary"}>
                    {isCompleted ? (
                        <Check size={18} color={colors.success} strokeWidth={2.4} />
                    ) : (
                        <BookOpen size={18} color={colors.primary} strokeWidth={2.2} />
                    )}
                </RowIcon>
            }
            className={rowClassName}
            titleStyle={{
                fontWeight: isCompleted ? "400" : "600",
                color: isCompleted ? colors.mutedForeground : colors.foreground,
            }}
            disabled={disabled}
            onPress={() => onPress(lesson.lessonId)}
        />
    );
});

const HomeworkRow = memo(function HomeworkRow({
    homework,
    disabled,
    onPress,
}: {
    homework: MemberHomeworkSummaryResponse;
    disabled: boolean;
    onPress: (homeworkId: number) => void;
}) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const reviewStatus = homework.currentReviewStatus;
    const submissionStatus = homework.currentSubmissionStatus;
    const statusLabel = reviewStatus
        ? formatType(reviewStatus, t)
        : submissionStatus
          ? formatType(submissionStatus, t)
          : formatType(homework.homeworkStatus, t);
    const statusTone = reviewStatus
        ? getHomeworkReviewTone(reviewStatus)
        : submissionStatus
          ? getHomeworkSubmissionTone(submissionStatus)
          : getFallbackHomeworkTone(homework.homeworkStatus);
    const isUrgent =
        homework.homeworkStatus === "OVERDUE" ||
        homework.homeworkStatus === "REJECTED" ||
        homework.homeworkStatus === "MISSING";
    const iconTone: RowIconTone =
        statusTone.color === "danger"
            ? "danger"
            : statusTone.color === "success"
              ? "success"
              : statusTone.color === "primary"
                ? "primary"
                : statusTone.color === "warning"
                  ? "warning"
                  : "muted";
    const iconColor =
        iconTone === "danger"
            ? colors.danger
            : iconTone === "success"
              ? colors.success
              : iconTone === "primary"
                ? colors.primary
                : iconTone === "warning"
                  ? colors.warning
                  : colors.mutedForeground;

    return (
        <ListRow
            title={getHomeworkTitle(homework)}
            subtitle={
                homework.dueAt
                    ? t("groupsFlow.dueDate", {
                          date: formatDateForDisplay(homework.dueAt),
                      })
                    : (homework.description ?? undefined)
            }
            meta={
                statusLabel ? (
                    <Badge label={statusLabel} size="sm" className={statusTone.className} color={statusTone.color} />
                ) : undefined
            }
            leading={
                <RowIcon tone={iconTone}>
                    <ClipboardCheck size={18} color={iconColor} strokeWidth={2.2} />
                </RowIcon>
            }
            className={isUrgent ? "border-danger/25 bg-danger/5 px-4 py-3.5" : "border-border bg-card px-4 py-3.5"}
            titleStyle={{ fontWeight: "600" }}
            disabled={disabled}
            onPress={() => onPress(homework.homeworkId)}
        />
    );
});

type RowIconTone = "primary" | "muted" | "success" | "warning" | "danger";

function RowIcon({ children, tone = "muted" }: { children: ReactNode; tone?: RowIconTone }) {
    const toneClassName =
        tone === "primary"
            ? "bg-primary/10"
            : tone === "success"
              ? "bg-success/10"
              : tone === "warning"
                ? "bg-warning/10"
                : tone === "danger"
                  ? "bg-danger/10"
                  : "bg-muted";

    return <View className={cn("h-10 w-10 items-center justify-center rounded-xl", toneClassName)}>{children}</View>;
}

function GroupDetailSkeleton() {
    return (
        <>
            <View className="gap-3">
                <View className="gap-2">
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-7 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-full" />
                </View>

                <View className="gap-2">
                    <View className="flex-row items-baseline justify-between gap-3">
                        <Skeleton className="h-6 w-14 rounded-lg" />
                        <Skeleton className="h-4 w-28 rounded-full" />
                    </View>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                </View>

                <View>
                    <Divider className="bg-border/70" />
                    <View className="flex-row items-center gap-4 py-2.5">
                        <Skeleton className="h-4 w-36 rounded-full" />
                        <Skeleton className="h-4 w-24 rounded-full" />
                    </View>
                    <Divider className="bg-border/70" />
                </View>
            </View>

            <View className="gap-3">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <View className="gap-3">
                    {Array.from({ length: 4 }, (_, index) => (
                        <GroupDetailRowSkeleton key={`row-sk-${index}`} />
                    ))}
                </View>
            </View>
        </>
    );
}

function GroupDetailRowSkeleton() {
    return (
        <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <View className="min-w-0 flex-1 gap-1.5">
                <Skeleton className="h-4 w-3/5 rounded-full" />
                <Skeleton className="h-3.5 w-2/5 rounded-full" />
            </View>
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="h-4 w-4 rounded-full" />
        </View>
    );
}

function getRangeLabel(start: string, end: string) {
    const noValue = "—";

    if (start === noValue && end === noValue) {
        return noValue;
    }

    return `${start} ~ ${end}`;
}

function getFallbackHomeworkTone(status?: string | null) {
    if (status === "COMPLETED" || status === "SUBMITTED") {
        return {
            className: "bg-success/10",
            color: "success" as const,
        };
    }

    if (status === "OVERDUE" || status === "REJECTED" || status === "MISSING") {
        return {
            className: "bg-danger/10",
            color: "danger" as const,
        };
    }

    return {
        className: "bg-warning/10",
        color: "warning" as const,
    };
}
