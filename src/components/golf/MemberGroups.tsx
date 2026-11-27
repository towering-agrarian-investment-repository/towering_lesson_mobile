import {
    AnimatedPressable,
    AppText,
    Badge,
    EmptyState,
    ErrorState,
    Skeleton,
    triggerSelectionHaptic,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { getMemberGroupByIdQueryOptions, useMemberGroups } from "@/lib/hook/useMemberLessonFlow";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import type { MemberGroupSummaryResponse } from "@/types/member-group";
import { formatType } from "@/utils/format-enum";
import { getGroupName } from "@/utils/member-lesson";
import { fmtTime, formatDateForDisplay, formatTimeRange } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import { Href, useRouter } from "expo-router";
import Calendar from "lucide-react-native/icons/calendar";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import Clock from "lucide-react-native/icons/clock";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";

const groupKeyExtractor = (group: MemberGroupSummaryResponse) => `group-${group.groupId}`;
const GROUP_LIST_CONTENT_STYLE = { gap: 12, paddingBottom: 24 } as const;

export function getGroupStatusTone(status?: string | null) {
    const normalized = status?.toUpperCase();
    if (normalized === "COMPLETED" || normalized === "FINISHED") {
        return { className: "bg-success/10", color: "success" as const };
    }
    if (
        normalized === "CANCELLED" ||
        normalized === "CANCELED" ||
        normalized === "INACTIVE" ||
        normalized === "CLOSED"
    ) {
        return { className: "bg-muted", color: "mutedForeground" as const };
    }
    return { className: "bg-primary/10", color: "primary" as const };
}

export function MemberGroups({ refreshing = false, onRefresh }: { refreshing?: boolean; onRefresh?: () => void }) {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const { data, isLoading, isError, refetch, isRefetching } = useMemberGroups();
    const groups = data?.data ?? [];

    const handleGroupPressIn = useCallback(
        (groupId: number) => {
            void queryClient.prefetchQuery(getMemberGroupByIdQueryOptions(groupId));
        },
        [queryClient],
    );

    const handleGroupPress = useCallback(
        (groupId: number) => {
            triggerSelectionHaptic();
            runWithNavigationLock(() => {
                router.push(`/groups/${groupId}` as Href);
            });
        },
        [router, runWithNavigationLock],
    );

    const renderGroup = useCallback(
        ({ item }: { item: MemberGroupSummaryResponse }) => {
            return (
                <GroupCard group={item} disabled={isLocked} onPressIn={handleGroupPressIn} onPress={handleGroupPress} />
            );
        },
        [handleGroupPress, handleGroupPressIn, isLocked],
    );

    return (
        <View className="flex-1 gap-4">
            {isLoading ? (
                <GroupListSkeleton />
            ) : isError && !data ? (
                <ErrorState
                    title={t("groups.loadError")}
                    message={t("home.checkConnection")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching || refreshing}
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : groups.length === 0 ? (
                <EmptyState
                    title={t("groups.empty")}
                    message={t("groups.joinProgramMessage")}
                    actionLabel={isRefetching || refreshing ? t("common.refreshing") : t("lessonLog.refresh")}
                    actionPending={isRefetching || refreshing}
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : (
                <FlatList
                    className="flex-1"
                    data={groups}
                    keyExtractor={groupKeyExtractor}
                    renderItem={renderGroup}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={GROUP_LIST_CONTENT_STYLE}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}
        </View>
    );
}

const GroupCard = memo(function GroupCard({
    group,
    disabled,
    onPress,
    onPressIn,
}: {
    group: MemberGroupSummaryResponse;
    disabled: boolean;
    onPress: (groupId: number) => void;
    onPressIn: (groupId: number) => void;
}) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const groupName = getGroupName(group);
    const statusLabel = group.groupStatus ? formatType(group.groupStatus, t) : null;
    const statusTone = getGroupStatusTone(group.groupStatus);
    const startDate = formatDateForDisplay(group.programStartDate ?? null);
    const endDate = formatDateForDisplay(group.programEndDate ?? null);
    const dateRange = startDate && endDate ? `${startDate} ~ ${endDate}` : startDate || "-";
    const timeRange =
        group.sessionStartTime && group.sessionEndTime
            ? formatTimeRange(group.sessionStartTime, group.sessionEndTime)
            : group.sessionStartTime || group.sessionEndTime
              ? fmtTime(group.sessionStartTime || group.sessionEndTime)
              : null;
    const lessonType = formatType(group.lessonType, t);
    const programName = group.lessonProgramName?.trim();
    const subtitle = programName || undefined;

    return (
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={t("groups.openGroup", { name: groupName })}
            disabled={disabled}
            className="gap-3 rounded-2xl border border-border bg-card p-4 disabled:opacity-60"
            onPress={() => onPress(group.groupId)}
            onPressIn={() => onPressIn(group.groupId)}
        >
            <View className="flex-row items-center justify-between gap-2">
                <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
                    {statusLabel ? (
                        <Badge
                            label={statusLabel}
                            size="sm"
                            className={statusTone.className}
                            color={statusTone.color}
                        />
                    ) : null}

                    {lessonType ? (
                        <AppText variant="caption" color="mutedForeground">
                            {lessonType}
                        </AppText>
                    ) : null}
                </View>

                <ChevronRight size={16} color={colors.mutedForeground} strokeWidth={2.2} />
            </View>

            <View className="gap-1">
                <AppText variant="subtitle" numberOfLines={2} textStyle={{ fontWeight: "700" }}>
                    {groupName}
                </AppText>
                {subtitle ? (
                    <AppText variant="subtext" color="mutedForeground" numberOfLines={2}>
                        {subtitle}
                    </AppText>
                ) : null}
            </View>

            <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-3">
                <View className="flex-row items-center gap-1.5">
                    <Calendar size={15} color={colors.mutedForeground} strokeWidth={2} />
                    <AppText variant="caption" color="mutedForeground" wrap={false} tabular>
                        {dateRange}
                    </AppText>
                </View>

                {timeRange && timeRange !== "—" ? (
                    <View className="flex-row items-center gap-1.5">
                        <Clock size={15} color={colors.mutedForeground} strokeWidth={2} />
                        <AppText variant="caption" color="mutedForeground" wrap={false} tabular>
                            {timeRange}
                        </AppText>
                    </View>
                ) : null}
            </View>
        </AnimatedPressable>
    );
});

function GroupListSkeleton() {
    return (
        <View className="flex-1 gap-3 overflow-hidden">
            {Array.from({ length: 5 }, (_, index) => (
                <View key={index} className="gap-3 rounded-2xl border border-border bg-card p-4">
                    <View className="flex-row items-center justify-between gap-2">
                        <View className="flex-row items-center gap-2">
                            <Skeleton className="h-5 w-14 rounded-md" />
                            <Skeleton className="h-3.5 w-20 rounded-full" />
                        </View>
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </View>

                    <View className="gap-1.5">
                        <Skeleton className="h-4 w-3/4 rounded-full" />
                        <Skeleton className="h-3.5 w-1/2 rounded-full" />
                    </View>

                    <View className="flex-row items-center gap-4 border-t border-border/60 pt-3">
                        <Skeleton className="h-3.5 w-32 rounded-full" />
                        <Skeleton className="h-3.5 w-24 rounded-full" />
                    </View>
                </View>
            ))}
        </View>
    );
}
