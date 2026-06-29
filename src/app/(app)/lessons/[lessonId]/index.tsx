import {
    AppText,
    Badge,
    Card,
    CompactEmptyState,
    ErrorState,
    ListRow,
    Screen,
    Skeleton,
    useThemeColors,
} from "@/design-system";
import {
    getMemberHomeworkByIdQueryOptions,
    useMemberLessonById,
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
import { Check, ClipboardCheck, PlayCircle } from "lucide-react-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

type LessonParams = {
    lessonId: string;
};

export default function StandaloneLessonDetailScreen() {
    const { t } = useTranslation();
    const { lessonId } = useLocalSearchParams<LessonParams>();
    const numericLessonId = Number(lessonId);
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberLessonById(numericLessonId);

    const detail = data?.data;
    const lesson = detail?.lesson;
    const sessions = detail?.sessions ?? [];
    const homeworks = detail?.homeworks ?? [];
    const submissions = detail?.currentHomeworkSubmissions ?? [];
    const lessonStatusTone = getLessonStatusTone(lesson?.lessonStatus);

    const refreshControl = (
        <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
                void refetch();
            }}
        />
    );

    if (isLoading) {
        return (
            <Screen contentClassName="gap-6">
                <LessonDetailSkeleton />
            </Screen>
        );
    }

    if (isError) {
        return (
            <Screen contentClassName="grow" refreshControl={refreshControl}>
                <ErrorState
                    title={t("lessons.failedLessonTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    onAction={() => {
                        void refetch();
                    }}
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
            <Card className="gap-0 overflow-hidden p-0">
                <View className="gap-4 bg-surface px-5 py-5">
                    <View className="gap-2">
                        <AppText
                            variant="h3"
                            className="text-xl font-semibold leading-7"
                            numberOfLines={2}
                        >
                            {getLessonName(lesson)}
                        </AppText>
                        <AppText
                            variant="meta"
                            className="leading-5 text-muted-foreground"
                            numberOfLines={2}
                        >
                            {getLessonMeta(detail)}
                        </AppText>
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                        {lesson.lessonStatus ? (
                            <Badge
                                label={formatType(lesson.lessonStatus)}
                                className={lessonStatusTone.className}
                                textClassName={lessonStatusTone.textClassName}
                            />
                        ) : null}
                        <Badge
                            label={t("lessons.sessionsCount", { count: sessions.length })}
                            className="bg-muted"
                            textClassName="text-muted-foreground"
                        />
                        <Badge
                            label={t("lessons.homeworkCount", { count: homeworks.length })}
                            className="bg-muted"
                            textClassName="text-muted-foreground"
                        />
                    </View>
                </View>

                {lesson.description?.trim() ? (
                    <View className="px-5 py-5">
                        <AppText variant="body" className="leading-6 text-foreground">
                            {lesson.description}
                        </AppText>
                    </View>
                ) : null}
            </Card>

            <Card className="gap-4 p-5">
                <SectionHeader title={t("lessons.sessionsTitle")} count={sessions.length} />
                {sessions.length === 0 ? (
                    <CompactEmptyState
                        title={t("lessons.noSessions")}
                    />
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
                                            `/lessons/${numericLessonId}/sessions?sessionId=${session.id}`,
                                        );
                                    });
                                }}
                            />
                        ))}
                    </View>
                )}
            </Card>

            <Card className="gap-4 p-5">
                <SectionHeader title={t("lessons.homeworkTitle")} count={homeworks.length} />
                {homeworks.length === 0 ? (
                    <CompactEmptyState
                        title={t("lessons.noHomework")}
                    />
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
                                        getMemberHomeworkByIdQueryOptions(homework.homeworkId),
                                    );
                                    runWithNavigationLock(() => {
                                        router.push({
                                            pathname: "/homework/[homeworkId]",
                                            params: {
                                                homeworkId: String(homework.homeworkId),
                                            },
                                        });
                                    });
                                }}
                            />
                        ))}
                    </View>
                )}
            </Card>
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

    return [
        detail.group ? getGroupName(detail.group) : null,
        date || null,
    ].filter(Boolean).join(" / ") || "-";
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
    const { t } = useTranslation();
    const colors = useThemeColors();
    const isCompleted = session.status === "COMPLETED" || !!session.completedAt;
    const rowClassName = isCompleted
        ? "border-emerald-100 bg-emerald-50/60 px-4 py-3.5"
        : "border-border bg-card px-4 py-3.5";

    return (
        <ListRow
            title={getSessionTitle(session)}
            subtitle={session.descriptionSnapshot?.trim() || undefined}
            meta={session.orderIndex != null ? `#${session.orderIndex}` : undefined}
            leading={(
                <RowIcon tone={isCompleted ? "success" : "primary"}>
                    {isCompleted ? (
                        <Check size={18} color={colors.success} />
                    ) : (
                        <PlayCircle size={18} color={colors.primary} />
                    )}
                </RowIcon>
            )}
            className={rowClassName}
            titleClassName={isCompleted ? "font-medium leading-6 text-foreground/70" : "font-medium leading-6"}
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
        (submission) => submission.homeworkId === homework.homeworkId && submission.isCurrent,
    );
    const submissionStatus = latestSubmission?.status ?? homework.currentSubmissionStatus;
    const reviewStatus = latestSubmission?.review?.status ?? homework.currentReviewStatus;
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
    const rowClassName = getHomeworkRowClassName(reviewStatus, submissionStatus, homework.homeworkStatus);

    return (
        <ListRow
            title={getHomeworkTitle(homework)}
            subtitle={homework.dueAt
                ? t("lessons.dueDate", { date: formatDateForDisplay(homework.dueAt) })
                : homework.description ?? undefined}
            meta={(
                <Badge
                    label={statusLabel}
                    className={`px-2 py-1 ${statusTone.className}`}
                    textClassName={statusTone.textClassName}
                />
            )}
            leading={<RowIcon><ClipboardCheck size={18} color={colors.mutedForeground} /></RowIcon>}
            className={rowClassName}
            titleClassName="font-medium leading-6"
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

function SectionHeader({
    title,
    count,
}: {
    title: string;
    count: number;
}) {
    return (
        <View className="flex-row items-center justify-between gap-4">
            <AppText variant="h3" className="text-lg font-semibold">
                {title}
            </AppText>
            {count > 0 ? <AppText variant="count">{count}</AppText> : null}
        </View>
    );
}

function getFallbackHomeworkTone(status?: string | null) {
    if (status === "COMPLETED" || status === "SUBMITTED") {
        return {
            className: "bg-emerald-100",
            textClassName: "text-emerald-700",
        };
    }

    if (status === "OVERDUE" || status === "REJECTED" || status === "MISSING") {
        return {
            className: "bg-rose-100",
            textClassName: "text-rose-700",
        };
    }

    return {
        className: "bg-amber-100",
        textClassName: "text-amber-700",
    };
}

function getHomeworkRowClassName(
    reviewStatus?: string | null,
    submissionStatus?: string | null,
    homeworkStatus?: string | null,
) {
    if (reviewStatus === "CONFIRMED" || submissionStatus === "REVIEWED" || homeworkStatus === "COMPLETED") {
        return "border-emerald-100 bg-emerald-50/60 px-4 py-3.5";
    }

    if (
        homeworkStatus === "OVERDUE"
        || homeworkStatus === "REJECTED"
        || homeworkStatus === "MISSING"
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
