import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { DayNumbersToggle } from "@/components/golf/activity/DayNumbersToggle";
import { ActivityShareCard } from "@/components/golf/ActivityShareCard";
import {
    ActivityHeatmap,
    ErrorState,
    Screen,
    Skeleton,
    WeeklySummary,
    useThemeColors,
} from "@/design-system";
import { AdaptivePanels } from "@/design-system/layout/AdaptivePanels";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { useMemberActivity } from "@/lib/hook/useMemberActivity";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import type { MemberActivityStatusCounts } from "@/types/member-activity";
import { Host, Text } from "@expo/ui";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { Stack } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Linking,
    Modal,
    Pressable,
    RefreshControl,
    View,
} from "react-native";
import { captureRef } from "react-native-view-shot";

type ActivityFilter = number | "all";

export function ActivityOverview() {
    const {
        colors: uiColors,
        fontScale: uiFontScale,
    } = useTheme();
    const { t } = useTranslation();
    const colors = useThemeColors();
    const currentYear = new Date().getFullYear();
    const firstActivityYear = 2025;
    const [requestedYear, setSelectedYear] =
        useState<ActivityFilter>(currentYear);
    const [showShareCard, setShowShareCard] = useState(false);
    const [showDayNumbers, setShowDayNumbers] = useState(true);
    const [isSavingShareCard, setIsSavingShareCard] = useState(false);
    const shareCardRef = useRef<React.ElementRef<typeof View>>(null);
    const { data: memberProfile } = useGetMemberProfile();
    const requestedActivityQuery = useMemberActivity(requestedYear);
    const allActivityQuery = useMemberActivity(
        "all",
        Boolean(requestedActivityQuery.data),
    );
    const {
        data: allActivity,
        refetch: refetchAll,
        isRefetching: isRefetchingAll,
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

    if (isLoading) {
        return <ActivityLoadingState />;
    }

    if (isError && !activity) {
        return (
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
        );
    }

    if (!activity) {
        return <ActivityLoadingState />;
    }

    const firstDate =
        getActivityDate(activity.daily[0]?.date) ??
        getActivityDate(activity.weekly[0]?.weekStart) ??
        new Date();
    const lastDate =
        getActivityDate(activity.daily.at(-1)?.date) ??
        getActivityDate(activity.weekly.at(-1)?.weekEnd) ??
        firstDate;
    const activityYear = activity.year ?? firstDate.getFullYear();
    const isAllActivity = selectedYear === "all";
    const totalReservations = activity.totalReservations;
    const totalHours = activity.totalReservationHours;
    const activeDays = activity.totalReservationDays;
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
        getActivityDate(activity.daily[0]?.date) ?? firstDate;
    const shareLastDate =
        getActivityDate(activity.daily.at(-1)?.date) ?? lastDate;

    const handleSaveShareCard = async () => {
        if (isSavingShareCard || !shareCardRef.current) return;

        setIsSavingShareCard(true);
        try {
            // Saving a generated card only needs add/write access. Requesting full
            // library access can be denied even though the platform permits saves.
            const permission = await MediaLibrary.requestPermissionsAsync(true);
            if (!permission.granted) {
                const actions = permission.canAskAgain
                    ? [{ text: t("activity.ok") }]
                    : [
                        {
                            text: t("common.cancel"),
                            style: "cancel" as const,
                        },
                        {
                            text: t("activity.openSettings"),
                            onPress: () => void Linking.openSettings(),
                        },
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
            Alert.alert(
                t("activity.couldNotSaveTitle"),
                t("activity.couldNotSaveMessage"),
            );
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
                            <Ionicons
                                name="camera-outline"
                                size={22}
                                color={colors.mutedForeground}
                            />
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
                                    <Host matchContents ignoreSafeArea="all">
                                        <Text
                                            textStyle={{
                                                ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                                fontWeight: "600" as const,
                                                color:
                                                    selectedYear === year
                                                        ? uiColors.primaryForeground
                                                        : uiColors.mutedForeground,
                                                fontSize:
                                                    typography.subtext
                                                        .fontSize * uiFontScale,
                                            }}
                                        >
                                            {String(year ?? "")}
                                        </Text>
                                    </Host>
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
                                <Host matchContents ignoreSafeArea="all">
                                    <Text
                                        textStyle={{
                                            ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                            fontWeight: "600" as const,
                                            color:
                                                selectedYear === "all"
                                                    ? uiColors.primaryForeground
                                                    : uiColors.mutedForeground,
                                            fontSize:
                                                typography.subtext.fontSize *
                                                uiFontScale,
                                        }}
                                    >
                                        {t("activity.all")}
                                    </Text>
                                </Host>
                            </Pressable>
                        </View>
                    </View>
                    <View className="gap-1">
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                textStyle={{
                                    ...typography.h3,
                                    color: uiColors.foreground,
                                    fontSize: typography.subtitle.fontSize * uiFontScale,
                                    lineHeight: typography.body.lineHeight * uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                {t("activity.description")}
                            </Text>
                        </Host>
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
            {showShareCard ? (
                <Modal
                    animationType="slide"
                    presentationStyle="fullScreen"
                    onRequestClose={() => setShowShareCard(false)}
                >
                    <Screen
                        scroll
                        headerShown={false}
                        contentClassName="gap-5"
                        footer={
                            <View className="pb-3 pt-3">
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={t("activity.save")}
                                    accessibilityState={{
                                        busy: isSavingShareCard,
                                        disabled: isSavingShareCard,
                                    }}
                                    disabled={isSavingShareCard}
                                    className="h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary active:opacity-80 disabled:opacity-60"
                                    onPress={() => void handleSaveShareCard()}
                                >
                                    <Ionicons
                                        name="download-outline"
                                        size={20}
                                        color={colors.primaryForeground}
                                    />
                                    <Host matchContents ignoreSafeArea="all">
                                        <Text
                                            textStyle={{
                                                ...typography.body, lineHeight: typography.body.lineHeight * uiFontScale,
                                                fontWeight: "600" as const,
                                                color: uiColors.primaryForeground,
                                                fontSize:
                                                    typography.body.fontSize *
                                                    uiFontScale,
                                            }}
                                        >
                                            {isSavingShareCard
                                                ? t("activity.saving")
                                                : t("activity.save")}
                                        </Text>
                                    </Host>
                                </Pressable>
                            </View>
                        }
                    >
                        <View className="mb-4 w-full flex-row items-center justify-between">
                            <Host matchContents ignoreSafeArea="all">
                                <Text
                                    textStyle={{
                                        ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale,
                                        color: uiColors.foreground,
                                        fontSize:
                                            typography.h3.fontSize *
                                            uiFontScale,
                                    }}
                                >
                                    {t("activity.preview")}
                                </Text>
                            </Host>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={t("common.closeTitle", {
                                    title: t("activity.preview"),
                                })}
                                hitSlop={10}
                                onPress={() => setShowShareCard(false)}
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={colors.mutedForeground}
                                />
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
                                numDays={daysBetween(
                                    shareFirstDate,
                                    shareLastDate,
                                )}
                                showDayNumbers={showDayNumbers}
                                memberName={memberProfile?.data.name}
                                memberImage={memberProfile?.data.profileImage}
                            />
                        </View>
                        <View className="gap-3">
                            <View className="flex-row flex-wrap gap-2">
                                {availableYears.map((year) => (
                                    <Pressable
                                        key={year}
                                        accessibilityRole="button"
                                        accessibilityState={{
                                            selected: selectedYear === year,
                                        }}
                                        className={`rounded-full px-3 py-2 ${selectedYear === year ? "bg-primary" : "bg-muted"}`}
                                        onPress={() => setSelectedYear(year)}
                                    >
                                        <Host
                                            matchContents
                                            ignoreSafeArea="all"
                                        >
                                            <Text
                                                textStyle={{
                                                    ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                                    fontWeight: "600" as const,
                                                    color:
                                                        selectedYear === year
                                                            ? uiColors.primaryForeground
                                                            : uiColors.mutedForeground,
                                                    fontSize:
                                                        typography.caption
                                                            .fontSize *
                                                        uiFontScale,
                                                }}
                                            >
                                                {String(year ?? "")}
                                            </Text>
                                        </Host>
                                    </Pressable>
                                ))}
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityState={{
                                        selected: selectedYear === "all",
                                    }}
                                    className={`rounded-full px-3 py-2 ${selectedYear === "all" ? "bg-primary" : "bg-muted"}`}
                                    onPress={() => setSelectedYear("all")}
                                >
                                    <Host matchContents ignoreSafeArea="all">
                                        <Text
                                            textStyle={{
                                                ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                                fontWeight: "600" as const,
                                                color:
                                                    selectedYear === "all"
                                                        ? uiColors.primaryForeground
                                                        : uiColors.mutedForeground,
                                                fontSize:
                                                    typography.caption
                                                        .fontSize * uiFontScale,
                                            }}
                                        >
                                            {t("activity.all")}
                                        </Text>
                                    </Host>
                                </Pressable>
                            </View>
                            <View className="flex-row items-center justify-between gap-3">
                                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ flex: 1, minWidth: 0 }}>
                                    <Text textStyle={{ ...typography.label, color: colors.foreground, fontSize: typography.label.fontSize * uiFontScale, lineHeight: typography.label.lineHeight * uiFontScale }} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>{t("activity.showDayNumbers")}</Text>
                                </Host>
                                <DayNumbersToggle label={t("activity.showDayNumbers")} value={showDayNumbers} onValueChange={setShowDayNumbers} />
                            </View>
                        </View>
                    </Screen>
                </Modal>
            ) : null}
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
    const { colors, fontScale } = useTheme();
    return (
        <View className="flex-row items-center justify-between gap-3">
            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ flex: 1, minWidth: 0 }}>
                <Text
                    textStyle={{
                        ...typography.h3,
                        fontSize: typography.h3.fontSize * fontScale,
                        lineHeight: typography.h3.lineHeight * fontScale,
                        color: colors.foreground,
                    }}
                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}
                >
                    {title}
                </Text>
            </Host>
            <Host matchContents ignoreSafeArea="all" style={{ flexShrink: 0 }}>
                <Text
                    textStyle={{
                        ...typography.subtext,
                        fontSize: typography.subtext.fontSize * fontScale,
                        lineHeight: typography.subtext.lineHeight * fontScale,
                        fontWeight: "600",
                        textAlign: "right",
                        color: colors.mutedForeground,
                    }}
                >
                    {period}
                </Text>
            </Host>
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    return (
        <View className="min-w-0 flex-1 gap-1 py-2">
            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                <Text
                    textStyle={{
                        ...typography.h2, lineHeight: typography.h2.lineHeight * uiFontScale,
                        color: uiColors.primary,
                        fontSize: typography.h2.fontSize * uiFontScale,
                    }}
                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                    {value}
                </Text>
            </Host>
            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                <Text
                    textStyle={{
                        ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                        color: uiColors.mutedForeground,
                        fontSize: typography.caption.fontSize * uiFontScale,
                    }}
                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                    {label}
                </Text>
            </Host>
        </View>
    );
}
