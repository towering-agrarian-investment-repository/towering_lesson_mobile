import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import {
    Badge,
    CompactEmptyState,
    ErrorState,
    ListRow,
    Screen,
    Skeleton,
    useThemeColors,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import {
    getMemberHomeworkByIdQueryOptions,
    getMemberLessonByGroupQueryOptions,
    useMemberGroupById,
    useMemberHomeworks,
} from "@/lib/hook/useMemberLessonFlow";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
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
import { Host, Text } from "@expo/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, Check, ClipboardCheck } from "lucide-react-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

type GroupParams = {
    groupId: string;
};

export default function GroupDetailScreen() {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const { groupId } = useLocalSearchParams<GroupParams>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const { data, isLoading, isError, refetch, isRefetching } =
        useMemberGroupById(Number(groupId));
    const { data: homeworkResponse, refetch: refetchHomeworks } =
        useMemberHomeworks();

    const hasEmbeddedHomeworks = data?.data.homeworks !== undefined;
    const group = data?.data.group;
    const lessons = [...(data?.data.lessons ?? [])].sort(
        (a, b) =>
            (a.orderIndex ?? Number.MAX_SAFE_INTEGER) -
            (b.orderIndex ?? Number.MAX_SAFE_INTEGER),
    );
    const groupHomeworks = hasEmbeddedHomeworks
        ? (data?.data.homeworks ?? [])
        : (homeworkResponse?.data ?? []).filter(
            (homework) => homework.lessonProgramGroupId === Number(groupId),
        );
    const completedLessons = lessons.filter(
        (lesson) => lesson.lessonStatus === "COMPLETED",
    ).length;
    const totalLessons = lessons.length;
    const progress =
        totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
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
            refreshing={isRefetching}
            onRefresh={() => {
                void refetch();
                void refetchHomeworks();
            }}
        />
    );

    if (isLoading) {
        return (
            <Screen contentClassName="gap-6">
                <GroupDetailSkeleton />
            </Screen>
        );
    }

    if (isError) {
        return (
            <Screen contentClassName="grow" refreshControl={refreshControl}>
                <ErrorState
                    title={t("groupsFlow.failedGroupTitle")}
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
            </Screen>
        );
    }

    if (!group) {
        return (
            <Screen contentClassName="gap-5" refreshControl={refreshControl}>
                <CompactEmptyState
                    title={t("groupsFlow.groupNotAvailableTitle")}
                    message={t("groupsFlow.groupNotFoundMessage")}
                />
            </Screen>
        );
    }

    return (
        <Screen contentClassName="gap-5" refreshControl={refreshControl}>
            <View className="overflow-hidden rounded-xl bg-card">
                <View className="gap-4 bg-surface px-4 py-4">
                    <View className="gap-3">
                        <View className="gap-2">
                            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                <Text
                                    numberOfLines={2}
                                    textStyle={{
                                        ...typography.h3,
                                        color: uiColors.foreground,
                                        fontSize: typography.h3.fontSize * uiFontScale,
                                        fontWeight: "600" as const,
                                        lineHeight: typography.h3.lineHeight * uiFontScale,
                                    }}
                                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                    {getGroupName(group)}
                                </Text>
                            </Host>
                            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                <Text
                                    numberOfLines={2}
                                    textStyle={{
                                        ...typography.meta,
                                        lineHeight: typography.subtext.lineHeight * uiFontScale,
                                        color: uiColors.mutedForeground,
                                        fontSize:
                                            typography.meta.fontSize *
                                            uiFontScale,
                                    }}
                                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                    {group.lessonProgramName?.trim() ||
                                        t("groupsFlow.missingValue")}
                                </Text>
                            </Host>
                        </View>

                        <GroupProgressCard
                            completedLessons={completedLessons}
                            progress={progress}
                            scheduleLabel={scheduleLabel}
                            timeframeLabel={timeframeLabel}
                            totalLessons={totalLessons}
                        />
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                        {group.groupStatus ? (
                            <Badge
                                label={formatType(group.groupStatus)}
                                className="bg-primary/10"
                                color="primary"
                            />
                        ) : null}
                        <Badge
                            label={t("groupsFlow.lessonsCount", {
                                count: lessons.length,
                            })}
                            className="bg-muted"
                            color="mutedForeground"
                        />
                        <Badge
                            label={t("groupsFlow.homeworkCount", {
                                count: groupHomeworks.length,
                            })}
                            className="bg-muted"
                            color="mutedForeground"
                        />
                    </View>
                </View>
            </View>

            <SectionHeader
                title={t("groupsFlow.lessonsTitle")}
                count={lessons.length}
            />
            {lessons.length === 0 ? (
                <CompactEmptyState title={t("groupsFlow.noLessons")} />
            ) : (
                <View className="gap-3">
                    {lessons.map((lesson) => (
                        <LessonRow
                            key={`lesson-${lesson.lessonId}`}
                            lesson={lesson}
                            disabled={isLocked}
                            onPress={() => {
                                void queryClient.prefetchQuery(
                                    getMemberLessonByGroupQueryOptions(
                                        Number(groupId),
                                        lesson.lessonId,
                                    ),
                                );
                                runWithNavigationLock(() => {
                                    router.push({
                                        pathname:
                                            "/groups/[groupId]/lessons/[lessonId]",
                                        params: {
                                            groupId,
                                            lessonId: String(lesson.lessonId),
                                        },
                                    });
                                });
                            }}
                        />
                    ))}
                </View>
            )}

            <SectionHeader
                title={t("groupsFlow.homeworkTitle")}
                count={groupHomeworks.length}
            />
            {groupHomeworks.length === 0 ? (
                <CompactEmptyState title={t("groupsFlow.noHomework")} />
            ) : (
                <View className="gap-3">
                    {groupHomeworks.map((homework) => (
                        <HomeworkRow
                            key={`homework-${homework.homeworkId}`}
                            homework={homework}
                            disabled={isLocked}
                            onPress={() => {
                                void queryClient.prefetchQuery(
                                    getMemberHomeworkByIdQueryOptions(
                                        homework.homeworkId,
                                    ),
                                );
                                runWithNavigationLock(() => {
                                    router.push({
                                        pathname: "/homework/[homeworkId]",
                                        params: {
                                            homeworkId: String(
                                                homework.homeworkId,
                                            ),
                                        },
                                    });
                                });
                            }}
                        />
                    ))}
                </View>
            )}
        </Screen>
    );
}

function LessonRow({
    lesson,
    disabled,
    onPress,
}: {
    lesson: MemberLessonSummaryResponse;
    disabled: boolean;
    onPress: () => void;
}) {
    const colors = useThemeColors();
    const isCompleted = lesson.lessonStatus === "COMPLETED";
    const lessonStatusTone = getLessonStatusTone(lesson.lessonStatus);
    const rowClassName = isCompleted
        ? "border-emerald-100 bg-emerald-50/60 px-4 py-3.5"
        : "border-border bg-card px-4 py-3.5";

    return (
        <ListRow
            title={getLessonName(lesson)}
            subtitle={
                formatDateForDisplay(lesson.startTime ?? null) || undefined
            }
            meta={
                lesson.lessonStatus ? (
                    <Badge
                        label={formatType(lesson.lessonStatus)}
                        className={`px-2 py-1 ${lessonStatusTone.className}`}
                        color={lessonStatusTone.color}
                    />
                ) : lesson.orderIndex != null ? (
                    `#${lesson.orderIndex}`
                ) : undefined
            }
            leading={
                <RowIcon tone={isCompleted ? "success" : "primary"}>
                    {isCompleted ? (
                        <Check size={18} color={colors.success} />
                    ) : (
                        <BookOpen size={18} color={colors.primary} />
                    )}
                </RowIcon>
            }
            className={rowClassName}
            titleStyle={{
                fontWeight: "500",
                lineHeight: 24,
                color: isCompleted
                    ? colors.foreground + "b3"
                    : colors.foreground,
            }}
            disabled={disabled}
            onPress={onPress}
        />
    );
}

function HomeworkRow({
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
        ? formatType(reviewStatus)
        : submissionStatus
            ? formatType(submissionStatus)
            : formatType(homework.homeworkStatus);
    const statusTone = reviewStatus
        ? getHomeworkReviewTone(reviewStatus)
        : submissionStatus
            ? getHomeworkSubmissionTone(submissionStatus)
            : getFallbackHomeworkTone(homework.homeworkStatus);
    const rowClassName = getHomeworkRowClassName(
        reviewStatus,
        submissionStatus,
        homework.homeworkStatus,
    );

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
                        className={`px-2 py-1 ${statusTone.className}`}
                        color={statusTone.color}
                    />
                ) : undefined
            }
            leading={
                <RowIcon>
                    <ClipboardCheck size={18} color={colors.mutedForeground} />
                </RowIcon>
            }
            className={rowClassName}
            titleStyle={{ fontWeight: "500", lineHeight: 24 }}
            disabled={disabled}
            onPress={onPress}
        />
    );
}

function RowIcon({
    children,
    tone = "muted",
}: {
    children: ReactNode;
    tone?: "primary" | "muted" | "success";
}) {
    return (
        <View
            className={
                tone === "primary"
                    ? "h-10 w-10 items-center justify-center rounded-xl bg-primary/10"
                    : tone === "success"
                        ? "h-10 w-10 items-center justify-center rounded-xl bg-success/10"
                        : "h-10 w-10 items-center justify-center rounded-xl bg-muted"
            }
        >
            {children}
        </View>
    );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    return (
        <View className="flex-row items-center justify-between gap-4">
            <Host matchContents ignoreSafeArea="all">
                <Text
                    textStyle={{
                        ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale,
                        color: uiColors.foreground,
                        fontSize: typography.subtitle.fontSize * uiFontScale,
                        fontWeight: "600" as const,
                    }}
                >
                    {title}
                </Text>
            </Host>
            {count > 0 ? (
                <Host matchContents ignoreSafeArea="all">
                    <Text
                        textStyle={{
                            ...typography.count, lineHeight: typography.count.lineHeight * uiFontScale,
                            color: uiColors.mutedForeground,
                            fontSize: typography.count.fontSize * uiFontScale,
                        }}
                    >
                        {String(count ?? "")}
                    </Text>
                </Host>
            ) : null}
        </View>
    );
}

function GroupProgressCard({
    completedLessons,
    progress,
    scheduleLabel,
    timeframeLabel,
    totalLessons,
}: {
    completedLessons: number;
    progress: number;
    scheduleLabel: string;
    timeframeLabel: string;
    totalLessons: number;
}) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();

    return (
        <View className="gap-3 rounded-2xl bg-background px-4 py-4">
            <View className="flex-row items-end justify-between gap-4">
                <View className="min-w-0 flex-1 gap-1">
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={{
                                ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                color: uiColors.mutedForeground,
                                letterSpacing: 1.28,
                                fontSize:
                                    typography.caption.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {t("groupsFlow.progress").toUpperCase()}
                        </Text>
                    </Host>
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={{
                                ...typography.body,
                                fontWeight: "500" as const,
                                lineHeight: typography.body.lineHeight * uiFontScale,
                                color: uiColors.foreground,
                                fontSize:
                                    typography.body.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {progress === 100
                                ? t("groupsFlow.allLessonsCompleted")
                                : t("groupsFlow.lessonsCompleted", {
                                    completed: completedLessons,
                                    total: totalLessons,
                                })}
                        </Text>
                    </Host>
                </View>

                <Host matchContents ignoreSafeArea="all">
                    <Text
                        textStyle={{
                            ...typography.value, lineHeight: typography.h2.lineHeight * uiFontScale,
                            textAlign: "right" as const,
                            fontSize: typography.h2.fontSize * uiFontScale,
                            fontWeight: "700" as const,
                            color: uiColors.primary,
                        }}
                    >
                        {String(progress ?? "") + "%"}
                    </Text>
                </Host>
            </View>

            <View className="h-2.5 overflow-hidden rounded-full bg-muted">
                <View
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress}%` }}
                />
            </View>

            <View className="gap-2">
                <ProgressMetaRow
                    label={t("groupsFlow.schedule")}
                    value={scheduleLabel}
                />
                <ProgressMetaRow
                    label={t("groupsFlow.time")}
                    value={timeframeLabel}
                />
            </View>
        </View>
    );
}

function ProgressMetaRow({ label, value }: { label: string; value: string }) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    return (
        <View className="flex-row items-center justify-between gap-3">
            <Host
                matchContents
                ignoreSafeArea="all"
                style={{ flexShrink: 0 }}
            >
                <Text
                    textStyle={{
                        ...typography.caption,
                        lineHeight: typography.subtext.lineHeight * uiFontScale,
                        color: uiColors.mutedForeground,
                        fontSize: typography.caption.fontSize * uiFontScale,
                    }}
                >
                    {label}
                </Text>
            </Host>
            <Host
                matchContents={{ vertical: true }}
                ignoreSafeArea="all"
                style={{ flex: 1, minWidth: 0 }}
            >
                <Text
                    numberOfLines={1}
                    textStyle={{
                        ...typography.caption,
                        textAlign: "right" as const,
                        fontWeight: "500" as const,
                        lineHeight: typography.subtext.lineHeight * uiFontScale,
                        color: uiColors.foreground,
                        fontSize: typography.caption.fontSize * uiFontScale,
                    }}
                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "trailing" })] : [fillMaxWidth()]}>
                    {value}
                </Text>
            </Host>
        </View>
    );
}

function GroupDetailSkeleton() {
    return (
        <>
            <View className="gap-3 rounded-2xl border border-border bg-card p-4">
                <Skeleton className="h-7 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-2/3 rounded-full" />
                <Skeleton className="h-24 w-full rounded-2xl" />
            </View>

            {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
        </>
    );
}

function getRangeLabel(start: string, end: string) {
    const missingValue = "-";

    if (start === missingValue && end === missingValue) {
        return missingValue;
    }

    return `${start} - ${end}`;
}

function getFallbackHomeworkTone(status?: string | null) {
    if (status === "COMPLETED" || status === "SUBMITTED") {
        return {
            className: "bg-emerald-100",
            color: "success" as const,
        };
    }

    if (status === "OVERDUE" || status === "REJECTED" || status === "MISSING") {
        return {
            className: "bg-rose-100",
            color: "danger" as const,
        };
    }

    return {
        className: "bg-amber-100",
        color: "warning" as const,
    };
}

function getHomeworkRowClassName(
    reviewStatus?: string | null,
    submissionStatus?: string | null,
    homeworkStatus?: string | null,
) {
    if (
        reviewStatus === "CONFIRMED" ||
        submissionStatus === "REVIEWED" ||
        homeworkStatus === "COMPLETED"
    ) {
        return "border-emerald-100 bg-emerald-50/60 px-4 py-3.5";
    }

    if (
        homeworkStatus === "OVERDUE" ||
        homeworkStatus === "REJECTED" ||
        homeworkStatus === "MISSING"
    ) {
        return "border-rose-100 bg-rose-50/70 px-4 py-3.5";
    }

    return "border-border bg-card px-4 py-3.5";
}
