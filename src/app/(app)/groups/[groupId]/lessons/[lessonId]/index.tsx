import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { NativeText } from "@/design-system/components/NativeText";
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
    useMemberLessonByGroup,
} from "@/lib/hook/useMemberLessonFlow";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import type {
    MemberHomeworkSubmissionResponse,
    MemberHomeworkSummaryResponse,
} from "@/types/member-homework";
import type { SessionInstanceResponse } from "@/types/member-session";
import { formatType } from "@/utils/format-enum";
import {
    getGroupName,
    getHomeworkTitle,
    getLessonName,
    getSessionTitle,
} from "@/utils/member-lesson";
import {
    getHomeworkReviewTone,
    getHomeworkSubmissionTone,
    getLessonStatusTone,
} from "@/utils/status-tone";
import { formatDateForDisplay } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Check,
    ClipboardCheck,
    FileText,
    PlayCircle,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

type LessonParams = {
    groupId: string;
    lessonId: string;
};

export default function LessonDetailScreen() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { groupId, lessonId } = useLocalSearchParams<LessonParams>();
    const numericGroupId = Number(groupId);
    const numericLessonId = Number(lessonId);
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const { data, isLoading, isError, refetch, isRefetching } =
        useMemberLessonByGroup(numericGroupId, numericLessonId);
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => refetch({ cancelRefetch: false }));

    const detail = data?.data;
    const lesson = detail?.lesson;
    const sessions = detail?.sessions ?? [];
    const homeworks = detail?.homeworks ?? [];
    const submissions = detail?.currentHomeworkSubmissions ?? [];
    const lessonStatusTone = getLessonStatusTone(lesson?.lessonStatus);

    const refreshControl = (
        <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={handlePullRefresh}
        />
    );

    if (isLoading) {
        return (
            <Screen contentClassName="gap-6">
                <LessonDetailSkeleton />
            </Screen>
        );
    }

    if (isError && !data) {
        return (
            <Screen contentClassName="grow" refreshControl={refreshControl}>
                <ErrorState
                    title={t("lessons.failedLessonTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={
                        isRefetching
                            ? t("common.refreshing")
                            : t("common.refreshTryAgain")
                    }
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </Screen>
        );
    }

    if (!detail || !lesson) {
        return (
            <Screen contentClassName="gap-5" refreshControl={refreshControl}>
                <CompactEmptyState
                    title={t("lessons.lessonNotAvailableTitle")}
                    message={t("lessons.lessonNotFoundMessage")}
                />
            </Screen>
        );
    }

    return (
        <Screen contentClassName="gap-5" refreshControl={refreshControl}>
            <View className="overflow-hidden rounded-xl bg-card">
                <View className="gap-4 bg-surface px-4 py-4">
                    <View className="gap-2">
                        <NativeText variant="h3" numberOfLines={2} textStyle={{ fontWeight: "600" as const }}>
                            {getLessonName(lesson)}
                        </NativeText>
                        <NativeText
                            variant="meta"
                            color="mutedForeground"
                            numberOfLines={2}
                            textStyle={{ lineHeight: typography.subtext.lineHeight }}
                        >
                            {getLessonMeta(detail)}
                        </NativeText>
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                        {lesson.lessonStatus ? (
                            <Badge
                                label={formatType(lesson.lessonStatus)}
                                className={lessonStatusTone.className}
                                color={lessonStatusTone.color}
                            />
                        ) : null}
                        <Badge
                            label={t("lessons.sessionsCount", {
                                count: sessions.length,
                            })}
                            className="bg-muted"
                            color="mutedForeground"
                        />
                        <Badge
                            label={t("lessons.homeworkCount", {
                                count: homeworks.length,
                            })}
                            className="bg-muted"
                            color="mutedForeground"
                        />
                    </View>
                </View>

                {lesson.description?.trim() ? (
                    <View className="px-4 py-4">
                        <NativeText variant="body">
                            {lesson.description}
                        </NativeText>
                    </View>
                ) : null}
            </View>

            <SectionHeader
                title={t("lessons.sessionsTitle")}
                count={sessions.length}
            />
            {sessions.length === 0 ? (
                <CompactEmptyState title={t("lessons.noSessions")} />
            ) : (
                <View className="gap-3">
                    {sessions.map((session) => (
                        <SessionRow
                            key={`session-${session.id}`}
                            session={session}
                            disabled={isLocked}
                            onPress={() => {
                                runWithNavigationLock(() => {
                                    router.push(
                                        `/groups/${numericGroupId}/lessons/${numericLessonId}/sessions?sessionId=${session.id}`,
                                    );
                                });
                            }}
                        />
                    ))}
                </View>
            )}

            <SectionHeader
                title={t("lessons.homeworkTitle")}
                count={homeworks.length}
            />
            {homeworks.length === 0 ? (
                <CompactEmptyState title={t("lessons.noHomework")} />
            ) : (
                <View className="gap-3">
                    {homeworks.map((homework) => (
                        <HomeworkRow
                            key={`homework-${homework.homeworkId}`}
                            homework={homework}
                            submissions={submissions}
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

            {detail.media?.length ? (
                <>
                    <SectionHeader
                        title={t("lessons.mediaTitle")}
                        count={detail.media.length}
                    />
                    <View className="gap-3">
                        {detail.media.map((media, index) => (
                            <ListRow
                                key={`media-${media.id ?? index}`}
                                title={
                                    media.description?.trim() ||
                                    t("lessons.mediaFallback", {
                                        id: media.id ?? index + 1,
                                    })
                                }
                                subtitle={media.mediaType ?? undefined}
                                leading={
                                    <RowIcon>
                                        <FileText
                                            size={18}
                                            color={colors.mutedForeground}
                                        />
                                    </RowIcon>
                                }
                                className="border-border bg-card px-4 py-3.5"
                                titleStyle={{
                                    fontWeight: "500",
                                    lineHeight: 24,
                                }}
                                showChevron={false}
                            />
                        ))}
                    </View>
                </>
            ) : null}
        </Screen>
    );
}

function getLessonMeta(detail: {
    group?: { groupName?: string | null; name?: string | null } | null;
    lesson?: {
        startTime?: string | null;
    } | null;
}) {
    const lesson = detail.lesson;
    const date = formatDateForDisplay(lesson?.startTime ?? null);

    return (
        [getGroupName(detail.group), date || null]
            .filter(Boolean)
            .join(" / ") || "-"
    );
}

function SessionRow({
    session,
    disabled,
    onPress,
}: {
    session: SessionInstanceResponse;
    disabled: boolean;
    onPress: () => void;
}) {
    const colors = useThemeColors();
    const isCompleted = session.status === "COMPLETED" || !!session.completedAt;
    const rowClassName = isCompleted
        ? "border-emerald-100 bg-emerald-50/60 px-4 py-3.5"
        : "border-border bg-card px-4 py-3.5";

    return (
        <ListRow
            title={getSessionTitle(session)}
            subtitle={session.descriptionSnapshot?.trim() || undefined}
            meta={
                session.orderIndex != null
                    ? `#${session.orderIndex}`
                    : undefined
            }
            leading={
                <RowIcon tone={isCompleted ? "success" : "primary"}>
                    {isCompleted ? (
                        <Check size={18} color={colors.success} />
                    ) : (
                        <PlayCircle size={18} color={colors.primary} />
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
    submissions,
    disabled,
    onPress,
}: {
    homework: MemberHomeworkSummaryResponse;
    submissions: MemberHomeworkSubmissionResponse[];
    disabled: boolean;
    onPress: () => void;
}) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const latestSubmission = submissions.find(
        (submission) =>
            submission.homeworkId === homework.homeworkId &&
            submission.isCurrent,
    );
    const submissionStatus =
        latestSubmission?.status ?? homework.currentSubmissionStatus;
    const reviewStatus =
        latestSubmission?.review?.status ?? homework.currentReviewStatus;
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
                    ? t("lessons.dueDate", {
                        date: formatDateForDisplay(homework.dueAt),
                    })
                    : (homework.description ?? undefined)
            }
            meta={
                <Badge
                    label={statusLabel}
                    className={`px-2 py-1 ${statusTone.className}`}
                    color={statusTone.color}
                />
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

    return (
        <View className="flex-row items-center justify-between gap-4">
            <NativeText
                variant="h3"
                wrap={false}
                textStyle={{ fontSize: typography.subtitle.fontSize, fontWeight: "600" as const }}
            >
                {title}
            </NativeText>
            {count > 0 ? (
                <NativeText variant="count" color="mutedForeground" wrap={false}>
                    {String(count ?? "")}
                </NativeText>
            ) : null}
        </View>
    );
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

function LessonDetailSkeleton() {
    return (
        <>
            <View className="gap-3 rounded-2xl border border-border bg-card p-4">
                <Skeleton className="h-7 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-2/3 rounded-full" />
                <Skeleton className="h-20 w-full rounded-xl" />
            </View>

            {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
        </>
    );
}
