import {
    AppText,
    EmptyState,
    ErrorState,
    Screen,
    Skeleton,
    useThemeColors,
} from "@/design-system";
import { useMemberLessonLogs } from "@/lib/hook/useLessonLog";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { MemberLessonLogResponse } from "@/types/member-lesson-log";
import { formatDateForDisplay } from "@/utils/time-helper";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

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
    const colors = useThemeColors();
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
                            chevronColor={colors.mutedForeground}
                            onPress={() => {
                                runWithNavigationLock(() => {
                                    router.push(`/lesson-log/${String(item.id)}` as any);
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
    chevronColor,
    onPress,
}: {
    item: MemberLessonLogResponse;
    disabled: boolean;
    chevronColor: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open lesson post for ${item.coachName ?? "coach"} on ${formatDateForDisplay(item.lessonDate)}`}
            disabled={disabled}
            className="min-h-16 flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-4 active:opacity-80"
            onPress={onPress}
        >
            <View className="flex-1 gap-1">
                <AppText selectable variant="body" className="text-base">
                    {formatDateForDisplay(item.lessonDate)} / {item.coachName ?? "Coach"}
                </AppText>
                {item.reservation?.name?.trim() ? (
                    <AppText selectable variant="caption">
                        {item.reservation.name}
                    </AppText>
                ) : null}
                <AppText selectable variant="caption">
                    {item.status === "APPROVED" ? "Review closed" : "Review available"}
                </AppText>
            </View>

            <ChevronRight size={20} color={chevronColor} />
        </Pressable>
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
