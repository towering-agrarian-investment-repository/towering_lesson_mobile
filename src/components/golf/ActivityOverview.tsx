import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { NativeText } from "@/design-system/components/NativeText";
import { ActivitySharePreview } from "@/components/golf/ActivitySharePreview";
import { mapActivityDays } from "@/components/golf/activity-display-data";
import {
    ActivityHeatmap,
    ErrorState,
    Screen,
    SCREEN_HORIZONTAL_PADDING,
    SCREEN_MAX_WIDTH,
    Skeleton,
    getPressedScaleStyle,
    triggerSelectionHaptic,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { useMemberActivity, useMemberActivitySummary } from "@/lib/hook/useMemberActivity";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { useMemberReservationsForDay } from "@/lib/hook/useReservation";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { parseCalendarDate, toDateKey } from "@/design-system/components/charts/activity-chart-data";
import { HEATMAP_CELL_GAP, HEATMAP_CELL_RADIUS, getActivityHeatmapLayout } from "@/design-system/components/charts/activity-heatmap-layout";
import { formatDateForAPI, formatTimeRange } from "@/utils/time-helper";
import { getReservationStatusColor, getReservationStatusLabel } from "@/utils/status-tone";
import { useIsFocused, useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Pressable,
    RefreshControl,
    View,
    useWindowDimensions,
    type LayoutChangeEvent,
} from "react-native";

type ActivityFilter = number | "all";
export function ActivityOverview() {
    const { colors: uiColors } = useTheme();
    const { t } = useTranslation();
    const isFocused = useIsFocused();
    const todayKey = formatDateForAPI(new Date());
    const currentYear = Number(todayKey.slice(0, 4));
    const [selectedYear, setSelectedYear] =
        useState<ActivityFilter>(currentYear);
    const [daySelection, setDaySelection] = useState<{
        filter: ActivityFilter;
        dateKey: string;
    } | null>(null);
    const { data: memberProfile } = useGetMemberProfile();
    const summaryQuery = useMemberActivitySummary(isFocused);
    const {
        data: activity,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberActivity(selectedYear, isFocused);

    const years = new Set([currentYear]);
    if (typeof selectedYear === "number") years.add(selectedYear);
    summaryQuery.data?.availableYears.forEach(year => {
        if (year <= currentYear) years.add(year);
    });
    const availableYears = Array.from(years).sort((a, b) => b - a);

    const activityValues = useMemo(
        () => mapActivityDays(activity?.daily ?? []),
        [activity?.daily],
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
    const activityLabel = isAllActivity
        ? t("activity.allTime")
        : String(activityYear);
    const selectedDateKey = daySelection?.filter === selectedYear
        ? daySelection.dateKey
        : selectedYear === currentYear ||
            (selectedYear === "all" &&
                todayKey >= toDateKey(firstDate) &&
                todayKey <= toDateKey(lastDate))
            ? todayKey
            : null;
    const dayReservationsQuery = useMemberReservationsForDay(
        activity ? selectedDateKey : null,
        isFocused,
    );
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => Promise.all([
            refetch({ cancelRefetch: false }),
            summaryQuery.refetch({ cancelRefetch: false }),
            ...(selectedDateKey ? [dayReservationsQuery.refetch({ cancelRefetch: false })] : []),
        ]));

    const preview = (
        <ActivitySharePreview
            isAvailable={Boolean(summaryQuery.data || activity)}
            availableYears={summaryQuery.data?.availableYears ?? []}
            selectedYear={selectedYear}
            initialDailyValues={activityValues}
            cardProps={{
                memberName: memberProfile?.data.name,
                memberImage: memberProfile?.data.profileImage,
            }}
        />
    );

    if (isLoading) {
        return (
            <>
                {preview}
                <ActivityLoadingState yearCount={availableYears.length} showSelectedDay={Boolean(selectedDateKey)} />
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
                    actionPending={isRefetching || isPullRefreshing}
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
                <ActivityLoadingState yearCount={availableYears.length} showSelectedDay={Boolean(selectedDateKey)} />
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
                    <View className="gap-4">
                        <ActivityChartHeader
                            title={t("activity.golfActivity")}
                            period={activityLabel}
                        />
                        <ActivityHeatmap
                            values={activityValues}
                            endDate={heatmapEndDate}
                            numDays={daysInYear}
                            selectedDateKey={selectedDateKey}
                            onDayPress={(date) => setDaySelection({
                                filter: selectedYear,
                                dateKey: toDateKey(date),
                            })}
                            onTodayPress={() => {
                                setDaySelection({ filter: currentYear, dateKey: todayKey });
                                setSelectedYear(currentYear);
                            }}
                        />
                        {selectedDateKey ? (
                            <ActivityDayReservations query={dayReservationsQuery} />
                        ) : null}
                    </View>
                </View>
            </Screen>

        </>
    );
}

function ActivityDayReservations({
    query,
}: {
    query: ReturnType<typeof useMemberReservationsForDay>;
}) {
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const weekdayFormatter = new Intl.DateTimeFormat(i18n.language, { weekday: "short" });
    const router = useRouter();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const { data, isError, isRefetching, refetch } = query;

    if (!data && !isError) {
        return (
            <View className="gap-2" accessibilityRole="progressbar" accessibilityLabel={t("activity.loading")}>
                <ActivityReservationRowSkeleton />
                <ActivityReservationRowSkeleton />
            </View>
        );
    }

    if (!data) {
        return (
            <ErrorState
                title={t("reservations.failedListTitle")}
                message={t("common.pullToRefreshAndTryAgain")}
                actionLabel={t("common.refreshTryAgain")}
                actionPending={isRefetching}
                onAction={() => { void refetch(); }}
            />
        );
    }

    return (
        <View className="gap-3">
            {isError ? (
                <Pressable
                    accessibilityRole="button"
                    disabled={isRefetching}
                    accessibilityState={{ disabled: isRefetching, busy: isRefetching }}
                    className="min-h-12 justify-center rounded-xl bg-muted px-4"
                    onPress={() => { void refetch(); }}
                >
                    <NativeText variant="subtext" color="mutedForeground">
                        {`${t("reservations.failedListTitle")} · ${t(isRefetching ? "common.refreshing" : "common.refreshTryAgain")}`}
                    </NativeText>
                </Pressable>
            ) : null}
            {data.length === 0 ? (
                <NativeText variant="subtext" color="mutedForeground">
                    {t("reservations.noReservationsTitle")}
                </NativeText>
            ) : data.map((reservation) => {
                const title = reservation.bayName ??
                    reservation.lessonAvailabilityName ??
                    reservation.lessonProgramGroupName ??
                    reservation.lessonProgramName ??
                    t("reservations.reservationFallbackWithId", { id: reservation.id });
                const date = parseCalendarDate(reservation.reservationDate);
                const backendStatusLabel = getReservationStatusLabel(reservation.reservationStatus, t);
                const statusLabel = backendStatusLabel === "-"
                    ? t("reservations.statusUnavailable")
                    : backendStatusLabel;
                const statusColor = getReservationStatusColor(colors, reservation.reservationStatus);
                return (
                    <Pressable
                        key={`${reservation.reservationType}:${reservation.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={t("reservations.openLabel", { title })}
                        accessibilityState={{ disabled: isLocked }}
                        disabled={isLocked}
                        className="min-h-16 flex-row items-center gap-3 rounded-xl bg-card px-2 py-2"
                        style={({ pressed }) => getPressedScaleStyle(pressed, isLocked, 0.99)}
                        onPress={() => {
                            runWithNavigationLock(() => {
                                triggerSelectionHaptic();
                                router.push({
                                    pathname: "/reservation/[id]",
                                    params: {
                                        id: String(reservation.id),
                                        type: reservation.reservationType,
                                    },
                                });
                            });
                        }}
                    >
                        <View className="h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <NativeText variant="label" wrap={false} textStyle={{ fontWeight: "700" }}>
                                {String(date.getDate())}
                            </NativeText>
                            <NativeText variant="badge" color="mutedForeground" wrap={false}>
                                {weekdayFormatter.format(date)}
                            </NativeText>
                        </View>
                        <View className="min-w-0 flex-1 gap-1">
                            <NativeText variant="label" numberOfLines={1}>{title}</NativeText>
                            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
                                <NativeText variant="subtext" wrap={false} textStyle={{ color: statusColor, fontWeight: "700" }}>
                                    {statusLabel}
                                </NativeText>
                                <NativeText variant="subtext" color="mutedForeground" wrap={false}>
                                    {formatTimeRange(reservation.startTime, reservation.endTime)}
                                </NativeText>
                            </View>
                        </View>
                        <ChevronRight size={18} color={colors.mutedForeground} />
                    </Pressable>
                );
            })}
        </View>
    );
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

function ActivityLoadingState({
    yearCount,
    showSelectedDay,
}: {
    yearCount: number;
    showSelectedDay: boolean;
}) {
    const { t } = useTranslation();

    return (
        <Screen>
            <View className="gap-5" accessibilityRole="progressbar" accessibilityLabel={t("activity.loading")}>
                <View className="gap-2">
                    <View className="flex-row flex-wrap gap-2">
                        {Array.from({ length: yearCount }, (_, index) => (
                            <Skeleton key={index} className="h-12 w-20 rounded-full" />
                        ))}
                        <Skeleton className="h-12 w-16 rounded-full" />
                    </View>
                </View>
                <View className="flex-row gap-3">
                    {Array.from({ length: 3 }, (_, index) => (
                        <View key={index} className="min-w-0 flex-1 gap-1 py-2">
                            <Skeleton className="h-8 w-14" />
                            <Skeleton className="h-4 w-20 max-w-full" />
                        </View>
                    ))}
                </View>
                <View className="gap-4">
                    <View className="flex-row items-center justify-between gap-3">
                        <Skeleton className="h-7 w-36" />
                        <Skeleton className="h-4 w-14" />
                    </View>
                    <View className="gap-3">
                        <HeatmapSkeleton />
                        <View className="h-12 flex-row items-center justify-center gap-3 overflow-hidden">
                            {["w-10", "w-14", "w-16", "w-12"].map((widthClass, index) => (
                                <View key={index} className="flex-row items-center gap-1.5">
                                    <Skeleton className="h-2.5 w-2.5 rounded-[3px]" />
                                    <Skeleton className={`h-4 ${widthClass}`} />
                                </View>
                            ))}
                        </View>
                        {showSelectedDay ? (
                            <View className="flex-row items-center justify-between gap-3">
                                <Skeleton className="h-7 w-48 max-w-[70%]" />
                                <Skeleton className="h-4 w-16" />
                            </View>
                        ) : null}
                    </View>
                    {showSelectedDay ? (
                        <View className="gap-3">
                            <ActivityReservationRowSkeleton />
                            <ActivityReservationRowSkeleton />
                        </View>
                    ) : null}
                </View>
            </View>
        </Screen>
    );
}

function HeatmapSkeleton() {
    const { width: windowWidth, fontScale } = useWindowDimensions();
    const { i18n } = useTranslation();
    const [measuredWidth, setMeasuredWidth] = useState(0);
    const containerWidth = measuredWidth || Math.min(SCREEN_MAX_WIDTH, windowWidth) - SCREEN_HORIZONTAL_PADDING * 2;
    const { labelColumnWidth, monthLabelHeight, availableWidth, cellSize } =
        getActivityHeatmapLayout(containerWidth, fontScale, i18n.language);
    const gridHeight = cellSize * 7 + HEATMAP_CELL_GAP * 6;

    return (
        <View
            className="w-full overflow-hidden"
            onLayout={(event: LayoutChangeEvent) => setMeasuredWidth(event.nativeEvent.layout.width)}
        >
            <Skeleton className="gap-1 rounded-none bg-transparent">
                <View className="flex-row" style={{ gap: HEATMAP_CELL_GAP }}>
                    <View style={{ width: labelColumnWidth }} />
                    <View className="flex-row items-start justify-between" style={{ width: availableWidth, height: monthLabelHeight }}>
                        {[40, 32, 40].map((width, index) => (
                            <View key={index} className="h-4 rounded-xl bg-muted" style={{ width }} />
                        ))}
                    </View>
                </View>
                <View className="flex-row" style={{ gap: HEATMAP_CELL_GAP }}>
                    <View className="justify-between" style={{ width: labelColumnWidth, height: gridHeight }}>
                        {Array.from({ length: 7 }, (_, index) => (
                            <View key={index} className="justify-center" style={{ height: cellSize }}>
                                <View className="h-2.5 rounded-md bg-muted" style={{ width: labelColumnWidth * 0.7 }} />
                            </View>
                        ))}
                    </View>
                    <View className="flex-row overflow-hidden" style={{ width: availableWidth, gap: HEATMAP_CELL_GAP }}>
                        {Array.from({ length: 12 }, (_, weekIndex) => (
                            <View key={weekIndex} style={{ width: cellSize, gap: HEATMAP_CELL_GAP }}>
                                {Array.from({ length: 7 }, (_, dayIndex) => (
                                    <View
                                        key={dayIndex}
                                        className="bg-muted"
                                        style={{ width: cellSize, height: cellSize, borderRadius: HEATMAP_CELL_RADIUS }}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>
                </View>
                <View className="h-3" />
            </Skeleton>
        </View>
    );
}

function ActivityReservationRowSkeleton() {
    return (
        <Skeleton className="h-16 flex-row items-center gap-3 rounded-xl bg-card px-2 py-2">
            <View className="h-12 w-12 shrink-0 rounded-lg bg-muted" />
            <View className="min-w-0 flex-1 gap-2">
                <View className="h-4 w-28 max-w-full rounded-md bg-muted" />
                <View className="h-3 w-40 max-w-full rounded-md bg-muted" />
            </View>
            <View className="h-4 w-2 rounded-md bg-muted" />
        </Skeleton>
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
            <NativeText variant="h1" color="primary">
                {value}
            </NativeText>
            <NativeText variant="caption" color="mutedForeground">
                {label}
            </NativeText>
        </View>
    );
}
