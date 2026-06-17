import {
    AppText,
    Badge,
    Card,
    EmptyState,
    ErrorState,
    ListRow,
    Screen,
    Skeleton,
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
import { formatDateForDisplay } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { ClipboardCheck, PlayCircle } from "lucide-react-native";
import type { ReactNode } from "react";
import { RefreshControl, View } from "react-native";

type LessonParams = {
    lessonId: string;
};

export default function StandaloneLessonDetailScreen() {
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
                    title="Failed to load lesson"
                    message="Pull to refresh and try again."
                    actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
                    onAction={() => {
                        void refetch();
                    }}
                />
            </Screen>
        );
    }

    if (!detail || !lesson) {
        return (
            <Screen contentClassName="grow" refreshControl={refreshControl}>
                <EmptyState
                    title="Lesson not available"
                    message="The requested lesson could not be found."
                />
            </Screen>
        );
    }

    return (
        <Screen contentClassName="gap-5" refreshControl={refreshControl}>
            <Card className="overflow-hidden border-border bg-card p-0">
                <View className="gap-4 bg-surface px-4 py-4">
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
                                className="bg-primary/10"
                                textClassName="text-primary"
                            />
                        ) : null}
                        <Badge
                            label={`${sessions.length} sessions`}
                            className="bg-muted"
                            textClassName="text-muted-foreground"
                        />
                        <Badge
                            label={`${homeworks.length} homework`}
                            className="bg-muted"
                            textClassName="text-muted-foreground"
                        />
                    </View>
                </View>

                {lesson.description?.trim() ? (
                    <View className="px-4 py-4">
                        <AppText variant="body" className="leading-6 text-foreground">
                            {lesson.description}
                        </AppText>
                    </View>
                ) : null}
            </Card>

            <SectionHeader title="Sessions" count={sessions.length} />
            {sessions.length === 0 ? (
                <EmptyState
                    title="No sessions"
                    message="Sessions for this lesson will appear here."
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
                                    router.push({
                                        pathname:
                                            "/lessons/[lessonId]/sessions/[sessionId]",
                                        params: {
                                            lessonId: String(numericLessonId),
                                            sessionId: String(session.id),
                                        },
                                    } as unknown as Href);
                                });
                            }}
                        />
                    ))}
                </View>
            )}

            <SectionHeader title="Homework" count={homeworks.length} />
            {homeworks.length === 0 ? (
                <EmptyState
                    title="No homework"
                    message="Homework for this lesson will appear here."
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
    return (
        <ListRow
            title={getSessionTitle(session)}
            subtitle={session.description?.trim() || undefined}
            meta={session.sessionOrder != null ? `#${session.sessionOrder}` : undefined}
            leading={<RowIcon tone="primary"><PlayCircle size={18} color="#2563EB" /></RowIcon>}
            className="border-border bg-card px-4 py-3.5"
            titleClassName="font-medium leading-6"
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
    const hasSubmission = submissions.some(
        (submission) => submission.homeworkId === homework.homeworkId,
    );

    return (
        <ListRow
            title={getHomeworkTitle(homework)}
            subtitle={homework.dueAt ? `Due ${formatDateForDisplay(homework.dueAt)}` : homework.description ?? undefined}
            meta={hasSubmission ? "Submitted" : homework.homeworkStatus ? formatType(homework.homeworkStatus) : undefined}
            leading={<RowIcon><ClipboardCheck size={18} color="#6B7280" /></RowIcon>}
            className="border-border bg-card px-4 py-3.5"
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
    tone?: "primary" | "muted";
}) {
    return (
        <View
            className={
                tone === "primary"
                    ? "h-10 w-10 items-center justify-center rounded-xl bg-primary/10"
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
            <AppText variant="count">{count}</AppText>
        </View>
    );
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
