import { getGroupStatusTone } from "@/components/golf/MemberGroups";
import {
    AppText,
    Badge,
    cn,
    CompactEmptyState,
    Divider,
    ErrorState,
    ListRow,
    NativeText,
    Screen,
    SegmentedControl,
    Skeleton,
    useThemeColors,
} from "@/design-system";
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
import {
    getGroupName,
    getHomeworkTitle,
    getLessonName,
} from "@/utils/member-lesson";
import {
    getHomeworkReviewTone,
    getHomeworkSubmissionTone,
    getLessonStatusTone,
} from "@/utils/status-tone";
import { fmtDate, fmtTime, formatDateForDisplay } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    BookOpen,
    Calendar,
    Check,
    ClipboardCheck,
    Clock,
} from "lucide-react-native";
import { memo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, View } from "react-native";
import Animated, { cubicBezier, useReducedMotion } from "react-native-reanimated";

const PROGRESS_EASING = cubicBezier(0.23, 1, 0.32, 1);
const GROUP_DETAIL_LIST_STYLE = { paddingBottom: 24 } as const;

function GroupDetailSeparator() {
    return <View className="h-2.5" />;
}

type GroupDetailListItem =
    | { kind: "lesson"; data: MemberLessonSummaryResponse }
    | { kind: "homework"; data: MemberHomeworkSummaryResponse };

const groupDetailKeyExtractor = (item: GroupDetailListItem) =>
    item.kind === "lesson"
        ? `lesson-${item.data.lessonId}`
        : `homework-${item.data.homeworkId}`;

type GroupParams = {
    groupId: string;
};

type GroupDetailTab = "lessons" | "homework";

export default function GroupDetailScreen() {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const reducedMotion = useReducedMotion();
    const { groupId } = useLocalSearchParams<GroupParams>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const [activeTab, setActiveTab] = useState<GroupDetailTab>("lessons");
    const { data, isLoading, isError, refetch, isRefetching } =
        useMemberGroupById(Number(groupId));
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => refetch({ cancelRefetch: false }));

    const group = data?.data.group;
    const lessons = [...(data?.data.lessons ?? [])].sort(
        (a, b) =>
            (a.orderIndex ?? Number.MAX_SAFE_INTEGER) -
            (b.orderIndex ?? Number.MAX_SAFE_INTEGER),
    );
    const groupHomeworks = data?.data.homeworks ?? [];
    const completedLessons = lessons.filter(
        (lesson) => lesson.lessonStatus === "COMPLETED",
    ).length;
    const totalLessons = lessons.length;
    const progress =
        totalLessons > 0
            ? Math.min(100, Math.max(0, Math.round((completedLessons / totalLessons) * 100)))
            : 0;
    const scheduleLabel = getRangeLabel(
        fmtDate(group?.programStartDate),
        fmtDate(group?.programEndDate),
    );
    const timeframeLabel = getRangeLabel(
        fmtTime(group?.sessionStartTime),
        fmtTime(group?.sessionEndTime),
    );

    const refreshControl = (
        <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={handlePullRefresh}
        />
    );

    if (isLoading) {
        return (
            <Screen contentClassName="gap-6">
                <GroupDetailSkeleton />
            </Screen>
        );
    }

    if (isError && !data) {
        return (
            <Screen
                contentClassName="grow"
                bottomPadding={16}
                refreshControl={refreshControl}
            >
                <ErrorState
                    title={t("groupsFlow.failedGroupTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={
                        isRefetching
                            ? t("common.refreshing")
                            : t("common.refreshTryAgain")
                    }
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
            <Screen
                contentClassName="grow"
                bottomPadding={16}
                refreshControl={refreshControl}
            >
                <CompactEmptyState
                    title={t("groupsFlow.groupNotAvailableTitle")}
                    message={t("groupsFlow.groupNotFoundMessage")}
                />
            </Screen>
        );
    }

    const statusTone = getGroupStatusTone(group.groupStatus);
    const programName = group.lessonProgramName?.trim();
    const tabOptions = [
        {
            value: "lessons" as const,
            label: `${t("groupsFlow.lessonsTitle")} (${lessons.length})`,
        },
        {
            value: "homework" as const,
            label: `${t("groupsFlow.homeworkTitle")} (${groupHomeworks.length})`,
        },
    ];

    const listData: GroupDetailListItem[] =
        activeTab === "lessons"
            ? lessons.map((data) => ({ kind: "lesson" as const, data }))
            : groupHomeworks.map((data) => ({ kind: "homework" as const, data }));

    const listHeader = (
        <View className="gap-6 pb-3">
            <View className="gap-5">
                <View className="gap-2">
                    {group.groupStatus ? (
                        <View className="flex-row items-center gap-2">
                            <View
                                className={cn(
                                    "rounded-md px-2.5 py-1",
                                    statusTone.className,
                                )}
                            >
                                <AppText
                                    variant="badge"
                                    wrap={false}
                                    color={statusTone.color}
                                    textStyle={{ fontWeight: "600" }}
                                >
                                    {formatType(group.groupStatus, t)}
                                </AppText>
                            </View>
                        </View>
                    ) : null}

                    <NativeText variant="h2" textStyle={{ fontWeight: "700" }}>
                        {getGroupName(group)}
                    </NativeText>

                    {programName ? (
                        <AppText
                            variant="meta"
                            color="mutedForeground"
                            numberOfLines={2}
                        >
                            {programName}
                        </AppText>
                    ) : null}
                </View>

                <View className="gap-2.5">
                    <View className="flex-row items-baseline justify-between gap-3">
                        <AppText
                            variant="h1"
                            color="foreground"
                            wrap={false}
                            textStyle={{
                                fontWeight: "800",
                                fontVariant: ["tabular-nums"],
                            }}
                        >
                            {`${progress}%`}
                        </AppText>
                        <AppText
                            variant="meta"
                            color="mutedForeground"
                            numberOfLines={1}
                            textStyle={{
                                fontWeight: "500",
                                fontVariant: ["tabular-nums"],
                            }}
                        >
                            {progress === 100
                                ? t("groupsFlow.allLessonsCompleted")
                                : t("groupsFlow.lessonsCompleted", {
                                      completed: completedLessons,
                                      total: totalLessons,
                                  })}
                        </AppText>
                    </View>

                    <View className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <Animated.View
                            className="h-full rounded-full bg-primary"
                            style={{
                                width: `${progress}%`,
                                transitionProperty: "width",
                                transitionDuration: reducedMotion ? 0 : 280,
                                transitionTimingFunction: PROGRESS_EASING,
                            }}
                        />
                    </View>
                </View>

                <View>
                    <Divider className="bg-border/70" />
                    <View className="flex-row flex-wrap items-center gap-x-5 gap-y-2 py-3.5">
                        <View className="flex-row items-center gap-2">
                            <Calendar
                                size={15}
                                color={colors.mutedForeground}
                                strokeWidth={2}
                            />
                            <AppText
                                variant="meta"
                                color="foreground"
                                wrap={false}
                                textStyle={{
                                    fontWeight: "600",
                                    fontVariant: ["tabular-nums"],
                                }}
                            >
                                {scheduleLabel}
                            </AppText>
                        </View>

                        {timeframeLabel !== "—" ? (
                            <View className="flex-row items-center gap-2">
                                <Clock
                                    size={15}
                                    color={colors.mutedForeground}
                                    strokeWidth={2}
                                />
                                <AppText
                                    variant="meta"
                                    color="foreground"
                                    wrap={false}
                                    textStyle={{
                                        fontWeight: "600",
                                        fontVariant: ["tabular-nums"],
                                    }}
                                >
                                    {timeframeLabel}
                                </AppText>
                            </View>
                        ) : null}
                    </View>
                    <Divider className="bg-border/70" />
                </View>
            </View>

            <SegmentedControl
                options={tabOptions}
                value={activeTab}
                onChange={setActiveTab}
            />
        </View>
    );

    return (
        <Screen scroll={false} bottomPadding={0}>
            <FlatList
                className="flex-1"
                data={listData}
                keyExtractor={groupDetailKeyExtractor}
                ItemSeparatorComponent={GroupDetailSeparator}
                contentContainerStyle={GROUP_DETAIL_LIST_STYLE}
                showsVerticalScrollIndicator={false}
                refreshControl={refreshControl}
                ListHeaderComponent={listHeader}
                ListEmptyComponent={
                    <CompactEmptyState
                        title={
                            activeTab === "lessons"
                                ? t("groupsFlow.noLessons")
                                : t("groupsFlow.noHomework")
                        }
                    />
                }
                renderItem={({ item }) =>
                    item.kind === "lesson" ? (
                        <LessonRow
                            lesson={item.data}
                            disabled={isLocked}
                            onPress={() => {
                                void queryClient.prefetchQuery(
                                    getMemberLessonByGroupQueryOptions(
                                        Number(groupId),
                                        item.data.lessonId,
                                    ),
                                );
                                runWithNavigationLock(() => {
                                    router.push({
                                        pathname:
                                            "/groups/[groupId]/lessons/[lessonId]",
                                        params: {
                                            groupId,
                                            lessonId: String(
                                                item.data.lessonId,
                                            ),
                                        },
                                    });
                                });
                            }}
                        />
                    ) : (
                        <HomeworkRow
                            homework={item.data}
                            disabled={isLocked}
                            onPress={() => {
                                void queryClient.prefetchQuery(
                                    getMemberHomeworkByIdQueryOptions(
                                        item.data.homeworkId,
                                    ),
                                );
                                runWithNavigationLock(() => {
                                    router.push({
                                        pathname: "/homework/[homeworkId]",
                                        params: {
                                            homeworkId: String(
                                                item.data.homeworkId,
                                            ),
                                        },
                                    });
                                });
                            }}
                        />
                    )
                }
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
    onPress: () => void;
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
            subtitle={
                formatDateForDisplay(lesson.startTime ?? null) || undefined
            }
            meta={
                !isCompleted && lesson.lessonStatus ? (
                    <Badge
                        label={formatType(lesson.lessonStatus, t)}
                        className={`px-2 py-0.5 ${lessonStatusTone.className}`}
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
                fontWeight: isCompleted ? "500" : "600",
                lineHeight: 22,
                color: isCompleted ? colors.mutedForeground : colors.foreground,
            }}
            disabled={disabled}
            onPress={onPress}
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
    onPress: () => void;
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
                : statusTone.color === "warning"
                    ? "warning"
                    : "muted";
    const iconColor =
        iconTone === "danger"
            ? colors.danger
            : iconTone === "success"
                ? colors.success
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
                homework.homeworkStatus ? (
                    <Badge
                        label={statusLabel}
                        className={`px-2 py-0.5 ${statusTone.className}`}
                        color={statusTone.color}
                    />
                ) : undefined
            }
            leading={
                <RowIcon tone={iconTone}>
                    <ClipboardCheck
                        size={18}
                        color={iconColor}
                        strokeWidth={2.2}
                    />
                </RowIcon>
            }
            className={
                isUrgent
                    ? "border-danger/25 bg-danger/5 px-4 py-3.5"
                    : "border-border bg-card px-4 py-3.5"
            }
            titleStyle={{ fontWeight: "600", lineHeight: 22 }}
            disabled={disabled}
            onPress={onPress}
        />
    );
});

type RowIconTone = "primary" | "muted" | "success" | "warning" | "danger";

function RowIcon({
    children,
    tone = "muted",
}: {
    children: ReactNode;
    tone?: RowIconTone;
}) {
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

    return (
        <View
            className={cn(
                "h-10 w-10 items-center justify-center rounded-xl",
                toneClassName,
            )}
        >
            {children}
        </View>
    );
}

function GroupDetailSkeleton() {
    return (
        <>
            <View className="gap-5">
                <View className="gap-2">
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-8 w-3/4 rounded-full" />
                    <Skeleton className="h-4 w-1/2 rounded-full" />
                </View>

                <View className="gap-2.5">
                    <View className="flex-row items-baseline justify-between gap-3">
                        <Skeleton className="h-8 w-16 rounded-lg" />
                        <Skeleton className="h-4 w-28 rounded-full" />
                    </View>
                    <Skeleton className="h-2 w-full rounded-full" />
                </View>

                <View>
                    <Divider className="bg-border/70" />
                    <View className="flex-row items-center gap-5 py-3.5">
                        <Skeleton className="h-4 w-36 rounded-full" />
                        <Skeleton className="h-4 w-24 rounded-full" />
                    </View>
                    <Divider className="bg-border/70" />
                </View>
            </View>

            <View className="gap-3">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <View className="gap-2.5">
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
