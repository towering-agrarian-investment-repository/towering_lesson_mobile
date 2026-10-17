import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { NativeText } from "@/design-system/components/NativeText";
import { ActivitySharePreview } from "@/components/golf/ActivitySharePreview";
import {
    ActivityHeatmap,
    ErrorState,
    Screen,
    Skeleton,
    WeeklySummary,
} from "@/design-system";
import { AdaptivePanels } from "@/design-system/layout/AdaptivePanels";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { useMemberActivity } from "@/lib/hook/useMemberActivity";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import type { MemberActivityStatusCounts } from "@/types/member-activity";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Pressable,
    RefreshControl,
    View,
} from "react-native";

type ActivityFilter = number | "all";

export function ActivityOverview() {
    const { colors: uiColors } = useTheme();
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();
    const firstActivityYear = 2025;
    const [requestedYear, setSelectedYear] =
        useState<ActivityFilter>(currentYear);
    const { data: memberProfile } = useGetMemberProfile();
    const requestedActivityQuery = useMemberActivity(requestedYear);
    const allActivityQuery = useMemberActivity(
        "all",
        Boolean(requestedActivityQuery.data),
    );
    const {
        data: allActivity,
        refetch: refetchAll,
    } = allActivityQuery;

    const availableYears = useMemo(() => {
        if (!allActivity) {
            return Array.from(
                { length: Math.max(1, currentYear - firstActivityYear + 1) },
                (_, index) => currentYear - index,
            );
        }

        return Array.from(
            new Set(
                allActivity.daily.map((entry) =>
                    getActivityDate(entry.date)?.getFullYear(),
                ),
            ),
        )
            .filter((year): year is number => year !== undefined)
            .sort((a, b) => b - a);
    }, [allActivity, currentYear, firstActivityYear]);

    const selectedYear =
        allActivity &&
            requestedYear !== "all" &&
            !availableYears.includes(requestedYear)
            ? "all"
            : requestedYear;
    const activityQuery =
        selectedYear === "all" ? allActivityQuery : requestedActivityQuery;
    const {
        data: activity,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = activityQuery;
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => Promise.all([refetch({ cancelRefetch: false }), refetchAll({ cancelRefetch: false })]));

    const activityValues = useMemo(
        () =>
            (activity?.daily ?? []).map((day) => ({
                date: day.date,
                count: day.count,
                status: getDisplayStatus(day.statusCounts),
                statusBreakdown: toStatusBreakdown(day.statusCounts),
                typeCounts: day.typeCounts,
            })),
        [activity?.daily],
    );
    const weeklySessionValues = useMemo(
        () =>
            (activity?.weekly ?? []).map((week) => ({
                weekStart: week.weekStart,
                total: week.count,
                status: getDisplayStatus(week.statusCounts),
                statusBreakdown: toStatusBreakdown(week.statusCounts),
                typeCounts: week.typeCounts,
            })),
        [activity?.weekly],
    );

    const firstDate =
        getActivityDate(activity?.daily[0]?.date) ??
        getActivityDate(activity?.weekly[0]?.weekStart) ??
        new Date();
    const lastDate =
        getActivityDate(activity?.daily.at(-1)?.date) ??
        getActivityDate(activity?.weekly.at(-1)?.weekEnd) ??
        firstDate;
    const activityYear = activity?.year ?? firstDate.getFullYear();
    const isAllActivity = selectedYear === "all";
    const totalReservations = activity?.totalReservations ?? 0;
    const totalHours = activity?.totalReservationHours ?? 0;
    const activeDays = activity?.totalReservationDays ?? 0;
    const daysInYear = isAllActivity
        ? daysBetween(firstDate, lastDate)
        : isLeapYear(activityYear)
            ? 366
            : 365;
    const heatmapEndDate = isAllActivity
        ? lastDate
        : new Date(activityYear, 11, 31);
    const weeklyEndDate = isAllActivity
        ? lastDate
        : activityYear === currentYear
            ? new Date()
            : heatmapEndDate;
    const activityLabel = isAllActivity
        ? t("activity.allTime")
        : String(activityYear);
    const shareFirstDate =
        getActivityDate(activity?.daily[0]?.date) ?? firstDate;
    const shareLastDate =
        getActivityDate(activity?.daily.at(-1)?.date) ?? lastDate;

    const preview = (
        <ActivitySharePreview
            isAvailable={Boolean(activity) && !isLoading}
            availableYears={availableYears}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            cardProps={{
                label: activityLabel,
                totalReservations,
                totalDays: activeDays,
                totalHours,
                dailyValues: activityValues,
                heatmapStartDate: shareFirstDate,
                heatmapEndDate: shareLastDate,
                numDays: daysBetween(shareFirstDate, shareLastDate),
                memberName: memberProfile?.data.name,
                memberImage: memberProfile?.data.profileImage,
            }}
        />
    );

    if (isLoading) {
        return (
            <>
                {preview}
                <ActivityLoadingState />
            </>
        );
    }

    if (isError && !activity) {
        return (
            <>
                {preview}
                <ErrorState
                    title={t("activity.couldNotLoad")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={
                        isRefetching
                            ? t("common.refreshing")
                            : t("common.refreshTryAgain")
                    }
                    onAction={() => {
                        void refetch();
                    }}
                />
            </>
        );
    }

    if (!activity) {
        return (
            <>
                {preview}
                <ActivityLoadingState />
            </>
        );
    }

    return (
        <>
            {preview}
            <Screen
                refreshControl={
                    <RefreshControl
                        refreshing={isPullRefreshing}
                        onRefresh={handlePullRefresh}
                    />
                }
            >
                <View className="gap-5">
                    <View className="gap-2">
                        <View className="flex-row flex-wrap gap-2">
                            {availableYears.map((year) => (
                                <Pressable
                                    key={year}
                                    accessibilityRole="button"
                                    accessibilityState={{
                                        selected: selectedYear === year,
                                    }}
                                    accessibilityLabel={t("activity.showYear", {
                                        year,
                                    })}
                                    className={`min-h-12 items-center justify-center rounded-full px-4 py-2 ${selectedYear === year ? "bg-primary" : "bg-muted"}`}
                                    onPress={() => setSelectedYear(year)}
                                >
                                    <NativeText
                                        variant="caption"
                                        wrap={false}
                                        textStyle={{
                                            fontWeight: "600" as const, color:
                                                selectedYear === year
                                                    ? uiColors.primaryForeground
                                                    : uiColors.mutedForeground, fontSize: typography.subtext
                                                        .fontSize
                                        }}
                                    >
                                        {String(year ?? "")}
                                    </NativeText>
                                </Pressable>
                            ))}
                            <Pressable
                                accessibilityRole="button"
                                accessibilityState={{
                                    selected: selectedYear === "all",
                                }}
                                accessibilityLabel={t("activity.showAll")}
                                className={`min-h-12 items-center justify-center rounded-full px-4 py-2 ${selectedYear === "all" ? "bg-primary" : "bg-muted"}`}
                                onPress={() => setSelectedYear("all")}
                            >
                                <NativeText
                                    variant="caption"
                                    wrap={false}
                                    textStyle={{
                                        fontWeight: "600" as const, color:
                                            selectedYear === "all"
                                                ? uiColors.primaryForeground
                                                : uiColors.mutedForeground, fontSize: typography.subtext.fontSize
                                    }}
                                >
                                    {t("activity.all")}
                                </NativeText>
                            </Pressable>
                        </View>
                    </View>
                    <View className="gap-1">
                        <NativeText
                            variant="h3"
                            textStyle={{ fontSize: typography.subtitle.fontSize, lineHeight: typography.body.lineHeight }}
                        >
                            {t("activity.description")}
                        </NativeText>
                    </View>
                    <View className="flex-row gap-3">
                        <ActivityStat
                            value={String(activeDays)}
                            label={t("activity.reservationDays")}
                        />
                        <ActivityStat
                            value={t("activity.hoursValue", {
                                value: totalHours.toFixed(1),
                            })}
                            label={t("activity.reservationHours")}
                        />
                        <ActivityStat
                            value={String(totalReservations)}
                            label={t("activity.totalReservations")}
                        />
                    </View>
                    <AdaptivePanels
                        primary={
                            <View className="gap-4">
                                <ActivityChartHeader
                                    title={t("activity.golfActivity")}
                                    period={activityLabel}
                                />
                                <ActivityHeatmap
                                    values={activityValues}
                                    endDate={heatmapEndDate}
                                    numDays={daysInYear}
                                    overallCount={totalReservations}
                                    overallUnitLabel={t(
                                        "activity.reservations",
                                    )}
                                />
                            </View>
                        }
                        secondary={
                            <View className="gap-4">
                                <ActivityChartHeader
                                    title={t("activity.weeklyReservations")}
                                    period={activityLabel}
                                />
                                <WeeklySummary
                                    unitLabel={t("activity.reservations")}
                                    startDate={
                                        isAllActivity
                                            ? firstDate
                                            : new Date(activityYear, 0, 1)
                                    }
                                    endDate={weeklyEndDate}
                                    initialScrollToEnd={
                                        activityYear === currentYear
                                    }
                                    overallCount={totalReservations}
                                    values={weeklySessionValues}
                                />
                            </View>
                        }
                    />
                </View>
            </Screen>

        </>
    );
}

function toStatusBreakdown(statusCounts: MemberActivityStatusCounts) {
    return {
        reserved: statusCounts.RESERVED,
        completed: statusCounts.COMPLETED + statusCounts.CHECKED_IN,
        cancelled: statusCounts.CANCELLED,
        "no-show": statusCounts.NO_SHOW,
    } as const;
}

function getDisplayStatus(statusCounts: MemberActivityStatusCounts) {
    const activeStatuses = Object.values(statusCounts).filter(
        (count) => count > 0,
    );

    if (activeStatuses.length === 0) return undefined;
    if (activeStatuses.length > 1) return "mixed" as const;
    if (statusCounts.NO_SHOW > 0) return "no-show" as const;
    if (statusCounts.CANCELLED > 0) return "cancelled" as const;
    if (statusCounts.RESERVED > 0) return "reserved" as const;
    return "completed" as const;
}

function isLeapYear(year: number) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getActivityDate(value?: string) {
    if (!value) return undefined;
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day);
}

function daysBetween(start: Date, end: Date) {
    return Math.max(
        1,
        Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1,
    );
}

function ActivityChartHeader({ title, period }: { title: string; period: string }) {

    return (
        <View className="flex-row items-center justify-between gap-3">
            <NativeText variant="h3" style={{ flex: 1, minWidth: 0 }}>
                {title}
            </NativeText>
            <NativeText
                variant="subtext"
                color="mutedForeground"
                align="right"
                wrap={false}
                style={{ flexShrink: 0 }}
                textStyle={{ fontWeight: "600" }}
            >
                {period}
            </NativeText>
        </View>
    );
}

function ActivityLoadingState() {
    return (
        <Screen>
            <View className="gap-5">
                <View className="flex-row gap-2">
                    {Array.from({ length: 3 }, (_, index) => (
                        <Skeleton key={index} className="h-12 w-20 rounded-full" />
                    ))}
                </View>
                <Skeleton className="h-6 w-64" />
                <View className="flex-row gap-3">
                    {Array.from({ length: 3 }, (_, index) => (
                        <View key={index} className="min-w-0 flex-1 gap-2 py-2">
                            <Skeleton className="h-8 w-14" />
                            <Skeleton className="h-4 w-16" />
                        </View>
                    ))}
                </View>
                <AdaptivePanels
                    primary={
                        <View className="gap-4">
                            <View className="flex-row items-center justify-between gap-3">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-12" />
                            </View>
                            <HeatmapSkeleton />
                            <Skeleton className="h-4 w-56 self-center" />
                            <Skeleton className="h-4 w-40" />
                        </View>
                    }
                    secondary={
                        <View className="gap-4">
                            <View className="flex-row items-center justify-between gap-3">
                                <Skeleton className="h-6 w-44" />
                                <Skeleton className="h-4 w-12" />
                            </View>
                            <WeeklySummarySkeleton />
                            <Skeleton className="h-4 w-56 self-center" />
                            <Skeleton className="h-4 w-40" />
                        </View>
                    }
                />
            </View>
        </Screen>
    );
}

function HeatmapSkeleton() {
    return (
        <Skeleton className="rounded-none bg-transparent">
            <View className="mb-2 flex-row gap-12">
                <View className="h-4 w-10 rounded-xl bg-muted" />
                <View className="h-4 w-10 rounded-xl bg-muted" />
                <View className="h-4 w-10 rounded-xl bg-muted" />
            </View>
            <View className="flex-row gap-1">
                {Array.from({ length: 14 }, (_, weekIndex) => (
                    <View key={weekIndex} className="gap-1">
                        {Array.from({ length: 7 }, (_, dayIndex) => (
                            <View key={dayIndex} className="h-6 w-6 rounded-[5px] bg-muted" />
                        ))}
                    </View>
                ))}
            </View>
        </Skeleton>
    );
}

function WeeklySummarySkeleton() {
    const barHeights = [72, 128, 96, 164, 112, 184];
    return (
        <View style={{ height: 216 }}>
            <Skeleton className="h-full w-full flex-row items-end gap-3 rounded-none bg-transparent">
                {barHeights.map((height, index) => (
                    <View key={index} className="min-w-0 flex-1 items-center gap-2">
                        <View className="w-8 rounded-md bg-muted" style={{ height }} />
                        <View className="h-4 w-10 rounded-xl bg-muted" />
                    </View>
                ))}
            </Skeleton>
        </View>
    );
}

function ActivityStat({
    value,
    label,
}: {
    value: string;
    label: string;
}) {

    return (
        <View className="min-w-0 flex-1 gap-1 py-2">
            <NativeText variant="h2" color="primary">
                {value}
            </NativeText>
            <NativeText variant="caption" color="mutedForeground">
                {label}
            </NativeText>
        </View>
    );
}
