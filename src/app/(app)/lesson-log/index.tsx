import {
    AppText,
    EmptyState,
    ErrorState,
    ListRow,
    Screen,
    Skeleton,
} from "@/design-system";
import { useMemberLessonLogs } from "@/lib/hook/useLessonLog";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { MemberLessonLogResponse } from "@/types/member-lesson-log";
import { formatDateForDisplay } from "@/utils/time-helper";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, RefreshControl, View } from "react-native";

function LessonLogScreen() {
    const router = useRouter();
    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberLessonLogs();

    const lessonLogs = data?.data ?? [];
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const refreshControl = (
        <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
                void refetch();
            }}
        />
    );

    return (
        <Screen scroll={false} horizontalPadding={false} contentClassName="grow">
            {isLoading ? (
                <LessonLogListSkeleton />
            ) : isError ? (
                <LessonLogStateList
                    refreshControl={refreshControl}
                    emptyComponent={
                        <ErrorState
                            title="Failed to load lesson posts"
                            message="Pull to refresh and try again."
                            actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
                            onAction={() => {
                                void refetch();
                            }}
                        />
                    }
                />
            ) : lessonLogs.length === 0 ? (
                <LessonLogStateList
                    refreshControl={refreshControl}
                    emptyComponent={
                        <EmptyState
                            title="No lesson posts yet"
                            message="Your lesson posts will appear here after each lesson."
                            actionLabel="Refresh"
                            onAction={() => {
                                void refetch();
                            }}
                        />
                    }
                />
            ) : (
                <FlatList
                    data={lessonLogs}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                        <LessonLogRow
                            item={item}
                            disabled={isLocked}
                            onPress={() => {
                                runWithNavigationLock(() => {
                                    router.push({
                                        pathname: "/lesson-log/[id]",
                                        params: {
                                            id: String(item.id),
                                        },
                                    });
                                });
                            }}
                        />
                    )}
                    refreshControl={refreshControl}
                    contentContainerStyle={{
                        gap: 12,
                        paddingHorizontal: 24,
                    }}
                    contentInsetAdjustmentBehavior="automatic"
                    showsVerticalScrollIndicator={false}
                />
            )}
        </Screen>
    );
}

export default LessonLogScreen;

function LessonLogRow({
    item,
    disabled,
    onPress,
}: {
    item: MemberLessonLogResponse;
    disabled: boolean;
    onPress: () => void;
}) {
    const reservationName = item.reservation?.name?.trim();
    const reviewLabel =
        item.status === "APPROVED" ? "Comment submitted" : "Leave a review";

    return (
        <ListRow
            title={`${formatDateForDisplay(item.lessonDate)} / ${item.coachName ?? "Coach"}`}
            subtitle={reservationName || reviewLabel}
            meta={reservationName ? reviewLabel : undefined}
            disabled={disabled}
            onPress={onPress}
        />
    );
}

function LessonLogStateList({
    emptyComponent,
    refreshControl,
}: {
    emptyComponent: React.ReactElement;
    refreshControl: React.ReactElement<React.ComponentProps<typeof RefreshControl>>;
}) {
    return (
        <FlatList
            data={[]}
            renderItem={null}
            refreshControl={refreshControl}
            contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                paddingHorizontal: 24,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={emptyComponent}
        />
    );
}

function LessonLogListSkeleton() {
    return (
        <View className="gap-3 px-6">
            {Array.from({ length: 5 }, (_, index) => (
                <View
                    key={index}
                    className="min-h-16 flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-4"
                >
                    <View className="flex-1 gap-2">
                        <Skeleton className="h-5 w-4/5 rounded-full" />
                        <Skeleton className="h-4 w-2/5 rounded-full" />
                        <Skeleton className="h-4 w-1/3 rounded-full" />
                    </View>

                    <Skeleton className="h-5 w-5 rounded-full" />
                </View>
            ))}
        </View>
    );
}
