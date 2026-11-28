import {
    AnimatedPressable,
    Badge,
    CompactEmptyState,
    Divider,
    ErrorState,
    Screen,
    Skeleton,
    useThemeColors,
} from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { showAppToast } from "@/design-system/components/AppToast";
import { cn } from "@/design-system/utils/cn";
import { useTheme } from "@/design-system/utils/theme";
import { getMemberHomeworkByIdQueryOptions } from "@/lib/hook/useMemberLessonFlow";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import type { MemberHomeworkSubmissionResponse, MemberHomeworkSummaryResponse } from "@/types/member-homework";
import type { MemberLessonDetailResponse } from "@/types/member-lesson";
import type { MemberLessonSessionResponse } from "@/types/member-session";
import { formatType } from "@/utils/format-enum";
import { getGroupName, getHomeworkTitle, getLessonName, getSessionTitle } from "@/utils/member-lesson";
import { getHomeworkReviewTone, getHomeworkSubmissionTone, getLessonStatusTone } from "@/utils/status-tone";
import { formatDateForDisplay } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import Calendar from "lucide-react-native/icons/calendar";
import Check from "lucide-react-native/icons/check";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import ClipboardCheck from "lucide-react-native/icons/clipboard-check";
import Clock from "lucide-react-native/icons/clock";
import ExternalLink from "lucide-react-native/icons/external-link";
import FileText from "lucide-react-native/icons/file-text";
import UsersRound from "lucide-react-native/icons/users-round";
import { Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { openExternalUrl } from "@/utils/open-external-url";
import { RefreshControl, View } from "react-native";

type LessonDetailViewProps = {
    detail?: MemberLessonDetailResponse;
    hasData: boolean;
    isLoading: boolean;
    isError: boolean;
    isRefetching: boolean;
    onRefetch: () => Promise<unknown>;
    getSessionHref: (sessionId: number) => Href;
};

export function LessonDetailView({
    detail,
    hasData,
    isLoading,
    isError,
    isRefetching,
    onRefetch,
    getSessionHref,
}: LessonDetailViewProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { runWithNavigationLock } = useNavigationLock();
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(onRefetch);

    const lesson = detail?.lesson;
    const sessions = detail?.sessions ?? [];
    const homeworks = detail?.homeworks ?? [];
    const currentSubmissionByHomeworkId = useMemo(() => {
        const map = new Map<number, MemberHomeworkSubmissionResponse>();
        for (const submission of detail?.currentHomeworkSubmissions ?? []) {
            if (submission.isCurrent && !map.has(submission.homeworkId)) {
                map.set(submission.homeworkId, submission);
            }
        }
        return map;
    }, [detail?.currentHomeworkSubmissions]);
    const mediaItems = detail?.media ?? [];
    const lessonStatusTone = getLessonStatusTone(lesson?.lessonStatus);
    const completedSessionCount = sessions.filter(isSessionCompleted).length;
    const sessionProgress = sessions.length > 0 ? Math.round((completedSessionCount / sessions.length) * 100) : 0;
    const groupLabel = detail?.group ? getGroupName(detail.group) : null;
    const lessonDateLabel = formatDateForDisplay(lesson?.startTime ?? null) || null;
    const description = lesson?.description?.trim() || null;

    const refreshControl = <RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />;

    if (isLoading) {
        return (
            <Screen contentClassName="gap-6">
                <LessonDetailSkeleton />
            </Screen>
        );
    }

    if (isError && !hasData) {
        return (
            <Screen contentClassName="grow" refreshControl={refreshControl}>
                <ErrorState
                    title={t("lessons.failedLessonTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </Screen>
        );
    }

    if (!detail || !lesson) {
        return (
            <Screen contentClassName="gap-6" refreshControl={refreshControl}>
                <CompactEmptyState
                    title={t("lessons.lessonNotAvailableTitle")}
                    message={t("lessons.lessonNotFoundMessage")}
                />
            </Screen>
        );
    }

    return (
        <Screen contentClassName="gap-6" refreshControl={refreshControl}>
            <View className="gap-3">
                <View className="gap-2">
                    {lesson.lessonStatus ? (
                        <Badge
                            label={formatType(lesson.lessonStatus, t)}
                            className={lessonStatusTone.className}
                            color={lessonStatusTone.color}
                        />
                    ) : null}

                    <AppText variant="h2">{getLessonName(lesson)}</AppText>
                </View>

                {groupLabel || lessonDateLabel ? (
                    <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 border-y border-border/70 py-2.5">
                        {groupLabel ? (
                            <View className="min-w-0 shrink flex-row items-center gap-1.5">
                                <UsersRound size={15} color={colors.mutedForeground} strokeWidth={2} />
                                <AppText
                                    variant="subtext"
                                    color="foreground"
                                    numberOfLines={2}
                                    textStyle={{ fontWeight: "600" }}
                                >
                                    {groupLabel}
                                </AppText>
                            </View>
                        ) : null}
                        {lessonDateLabel ? (
                            <View className="flex-row items-center gap-1.5">
                                <Calendar size={15} color={colors.mutedForeground} strokeWidth={2} />
                                <AppText
                                    variant="subtext"
                                    color="foreground"
                                    wrap={false}
                                    tabular
                                    textStyle={{ fontWeight: "600" }}
                                >
                                    {lessonDateLabel}
                                </AppText>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                {description ? (
                    <AppText variant="body" color="mutedForeground">
                        {description}
                    </AppText>
                ) : null}

                {sessions.length > 0 ? (
                    <View className="gap-2 pt-1">
                        <View className="flex-row items-baseline justify-between gap-3">
                            <AppText variant="caption" color="mutedForeground" textStyle={{ fontWeight: "600" }}>
                                {t("lessons.sessionsTitle")}
                            </AppText>
                            <AppText
                                variant="caption"
                                color="mutedForeground"
                                wrap={false}
                                tabular
                                textStyle={{ fontWeight: "600" }}
                            >
                                {`${completedSessionCount} / ${sessions.length}`}
                            </AppText>
                        </View>
                        <View className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <View className="h-full rounded-full bg-primary" style={{ width: `${sessionProgress}%` }} />
                        </View>
                    </View>
                ) : null}
            </View>

            <View className="gap-3">
                <SectionHeader title={t("lessons.sessionsTitle")} count={sessions.length} />
                {sessions.length === 0 ? (
                    <CompactEmptyState title={t("lessons.noSessions")} />
                ) : (
                    <View className="overflow-hidden rounded-2xl border border-border bg-card">
                        {sessions.map((session, index) => (
                            <Fragment key={`session-${session.id}`}>
                                {index > 0 ? <Divider className="ml-[68px] bg-border/70" /> : null}
                                <SessionRow
                                    session={session}
                                    stepNumber={session.orderIndex ?? index + 1}
                                    onPress={() => {
                                        runWithNavigationLock(() => {
                                            router.push(getSessionHref(session.id));
                                        });
                                    }}
                                />
                            </Fragment>
                        ))}
                    </View>
                )}
            </View>

            <View className="gap-3">
                <SectionHeader title={t("lessons.homeworkTitle")} count={homeworks.length} />
                {homeworks.length === 0 ? (
                    <CompactEmptyState title={t("lessons.noHomework")} />
                ) : (
                    <View className="overflow-hidden rounded-2xl border border-border bg-card">
                        {homeworks.map((homework, index) => (
                            <Fragment key={`homework-${homework.homeworkId}`}>
                                {index > 0 ? <Divider className="ml-[68px] bg-border/70" /> : null}
                                <HomeworkRow
                                    homework={homework}
                                    latestSubmission={currentSubmissionByHomeworkId.get(homework.homeworkId)}
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
                            </Fragment>
                        ))}
                    </View>
                )}
            </View>

            {mediaItems.length > 0 ? (
                <View className="gap-3">
                    <SectionHeader title={t("lessons.mediaTitle")} count={mediaItems.length} />
                    <View className="overflow-hidden rounded-2xl border border-border bg-card">
                        {mediaItems.map((media, index) => {
                            const url = media.fileUrl?.trim();
                            const title =
                                media.description?.trim() ||
                                t("lessons.mediaFallback", {
                                    id: media.id ?? index + 1,
                                });
                            return (
                                <Fragment key={`media-${media.id ?? media.fileUrl ?? media.description ?? index}`}>
                                    {index > 0 ? <Divider className="ml-[68px] bg-border/70" /> : null}
                                    <AnimatedPressable
                                        accessibilityRole={url ? "button" : "text"}
                                        accessibilityLabel={title}
                                        disabled={!url}
                                        haptic={url ? "selection" : false}
                                        className="min-h-16 flex-row items-center gap-3 rounded-lg px-4 py-3.5 active:bg-surface"
                                        onPress={
                                            url
                                                ? () => {
                                                      void openExternalUrl(url, colors).catch(() => {
                                                          showAppToast({
                                                              message: t("common.unableToOpenLink"),
                                                              type: "error",
                                                          });
                                                      });
                                                  }
                                                : undefined
                                        }
                                    >
                                        <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                                            <FileText size={18} color={colors.mutedForeground} strokeWidth={2} />
                                        </View>
                                        <View style={{ flex: 1, minWidth: 0 }} className="gap-1">
                                            <AppText variant="label" numberOfLines={2}>
                                                {title}
                                            </AppText>
                                            {media.mediaType ? (
                                                <AppText variant="caption" color="mutedForeground" numberOfLines={2}>
                                                    {media.mediaType}
                                                </AppText>
                                            ) : null}
                                        </View>
                                        {url ? (
                                            <View className="shrink-0">
                                                <ExternalLink
                                                    size={16}
                                                    color={colors.mutedForeground}
                                                    strokeWidth={2}
                                                />
                                            </View>
                                        ) : null}
                                    </AnimatedPressable>
                                </Fragment>
                            );
                        })}
                    </View>
                </View>
            ) : null}
        </Screen>
    );
}

function isSessionCompleted(session: MemberLessonSessionResponse) {
    return session.status === "COMPLETED" || !!session.completedAt;
}

function SessionRow({
    session,
    stepNumber,
    onPress,
}: {
    session: MemberLessonSessionResponse;
    stepNumber: number;
    onPress: () => void;
}) {
    const colors = useThemeColors();
    const { t } = useTranslation();
    const isCompleted = isSessionCompleted(session);
    const subtitleParts = [
        session.typeSnapshot ? formatType(session.typeSnapshot, t) : null,
        session.durationMinutesSnapshot != null
            ? t("lessonSessions.minutes", {
                  value: session.durationMinutesSnapshot,
              })
            : null,
    ].filter(Boolean);
    const subtitle = subtitleParts.join(" · ") || session.descriptionSnapshot?.trim() || undefined;

    return (
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={getSessionTitle(session)}
            haptic="selection"
            className="min-h-16 flex-row items-center gap-3 rounded-lg px-4 py-3.5 active:bg-surface"
            onPress={onPress}
        >
            <View
                className={cn(
                    "h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    isCompleted ? "bg-success/15" : "bg-primary/10",
                )}
            >
                {isCompleted ? (
                    <Check size={18} color={colors.success} strokeWidth={2.4} />
                ) : (
                    <AppText variant="subtext" color="primary" wrap={false} tabular textStyle={{ fontWeight: "700" }}>
                        {String(stepNumber)}
                    </AppText>
                )}
            </View>

            <View style={{ flex: 1, minWidth: 0 }} className="gap-1">
                <AppText
                    variant={isCompleted ? "body" : "label"}
                    numberOfLines={2}
                    color={isCompleted ? "mutedForeground" : "foreground"}
                >
                    {getSessionTitle(session)}
                </AppText>
                {subtitle ? (
                    <View className="flex-row items-center gap-1">
                        {session.durationMinutesSnapshot != null && subtitleParts.length > 0 ? (
                            <Clock size={12} color={colors.mutedForeground} strokeWidth={2} />
                        ) : null}
                        <AppText
                            variant="caption"
                            color="mutedForeground"
                            numberOfLines={2}
                            tabular
                            style={{ flex: 1, minWidth: 0 }}
                        >
                            {subtitle}
                        </AppText>
                    </View>
                ) : null}
            </View>

            <View className="shrink-0">
                <ChevronRight size={16} color={colors.mutedForeground} strokeWidth={2.2} />
            </View>
        </AnimatedPressable>
    );
}

function HomeworkRow({
    homework,
    latestSubmission,
    onPress,
}: {
    homework: MemberHomeworkSummaryResponse;
    latestSubmission?: MemberHomeworkSubmissionResponse;
    onPress: () => void;
}) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const submissionStatus = latestSubmission?.status ?? homework.currentSubmissionStatus;
    const reviewStatus = latestSubmission?.review?.status ?? homework.currentReviewStatus;
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
    const iconTone = getHomeworkIconTone(colors, reviewStatus, submissionStatus, homework.homeworkStatus);
    const subtitle = homework.dueAt
        ? t("lessons.dueDate", {
              date: formatDateForDisplay(homework.dueAt),
          })
        : (homework.description?.trim() ?? undefined);

    return (
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={`${getHomeworkTitle(homework)}, ${statusLabel}`}
            haptic="selection"
            className="min-h-16 flex-row items-center gap-3 rounded-lg px-4 py-3.5 active:bg-surface"
            onPress={onPress}
        >
            <View
                className={cn("h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconTone.containerClassName)}
            >
                <ClipboardCheck size={18} color={iconTone.iconColor} strokeWidth={2} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }} className="gap-1">
                <AppText variant="label" numberOfLines={2}>
                    {getHomeworkTitle(homework)}
                </AppText>
                {subtitle ? (
                    <AppText variant="caption" color="mutedForeground" numberOfLines={2} tabular>
                        {subtitle}
                    </AppText>
                ) : null}
            </View>

            <View className="shrink-0">
                <Badge label={statusLabel} size="sm" className={statusTone.className} color={statusTone.color} />
            </View>
            <View className="shrink-0">
                <ChevronRight size={16} color={colors.mutedForeground} strokeWidth={2.2} />
            </View>
        </AnimatedPressable>
    );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
    return (
        <View className="flex-row items-baseline justify-between gap-4">
            <AppText variant="subtitle" wrap={false} textStyle={{ fontWeight: "700" }}>
                {title}
            </AppText>
            {count > 0 ? (
                <AppText
                    variant="caption"
                    color="mutedForeground"
                    wrap={false}
                    tabular
                    textStyle={{ fontWeight: "600" }}
                >
                    {String(count)}
                </AppText>
            ) : null}
        </View>
    );
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

function getHomeworkIconTone(
    colors: ReturnType<typeof useThemeColors>,
    reviewStatus?: string | null,
    submissionStatus?: string | null,
    homeworkStatus?: string | null,
) {
    if (reviewStatus === "CONFIRMED" || submissionStatus === "REVIEWED" || homeworkStatus === "COMPLETED") {
        return {
            containerClassName: "bg-success/10",
            iconColor: colors.success,
        };
    }

    if (
        reviewStatus === "REJECTED" ||
        homeworkStatus === "OVERDUE" ||
        homeworkStatus === "REJECTED" ||
        homeworkStatus === "MISSING"
    ) {
        return {
            containerClassName: "bg-danger/10",
            iconColor: colors.danger,
        };
    }

    if (submissionStatus === "SUBMITTED" || homeworkStatus === "SUBMITTED") {
        return {
            containerClassName: "bg-primary/10",
            iconColor: colors.primary,
        };
    }

    return {
        containerClassName: "bg-warning/10",
        iconColor: colors.warning,
    };
}

function LessonDetailSkeleton() {
    return (
        <>
            <View className="gap-3">
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-7 w-4/5 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-1.5 w-full rounded-full" />
            </View>

            <View className="gap-3">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-48 w-full rounded-2xl" />
            </View>

            <View className="gap-3">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-32 w-full rounded-2xl" />
            </View>
        </>
    );
}
