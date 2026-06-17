import {
    AppText,
    Card,
    EmptyState,
    ErrorState,
    ListRow,
    Screen,
    Skeleton,
} from "@/design-system";
import { useMemberLessonByGroup } from "@/lib/hook/useMemberLessonFlow";
import { formatFileSize } from "@/utils/file";
import { getSessionTitle } from "@/utils/member-lesson";
import { useLocalSearchParams } from "expo-router";
import { FileText } from "lucide-react-native";
import { Linking, RefreshControl, View } from "react-native";

type SessionParams = {
    groupId: string;
    lessonId: string;
    sessionId: string;
};

export default function SessionDetailScreen() {
    const { groupId, lessonId, sessionId } = useLocalSearchParams<SessionParams>();
    const numericGroupId = Number(groupId);
    const numericLessonId = Number(lessonId);
    const numericSessionId = Number(sessionId);
    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberLessonByGroup(numericGroupId, numericLessonId);

    const session = (data?.data?.sessions ?? []).find(
        (item) => item.id === numericSessionId,
    );
    const resources = session?.resources ?? [];

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
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
            </Screen>
        );
    }

    if (isError) {
        return (
            <Screen contentClassName="grow" refreshControl={refreshControl}>
                <ErrorState
                    title="Failed to load session"
                    message="Pull to refresh and try again."
                    actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
                    onAction={() => {
                        void refetch();
                    }}
                />
            </Screen>
        );
    }

    if (!session) {
        return (
            <Screen contentClassName="grow" refreshControl={refreshControl}>
                <EmptyState
                    title="Session not available"
                    message="The requested session could not be found."
                />
            </Screen>
        );
    }

    return (
        <Screen contentClassName="gap-5" refreshControl={refreshControl}>
            <Card className="overflow-hidden border-border bg-card p-0">
                <View className="gap-3 bg-surface px-4 py-4">
                    <AppText
                        variant="h3"
                        className="text-xl font-semibold leading-7"
                        numberOfLines={2}
                    >
                        {getSessionTitle(session)}
                    </AppText>

                    <View className="flex-row flex-wrap gap-2">
                        {session.sessionOrder != null ? (
                            <BadgeLikeText label={`Session #${session.sessionOrder}`} />
                        ) : null}
                        <BadgeLikeText label={`${resources.length} resources`} />
                    </View>
                </View>

                <View className="px-4 py-4">
                    <AppText variant="body" className="leading-6 text-foreground">
                        {session.description?.trim() || "No session description has been added."}
                    </AppText>
                </View>
            </Card>

            <View className="flex-row items-center justify-between gap-4">
                <AppText variant="h3" className="text-lg font-semibold">
                    Resources
                </AppText>
                <AppText variant="count">{resources.length}</AppText>
            </View>

            {resources.length === 0 ? (
                <EmptyState
                    title="No resources"
                    message="Resources for this session will appear here."
                />
            ) : (
                <View className="gap-3">
                    {resources.map((resource, index) => (
                        <ListRow
                            key={`resource-${resource.id ?? resource.fileId ?? index}`}
                            title={
                                resource.originalFileName?.trim() ||
                                `Resource #${resource.id}`
                            }
                            subtitle={[
                                resource.mediaType,
                                formatFileSize(resource.fileSizeBytes),
                            ]
                                .filter((value) => value && value !== "-")
                                .join(" / ") || undefined}
                            leading={
                                <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
                                    <FileText size={18} color="#6B7280" />
                                </View>
                            }
                            className="border-border bg-card px-4 py-3.5"
                            titleClassName="font-medium leading-6"
                            showChevron={Boolean(resource.url)}
                            onPress={() => {
                                if (resource.url) {
                                    void Linking.openURL(resource.url);
                                }
                            }}
                        />
                    ))}
                </View>
            )}
        </Screen>
    );
}

function BadgeLikeText({ label }: { label: string }) {
    return (
        <View className="self-start rounded-md bg-muted px-2.5 py-1">
            <AppText variant="badge" className="text-muted-foreground">
                {label}
            </AppText>
        </View>
    );
}
