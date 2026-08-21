import {
    AppText,
    Badge,
    Card,
    EmptyState,
    ErrorState,
    getPressedScaleStyle,
    Skeleton,
    useThemeColors,
} from "@/design-system";
import {
    getMemberGroupByIdQueryOptions,
    useMemberGroups,
} from "@/lib/hook/useMemberLessonFlow";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import type { MemberGroupSummaryResponse } from "@/types/member-group";
import { formatType } from "@/utils/format-enum";
import { formatDateForDisplay, formatTimeRange } from "@/utils/time-helper";
import { getGroupName } from "@/utils/member-lesson";
import { useQueryClient } from "@tanstack/react-query";
import { Href, useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, View } from "react-native";

export function MemberGroups({
    refreshing = false,
    onRefresh,
}: {
    refreshing?: boolean;
    onRefresh?: () => void;
}) {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const { data, isLoading, isError, refetch, isRefetching } = useMemberGroups();
    const groups = data?.data ?? [];

    const renderGroup = useCallback(
        ({ item }: { item: MemberGroupSummaryResponse }) => {
            return (
                <GroupCard
                    group={item}
                    disabled={isLocked}
                    onPressIn={() => {
                        void queryClient.prefetchQuery(
                            getMemberGroupByIdQueryOptions(item.groupId),
                        );
                    }}
                    onPress={() => {
                        runWithNavigationLock(() => {
                            router.push(`/groups/${item.groupId}` as Href);
                        });
                    }}
                />
            );
        },
        [isLocked, queryClient, router, runWithNavigationLock],
    );

    return (
        <View className="flex-1 gap-4">
            {isLoading ? (
                <GroupListSkeleton />
            ) : isError ? (
                <ErrorState
                    title={t("groups.loadError")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : groups.length === 0 ? (
                <EmptyState
                    title={t("lessonLog.noPostsTitle")}
                    message={t("groups.joinProgramMessage")}
                    actionLabel={isRefetching || refreshing ? t("common.refreshing") : t("lessonLog.refresh")}
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : (
                <FlatList
                    className="flex-1"
                    data={groups}
                    keyExtractor={(group) => `group-${group.groupId}`}
                    renderItem={renderGroup}
                    ItemSeparatorComponent={() => <View className="h-3" />}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}
        </View>
    );
}

function GroupCard({
    group,
    disabled,
    onPress,
    onPressIn,
}: {
    group: MemberGroupSummaryResponse;
    disabled: boolean;
    onPress: () => void;
    onPressIn: () => void;
}) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const groupName = getGroupName(group);
    const statusLabel = group.groupStatus ? formatType(group.groupStatus) : null;
    const startDate = formatDateForDisplay(group.programStartDate ?? null);
    const endDate = formatDateForDisplay(group.programEndDate ?? null);
    const dateRange =
        startDate && endDate ? `${startDate} - ${endDate}` : startDate || "-";
    const timeRange = formatTimeRange(group.sessionStartTime, group.sessionEndTime);
    const lessonType = formatType(group.lessonType);
    const capacity = group.capacity
        ? t("groups.capacity", { value: group.capacity })
        : t("groups.capacityEmpty");

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("groups.openGroup", { name: groupName })}
            disabled={disabled}
            className="disabled:opacity-60"
            style={({ pressed }) => getPressedScaleStyle(pressed, disabled, 0.992)}
            onPress={onPress}
            onPressIn={onPressIn}
        >
            <Card className="gap-3 border-border bg-card p-4">
                <View className="flex-row items-start gap-3">
                    <View className="min-w-0 flex-1 gap-1">
                        <AppText
                            variant="h3"
                            className="text-lg font-semibold leading-7 text-foreground"
                            numberOfLines={2}
                        >
                            {groupName}
                        </AppText>

                        <AppText
                            variant="meta"
                            className="leading-5 text-muted-foreground"
                            numberOfLines={1}
                        >
                            {group.lessonProgramName?.trim() || lessonType}
                        </AppText>
                    </View>

                    <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <ChevronRight
                            size={18}
                            color={colors.mutedForeground}
                            strokeWidth={2.4}
                        />
                    </View>
                </View>

                <View className="flex-row flex-wrap gap-2">
                    {statusLabel ? (
                        <Badge
                            label={statusLabel}
                            className="bg-primary/10 px-2.5 py-1"
                            textClassName="text-primary"
                        />
                    ) : null}

                    <Badge
                        label={lessonType}
                        className="bg-muted px-2.5 py-1"
                        textClassName="text-muted-foreground"
                    />

                    <Badge
                        label={capacity}
                        className="bg-muted px-2.5 py-1"
                        textClassName="text-muted-foreground"
                    />
                </View>

                <View className="gap-2 rounded-xl bg-surface px-3 py-3">
                    <GroupMetaRow label={t("common.schedule")} value={dateRange} />
                    <GroupMetaRow label={t("common.time")} value={timeRange} />
                </View>
            </Card>
        </Pressable>
    );
}

function GroupMetaRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <View className="flex-row items-center justify-between gap-3">
            <AppText variant="caption" className="shrink-0 leading-5 text-muted-foreground">
                {label}
            </AppText>
            <AppText
                variant="caption"
                className="min-w-0 flex-1 text-right font-medium leading-5 text-foreground"
                numberOfLines={1}
            >
                {value}
            </AppText>
        </View>
    );
}

function GroupListSkeleton() {
    return (
        <View className="gap-3">
            {Array.from({ length: 3 }, (_, index) => (
                <View
                    key={index}
                    className="gap-3 rounded-xl border border-border bg-card p-4"
                >
                    <View className="flex-1 gap-2">
                        <Skeleton className="h-6 w-3/4 rounded-full" />
                        <Skeleton className="h-4 w-1/2 rounded-full" />
                    </View>
                    <View className="flex-row gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </View>
                    <Skeleton className="h-16 w-full rounded-xl" />
                </View>
            ))}
        </View>
    );
}
