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
    getMemberLessonByGroupQueryOptions,
    getMemberHomeworkByIdQueryOptions,
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
import { formatDateForDisplay } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookOpen, ClipboardCheck } from "lucide-react-native";
import type { ReactNode } from "react";
import { RefreshControl, View } from "react-native";

type GroupParams = {
    groupId: string;
};

export default function GroupDetailScreen() {
    const { groupId } = useLocalSearchParams<GroupParams>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberGroupById(Number(groupId));
    const {
        data: homeworkResponse,
        refetch: refetchHomeworks,
    } = useMemberHomeworks();

    const group = data?.data?.group;
    const lessons = data?.data?.lessons ?? [];
    const groupHomeworks =
        data?.data?.homeworks ??
        (homeworkResponse?.data ?? []).filter(
            (homework) => homework.lessonProgramGroupId === Number(groupId),
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
                    title="Failed to load group"
                    message="Pull to refresh and try again."
                    actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
                    onAction={() => {
                        void refetch();
                    }}
                />
            </Screen>
        );
    }

    if (!group) {
        return (
            <Screen contentClassName="grow" refreshControl={refreshControl}>
                <EmptyState
                    title="Group not available"
                    message="The requested lesson group could not be found."
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
                            {getGroupName(group)}
                        </AppText>
                        <AppText
                            variant="meta"
                            className="leading-5 text-muted-foreground"
                            numberOfLines={2}
                        >
                            {getGroupMeta(group)}
                        </AppText>
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                        {group.groupStatus ? (
                            <Badge
                                label={formatType(group.groupStatus)}
                                className="bg-primary/10"
                                textClassName="text-primary"
                            />
                        ) : null}
                        <Badge
                            label={`${lessons.length} lessons`}
                            className="bg-muted"
                            textClassName="text-muted-foreground"
                        />
                        <Badge
                            label={`${groupHomeworks.length} homework`}
                            className="bg-muted"
                            textClassName="text-muted-foreground"
                        />
                    </View>
                </View>
            </Card>

            <SectionHeader title="Lessons" count={lessons.length} />
            {lessons.length === 0 ? (
                <EmptyState
                    title="No lessons"
                    message="Lessons for this group will appear here."
                />
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

            <SectionHeader title="Homework" count={groupHomeworks.length} />
            {groupHomeworks.length === 0 ? (
                <EmptyState
                    title="No homework"
                    message="Homework for this group will appear here."
                />
            ) : (
                <View className="gap-3">
                    {groupHomeworks.map((homework) => (
                        <HomeworkRow
                            key={`homework-${homework.homeworkId}`}
                            homework={homework}
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

function getGroupMeta(group: {
    lessonProgramName?: string | null;
    programStartDate?: string | null;
    programEndDate?: string | null;
    enrollmentStatus?: string | null;
}) {
    const startDate = formatDateForDisplay(group.programStartDate ?? null);
    const endDate = formatDateForDisplay(group.programEndDate ?? null);
    const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : startDate;

    return [group.lessonProgramName?.trim(), dateRange || null, formatType(group.enrollmentStatus)]
        .filter(Boolean)
        .join(" / ") || "-";
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
    return (
        <ListRow
            title={getLessonName(lesson)}
            subtitle={formatDateForDisplay(lesson.startTime ?? null) || undefined}
            meta={lesson.orderIndex != null ? `#${lesson.orderIndex}` : undefined}
            leading={<RowIcon tone="primary"><BookOpen size={18} color="#2563EB" /></RowIcon>}
            className="border-border bg-card px-4 py-3.5"
            titleClassName="font-medium leading-6"
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
    return (
        <ListRow
            title={getHomeworkTitle(homework)}
            subtitle={homework.dueAt ? `Due ${formatDateForDisplay(homework.dueAt)}` : homework.description ?? undefined}
            meta={homework.homeworkStatus ? formatType(homework.homeworkStatus) : undefined}
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

function GroupDetailSkeleton() {
    return (
        <>
            <View className="gap-3 rounded-2xl border border-border bg-card p-4">
                <Skeleton className="h-7 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-2/3 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
            </View>

            {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
        </>
    );
}
