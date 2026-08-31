import {
    ActivityHeatmap,
    ActivityStatusLegend,
    AppText,
    CircleLoader,
    ErrorState,
    Screen,
    Skeleton,
    WeeklySummary,
    useThemeColors,
} from "@/design-system";
import { ActivityShareCard } from "@/components/golf/ActivityShareCard";
import { useMemberActivity } from "@/lib/hook/useMemberActivity";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import type { MemberActivityStatusCounts } from "@/types/member-activity";
import { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Modal, Pressable, RefreshControl, ScrollView, Switch, View } from "react-native";
import { captureRef } from "react-native-view-shot";

type ActivityFilter = number | "all";

export function ActivityOverview() {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const currentYear = new Date().getFullYear();
    const firstActivityYear = 2025;
    const [selectedYear, setSelectedYear] = useState<ActivityFilter>(currentYear);
    const [showShareCard, setShowShareCard] = useState(false);
    const [showDayNumbers, setShowDayNumbers] = useState(true);
    const [isSavingShareCard, setIsSavingShareCard] = useState(false);
    const shareCardRef = useRef<View>(null);
    const { data: memberProfile } = useGetMemberProfile();
    const activityQuery = useMemberActivity(selectedYear);
    const allActivityQuery = useMemberActivity("all", Boolean(activityQuery.data));
    const { data: activity, isLoading, isError, refetch, isRefetching } = activityQuery;
    const { data: allActivity, refetch: refetchAll, isRefetching: isRefetchingAll } = allActivityQuery;

    const availableYears = useMemo(() => {
        if (!allActivity) {
            return Array.from(
                { length: Math.max(1, currentYear - firstActivityYear + 1) },
                (_, index) => currentYear - index,
            );
        }

        return Array.from(new Set(allActivity.daily.map((entry) => getActivityDate(entry.date)?.getFullYear())))
            .filter((year): year is number => year !== undefined)
            .sort((a, b) => b - a);
    }, [allActivity, currentYear, firstActivityYear]);

    useEffect(() => {
        if (allActivity && selectedYear !== "all" && !availableYears.includes(selectedYear)) {
            setSelectedYear("all");
        }
    }, [allActivity, availableYears, selectedYear]);


    const activityValues = useMemo(() => (activity?.daily ?? []).map((day) => ({
        date: day.date,
        count: day.count,
        status: getDisplayStatus(day.statusCounts),
        statusBreakdown: toStatusBreakdown(day.statusCounts),
        typeCounts: day.typeCounts,
    })), [activity?.daily]);
    const weeklySessionValues = useMemo(() => (activity?.weekly ?? []).map((week) => ({
        weekStart: week.weekStart,
        total: week.count,
        status: getDisplayStatus(week.statusCounts),
        statusBreakdown: toStatusBreakdown(week.statusCounts),
        typeCounts: week.typeCounts,
    })), [activity?.weekly]);

    if (isLoading) {
        return <CircleLoader fullScreen />;
    }

    if (isError && !activity) {
        return (
            <ErrorState
                title="Couldn't load activity"
                message={t("common.pullToRefreshAndTryAgain")}
                actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                onAction={() => {
                    void refetch();
                }}
            />
        );
    }

    if (!activity) {
        return <CircleLoader fullScreen />;
    }

    const firstDate = getActivityDate(activity.daily[0]?.date) ?? getActivityDate(activity.weekly[0]?.weekStart) ?? new Date();
    const lastDate = getActivityDate(activity.daily.at(-1)?.date) ?? getActivityDate(activity.weekly.at(-1)?.weekEnd) ?? firstDate;
    const activityYear = activity.year ?? firstDate.getFullYear();
    const isAllActivity = selectedYear === "all";
    const totalReservations = activity.totalReservations;
    const totalHours = activity.totalReservationHours;
    const activeDays = activity.totalReservationDays;
    const daysInYear = isAllActivity ? daysBetween(firstDate, lastDate) : isLeapYear(activityYear) ? 366 : 365;
    const heatmapEndDate = isAllActivity ? lastDate : new Date(activityYear, 11, 31);
    const weeklyEndDate = isAllActivity ? lastDate : activityYear === currentYear ? new Date() : heatmapEndDate;
    const activityLabel = isAllActivity ? t("activity.allTime") : String(activityYear);
    const shareFirstDate = getActivityDate(activity.daily[0]?.date) ?? firstDate;
    const shareLastDate = getActivityDate(activity.daily.at(-1)?.date) ?? lastDate;

    const handleSaveShareCard = async () => {
        if (isSavingShareCard || !shareCardRef.current) return;

        setIsSavingShareCard(true);
        try {
            // Saving a generated card only needs add/write access. Requesting full
            // library access can be denied even though the platform permits saves.
            const permission = await MediaLibrary.requestPermissionsAsync(true);
            if (!permission.granted) {
                const actions = permission.canAskAgain
                    ? [{ text: "OK" }]
                    : [
                          { text: "Cancel", style: "cancel" as const },
                          { text: t("activity.openSettings"), onPress: () => void Linking.openSettings() },
                      ];

                Alert.alert(
                    t("activity.permissionTitle"),
                    t("activity.permissionMessage"),
                    actions,
                );
                return;
            }

            const uri = await captureRef(shareCardRef.current, {
                format: "png",
                quality: 1,
            });
            await MediaLibrary.Asset.create(uri);
            Alert.alert(t("activity.savedTitle"), t("activity.savedMessage"));
        } catch (error) {
            if (__DEV__) {
                console.error("Failed to save activity card", error);
            }
            Alert.alert(t("activity.couldNotSaveTitle"), t("activity.couldNotSaveMessage"));
        } finally {
            setIsSavingShareCard(false);
        }
    };


    return (
        <>
            <Stack.Screen
                options={{
                    headerRight: () => (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t("activity.preview")}
                            hitSlop={10}
                            onPress={() => setShowShareCard(true)}
                        >
                            <Ionicons name="camera-outline" size={22} color={colors.mutedForeground} />
                        </Pressable>
                    ),
                }}
            />
            <Screen
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching || isRefetchingAll}
                    onRefresh={() => {
                        void Promise.all([refetch(), refetchAll()]);
                    }}
                />
            }
        >
            <View className="gap-7">
                <View className="gap-2">
                    <View className="flex-row gap-2">
                        {availableYears.map((year) => (
                            <Pressable
                                key={year}
                                accessibilityRole="button"
                                accessibilityState={{ selected: selectedYear === year }}
                                accessibilityLabel={`Show activity for ${year}`}
                                className={`rounded-full px-4 py-2 ${selectedYear === year ? "bg-primary" : "bg-muted"}`}
                                onPress={() => setSelectedYear(year)}
                            >
                                <AppText
                                    variant="caption"
                                    className={selectedYear === year ? "font-semibold text-primary-foreground" : "font-semibold text-muted-foreground"}
                                >
                                    {year}
                                </AppText>
                            </Pressable>
                        ))}
                        <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ selected: selectedYear === "all" }}
                            accessibilityLabel="Show all activity"
                            className={`rounded-full px-4 py-2 ${selectedYear === "all" ? "bg-primary" : "bg-muted"}`}
                            onPress={() => setSelectedYear("all")}
                        >
                            <AppText
                                variant="caption"
                                className={selectedYear === "all" ? "font-semibold text-primary-foreground" : "font-semibold text-muted-foreground"}
                            >
                                {t("activity.all")}
                            </AppText>
                        </Pressable>
                    </View>
                </View>

                <View className="gap-1">
                    <AppText variant="h3" className="text-lg leading-6">
                        {t("activity.description")}
                    </AppText>
                </View>

                <View className="flex-row gap-3">
                    <ActivityStat value={String(activeDays)} label={t("activity.reservationDays")} />
                    <ActivityStat value={`${totalHours.toFixed(1)}h`} label={t("activity.reservationHours")} divided />
                    <ActivityStat value={String(totalReservations)} label={t("activity.totalReservations")} divided />
                </View>

                <View className="gap-4">
                    <AppText variant="h3">{t("activity.golfActivity")}</AppText>
                    <ActivityHeatmap
                        values={activityValues}
                        endDate={heatmapEndDate}
                        numDays={daysInYear}
                        yearLabel={activityLabel}
                        overallCount={totalReservations}
                        overallUnitLabel="reservations"
                    />
                </View>

                <View className="gap-4">
                    <AppText variant="h3">{t("activity.weeklyReservations")}</AppText>
                    <View className="flex-row items-center justify-between gap-2">
                        <AppText variant="caption" className="font-semibold text-muted-foreground">
                            {activityLabel}
                        </AppText>
                        <ActivityStatusLegend includeMixed={false} />
                    </View>
                    <WeeklySummary
                        unitLabel="reservations"
                        startDate={isAllActivity ? firstDate : new Date(activityYear, 0, 1)}
                        endDate={weeklyEndDate}
                        initialScrollToEnd={activityYear === currentYear}
                        overallCount={totalReservations}
                        values={weeklySessionValues}
                    />
                </View>
            </View>
            </Screen>
            {showShareCard ? <Modal
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setShowShareCard(false)}
            >
                <Screen
                    scroll
                    headerShown={false}
                    contentClassName="gap-5"
                    footer={
                        <View className="border-t border-border bg-background px-5 pb-3 pt-3">
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={t("activity.save")}
                                accessibilityState={{ busy: isSavingShareCard, disabled: isSavingShareCard }}
                                disabled={isSavingShareCard}
                                className="h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary active:opacity-80 disabled:opacity-60"
                                onPress={() => void handleSaveShareCard()}
                            >
                                <Ionicons name="download-outline" size={20} color={colors.primaryForeground} />
                                <AppText variant="body" className="font-semibold text-primary-foreground">{isSavingShareCard ? t("activity.saving") : t("activity.save")}</AppText>
                            </Pressable>
                        </View>
                    }
                >
                    <View className="mb-4 w-full flex-row items-center justify-between">
                            <AppText variant="h3">{t("activity.preview")}</AppText>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Close screenshot preview"
                                hitSlop={10}
                                onPress={() => setShowShareCard(false)}
                            >
                                <Ionicons name="close" size={24} color={colors.mutedForeground} />
                            </Pressable>
                        </View>
                        <View className="w-full flex-1 items-center justify-center">
                            <ActivityShareCard
                                ref={shareCardRef}
                                label={activityLabel}
                                totalReservations={totalReservations}
                                totalDays={activeDays}
                                totalHours={totalHours}
                                dailyValues={activityValues}
                                heatmapStartDate={shareFirstDate}
                                heatmapEndDate={shareLastDate}
                                numDays={daysBetween(shareFirstDate, shareLastDate)}
                                showDayNumbers={showDayNumbers}
                                memberName={memberProfile?.data?.name}
                                memberImage={memberProfile?.data?.profileImage}
                            />
                        </View>
                        <View className="gap-3">
                            <View className="flex-row flex-wrap gap-2">
                                {availableYears.map((year) => (
                                    <Pressable key={year} accessibilityRole="button" accessibilityState={{ selected: selectedYear === year }} className={`rounded-full px-3 py-2 ${selectedYear === year ? "bg-primary" : "bg-muted"}`} onPress={() => setSelectedYear(year)}>
                                        <AppText variant="caption" className={selectedYear === year ? "font-semibold text-primary-foreground" : "font-semibold text-muted-foreground"}>{year}</AppText>
                                    </Pressable>
                                ))}
                                <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedYear === "all" }} className={`rounded-full px-3 py-2 ${selectedYear === "all" ? "bg-primary" : "bg-muted"}`} onPress={() => setSelectedYear("all")}>
                                    <AppText variant="caption" className={selectedYear === "all" ? "font-semibold text-primary-foreground" : "font-semibold text-muted-foreground"}>{t("activity.all")}</AppText>
                                </Pressable>
                            </View>
                            <View className="flex-row items-center justify-between">
                                <AppText variant="label">
                                    {t("activity.showDayNumbers", { defaultValue: "Show day numbers" })}
                                </AppText>
                                <Switch
                                    accessibilityLabel={t("activity.showDayNumbers", { defaultValue: "Show day numbers" })}
                                    value={showDayNumbers}
                                    onValueChange={setShowDayNumbers}
                                    trackColor={{ false: colors.muted, true: colors.primary }}
                                    thumbColor={colors.card}
                                />
                            </View>
                        </View>
                </Screen>
            </Modal> : null}
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
    const activeStatuses = Object.values(statusCounts).filter((count) => count > 0);

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
    return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1);
}

function ActivityLoadingState() {
    return (
        <Screen>
            <View className="gap-7">
                <View className="flex-row gap-2">
                    {Array.from({ length: 3 }, (_, index) => (
                        <Skeleton key={index} className="h-9 w-20 rounded-full" />
                    ))}
                </View>

                <Skeleton className="h-6 w-72" />

                <View className="flex-row gap-3">
                    <ActivityStatSkeleton />
                    <ActivityStatSkeleton divided />
                    <ActivityStatSkeleton divided />
                </View>

                <View className="gap-4">
                    <Skeleton className="h-6 w-28" />
                    <HeatmapSkeleton />
                </View>

                <View className="gap-4">
                    <Skeleton className="h-6 w-36" />
                    <View className="flex-row items-center justify-between gap-2">
                        <View className="h-3 w-10 rounded bg-muted" />
                        <View className="flex-row items-center gap-1">
                            {Array.from({ length: 3 }, (_, index) => (
                                <View key={index} className="flex-row items-center gap-1">
                                    <View className="h-2.5 w-2.5 rounded-[3px] bg-muted" />
                                    <View className="h-3 w-8 rounded bg-muted" />
                                </View>
                            ))}
                        </View>
                    </View>
                    <WeeklySummarySkeleton />
                </View>
            </View>
        </Screen>
    );
}

function ActivityInitialLoadingState() {
    return (
        <Screen>
            <View className="gap-6">
                <View className="h-6 w-32 rounded bg-muted" />
                <View className="h-6 w-64 rounded bg-muted" />
                <View className="h-24 w-full rounded-2xl bg-muted" />
                <View className="h-40 w-full rounded-2xl bg-muted" />
            </View>
        </Screen>
    );
}

function ActivityStatSkeleton({ divided = false }: { divided?: boolean }) {
    return (
        <View className={`min-w-0 flex-1 gap-2 px-1 py-2 ${divided ? "border-l border-border pl-3" : ""}`}>
            <Skeleton className="h-8 w-14" />
            <Skeleton className="h-3 w-16" />
        </View>
    );
}

function HeatmapSkeleton() {
    return (
        <View className="gap-3">
            <View className="flex-row items-center justify-between gap-2">
                <View className="h-3 w-10 rounded bg-muted" />
                <View className="flex-row items-center gap-1">
                    {Array.from({ length: 4 }, (_, index) => (
                        <View key={index} className="flex-row items-center gap-1">
                            <View className="h-2.5 w-2.5 rounded-[3px] bg-muted" />
                            <View className="h-3 w-9 rounded bg-muted" />
                        </View>
                    ))}
                </View>
            </View>
            <View className="flex-row gap-1">
                <View className="w-5" style={{ marginTop: 16 }}>
                    {Array.from({ length: 4 }, (_, index) => (
                        <View key={index} className="h-3 w-3 rounded bg-muted" style={{ marginBottom: 22 }} />
                    ))}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="gap-1 pr-6">
                        <View className="h-3 flex-row gap-8">
                            {Array.from({ length: 12 }, (_, index) => (
                                <View key={index} className="h-3 w-8 rounded bg-muted" />
                            ))}
                        </View>
                        <View className="flex-row gap-1">
                            {Array.from({ length: 53 }, (_, weekIndex) => (
                                <View key={weekIndex} className="gap-1">
                                    {Array.from({ length: 7 }, (_, dayIndex) => (
                                        <View key={dayIndex} className="h-3 w-3 rounded-[3px] bg-muted" />
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </View>
            <View className="self-center h-1 w-16 rounded-full bg-muted">
                <View className="h-1 w-5 rounded-full bg-primary/30" />
            </View>
            <View className="h-3 w-full rounded bg-muted" />
        </View>
    );
}

function WeeklySummarySkeleton() {
    const barHeights = [28, 44, 34, 58, 40, 68, 30, 50, 38, 62, 46, 72, 32, 54, 42, 64, 36, 48, 56, 30, 60, 44, 52, 38];

    return (
        <View className="gap-3">
            <View className="flex-row gap-2">
                <View className="w-5 items-end justify-between" style={{ height: 104 }}>
                    <View className="h-3 w-4 rounded bg-muted" />
                    <View className="h-3 w-4 rounded bg-muted" />
                    <View className="h-3 w-4 rounded bg-muted" />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row items-end gap-2 pr-6" style={{ height: 104 }}>
                        {Array.from({ length: 52 }, (_, index) => {
                            const height = barHeights[index % barHeights.length];
                            return (
                                <View key={index} className="items-center gap-2">
                                    <View style={{ height }} className="w-5 rounded-md bg-muted" />
                                    <View className="h-3 w-8 rounded bg-muted" />
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
            <View className="self-center h-1 w-16 rounded-full bg-muted">
                <View className="h-1 w-5 rounded-full bg-primary/30" />
            </View>
            <View className="h-3 w-44 rounded bg-muted" />
        </View>
    );
}

function ActivityStat({ value, label, divided }: { value: string; label: string; divided?: boolean }) {
    return (
        <View className={`min-w-0 flex-1 gap-1 px-1 py-2 ${divided ? "border-l border-border pl-3" : ""}`}>
            <AppText variant="h2" className="text-primary">{value}</AppText>
            <AppText variant="caption" numberOfLines={1}>{label}</AppText>
        </View>
    );
}
