import { CompactEmptyState, ErrorState, Screen, Skeleton } from "@/design-system";
import { LessonSessionsView } from "@/components/golf/LessonSessionsView";
import { useMemberLessonById } from "@/lib/hook/useMemberLessonFlow";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { RefreshControl } from "react-native";

type SessionRouteParams = {
    lessonId: string;
    sessionId?: string;
};

export default function LessonSessionsScreen() {
    const { lessonId, sessionId } = useLocalSearchParams<SessionRouteParams>();
    const { t } = useTranslation();
    const numericLessonId = Number(lessonId);
    const initialSessionId = sessionId ? Number(sessionId) : null;
    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberLessonById(numericLessonId);

    const sessions = data?.data?.sessions ?? [];

    if (isLoading) {
        return (
            <Screen contentClassName="gap-6">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
            </Screen>
        );
    }

    if (isError) {
        return (
            <Screen
                contentClassName="gap-5"
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => {
                            void refetch();
                        }}
                    />
                }
            >
                <ErrorState
                    title={t("lessons.failedSessionsTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    onAction={() => {
                        void refetch();
                    }}
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
                        refreshing={isRefetching}
                        onRefresh={() => {
                            void refetch();
                        }}
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
                    refreshing={isRefetching}
                    onRefresh={() => {
                        void refetch();
                    }}
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
