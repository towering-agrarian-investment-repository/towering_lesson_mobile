import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { CompactEmptyState, ErrorState, Screen, Skeleton } from "@/design-system";
import { LessonSessionsView } from "@/components/golf/LessonSessionsView";
import { useMemberLessonByGroup } from "@/lib/hook/useMemberLessonFlow";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { RefreshControl } from "react-native";

type SessionRouteParams = {
    groupId: string;
    lessonId: string;
    sessionId?: string;
};

export default function GroupLessonSessionsScreen() {
    const { groupId, lessonId, sessionId } = useLocalSearchParams<SessionRouteParams>();
    const { t } = useTranslation();
    const numericGroupId = Number(groupId);
    const numericLessonId = Number(lessonId);
    const initialSessionId = sessionId ? Number(sessionId) : null;
    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberLessonByGroup(numericGroupId, numericLessonId);
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => refetch({ cancelRefetch: false }));

    const sessions = data?.data.sessions ?? [];

    if (isLoading) {
        return (
            <Screen contentClassName="gap-6">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
            </Screen>
        );
    }

    if (isError && !data) {
        return (
            <Screen
                contentClassName="gap-5"
                refreshControl={
                    <RefreshControl
                        refreshing={isPullRefreshing}
                        onRefresh={handlePullRefresh}
                    />
                }
            >
                <ErrorState
                    title={t("lessons.failedSessionsTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </Screen>
        );
    }

    if (sessions.length === 0) {
        return (
            <Screen
                contentClassName="grow"
                refreshControl={
                    <RefreshControl
                        refreshing={isPullRefreshing}
                        onRefresh={handlePullRefresh}
                    />
                }
            >
                <CompactEmptyState
                    title={t("lessonSessions.noSessionsTitle")}
                    message={t("lessonSessions.noSessionsMessage")}
                />
            </Screen>
        );
    }

    return (
        <Screen
            contentClassName="gap-5"
            refreshControl={
                <RefreshControl
                    refreshing={isPullRefreshing}
                    onRefresh={handlePullRefresh}
                />
            }
        >
            <LessonSessionsView
                sessions={sessions}
                initialSessionId={initialSessionId}
            />
        </Screen>
    );
}
