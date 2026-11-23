import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { AppText } from "@/design-system/components/AppText";
import { NativeText } from "@/design-system/components/NativeText";
import { ActivitySharePreview } from "@/components/golf/ActivitySharePreview";
import { mapActivityDays } from "@/components/golf/activity-display-data";
import ReservationCard, {
    ReservationCardSkeleton,
} from "@/components/golf/ReservationCard";
import {
    ActivityHeatmap,
    AnimatedPressable,
    cn,
    CompactEmptyState,
    EmptyState,
    ErrorState,
    Screen,
    SCREEN_HORIZONTAL_PADDING,
    SCREEN_MAX_WIDTH,
    Skeleton,
    triggerSelectionHaptic,
    useTheme,
} from "@/design-system";
import { useMemberActivity, useMemberActivitySummary } from "@/lib/hook/useMemberActivity";
import { useMinuteClock } from "@/lib/hook/useMinuteClock";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
    getMemberReservationDetailQueryOptions,
    useMemberReservationsForDay,
} from "@/lib/hook/useReservation";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { formatActivityDate, toDateKey } from "@/design-system/components/charts/activity-chart-data";
import { HEATMAP_CELL_GAP, HEATMAP_CELL_RADIUS, getActivityHeatmapLayout } from "@/design-system/components/charts/activity-heatmap-layout";
import type { MemberReservationSummaryResponse } from "@/types/member-reservation";
import { formatDateForAPI } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import { useIsFocused, useRouter } from "expo-router";
import { ChevronRight, Sparkles } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    RefreshControl,
    ScrollView,
    View,
    useWindowDimensions,
    type LayoutChangeEvent,
} from "react-native";

type ActivityFilter = number | "all";
export function ActivityOverview() {
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const isFocused = useIsFocused();
    const [showShareCard, setShowShareCard] = useState(false);
    const referenceTime = useMinuteClock();
    const todayKey = formatDateForAPI(new Date(referenceTime));
    const currentYear = Number(todayKey.slice(0, 4));
    const [selectedYear, setSelectedYear] =
        useState<ActivityFilter>(currentYear);
    const [focusTodayToken, setFocusTodayToken] = useState(0);
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
        isPlaceholderData,
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
            open={showShareCard}
            onOpenChange={setShowShareCard}
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
                <Screen
                    contentClassName="grow"
                    bottomPadding={16}
                    bottomSafeArea={process.env.EXPO_OS === "ios"}
                    refreshControl={
                        <RefreshControl
                            refreshing={isPullRefreshing}
                            onRefresh={handlePullRefresh}
                        />
                    }
                >
                    <ErrorState
                        title={t("activity.couldNotLoad")}
                        message={t("home.checkConnection")}
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
                </Screen>
            </>
        );
    }

    if (!activity) {
        return (
            <>
                {preview}
                <Screen
                    contentClassName="grow"
                    bottomPadding={16}
                    bottomSafeArea={process.env.EXPO_OS === "ios"}
                    refreshControl={
                        <RefreshControl
                            refreshing={isPullRefreshing}
                            onRefresh={handlePullRefresh}
                        />
                    }
                >
                    <EmptyState
                        title={t("activity.emptyTitle")}
                        message={t("activity.emptyMessage")}
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
                </Screen>
            </>
        );
    }

    const handleTodayJump = () => {
        triggerSelectionHaptic();
        setSelectedYear(currentYear);
        setDaySelection({ filter: currentYear, dateKey: todayKey });
        setFocusTodayToken((token) => token + 1);
    };

    const showTodayShortcut =
        selectedYear !== currentYear || selectedDateKey !== todayKey;

    const selectedDayHeatmapCount = selectedDateKey
        ? activityValues.find((value) => toDateKey(value.date) === selectedDateKey)?.count ?? 0
        : 0;
    const selectedDayCount =
        dayReservationsQuery.data?.length ?? selectedDayHeatmapCount;

    return (
        <>
            {preview}
            <Screen
                bottomSafeArea={process.env.EXPO_OS === "ios"}
                refreshControl={
                    <RefreshControl
                        refreshing={isPullRefreshing}
                        onRefresh={handlePullRefresh}
                    />
                }
            >
                <View className="gap-5">
                    <ScrollView
                        horizontal
                        nestedScrollEnabled
                        directionalLockEnabled
                        contentInsetAdjustmentBehavior="never"
                        showsHorizontalScrollIndicator={false}
                        style={{ flexGrow: 0, flexShrink: 0 }}
                        contentContainerStyle={{
                            gap: 8,
                            alignItems: "center",
                        }}
                    >
                        {availableYears.map((year) => {
                            const isSelected = selectedYear === year;
                            return (
                                <AnimatedPressable
                                    key={year}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: isSelected }}
                                    accessibilityLabel={t("activity.showYear", {
                                        year,
                                    })}
                                    className="min-h-12 justify-center"
                                    onPress={() => {
                                        if (selectedYear === year) return;
                                        triggerSelectionHaptic();
                                        setSelectedYear(year);
                                    }}
                                >
                                    <View
                                        className={cn(
                                            "items-center justify-center rounded-full px-3.5 py-1.5",
                                            isSelected
                                                ? "bg-primary"
                                                : "bg-muted",
                                        )}
                                    >
                                        <AppText
                                            variant="meta"
                                            wrap={false}
                                            color={
                                                isSelected
                                                    ? "primaryForeground"
                                                    : "mutedForeground"
                                            }
                                            textStyle={{
                                                fontWeight: "600",
                                                fontVariant: ["tabular-nums"],
                                            }}
                                        >
                                            {String(year ?? "")}
                                        </AppText>
                                    </View>
                                </AnimatedPressable>
                            );
                        })}
                        <AnimatedPressable
                            accessibilityRole="button"
                            accessibilityState={{
                                selected: selectedYear === "all",
                            }}
                            accessibilityLabel={t("activity.showAll")}
                            className="min-h-12 justify-center"
                            onPress={() => {
                                if (selectedYear === "all") return;
                                triggerSelectionHaptic();
                                setSelectedYear("all");
                            }}
                        >
                            <View
                                className={cn(
                                    "items-center justify-center rounded-full px-3.5 py-1.5",
                                    selectedYear === "all"
                                        ? "bg-primary"
                                        : "bg-muted",
                                )}
                            >
                                <AppText
                                    variant="meta"
                                    wrap={false}
                                    color={
                                        selectedYear === "all"
                                            ? "primaryForeground"
                                            : "mutedForeground"
                                    }
                                    textStyle={{ fontWeight: "600" }}
                                >
                                    {t("activity.all")}
                                </AppText>
                            </View>
                        </AnimatedPressable>
                    </ScrollView>
                    <View
                        className={cn(
                            "gap-5",
                            isPlaceholderData && "opacity-60",
                        )}
                    >
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
                        {totalReservations > 0 ? (
                            <AnimatedPressable
                                accessibilityRole="button"
                                accessibilityLabel={t("shareCard.bannerTitle")}
                                onPress={() => {
                                    triggerSelectionHaptic();
                                    setShowShareCard(true);
                                }}
                                className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                            >
                                <View className="h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                    <Sparkles
                                        size={18}
                                        color={colors.primary}
                                        strokeWidth={2.2}
                                    />
                                </View>
                                <View className="min-w-0 flex-1 gap-0.5">
                                    <AppText
                                        variant="meta"
                                        numberOfLines={1}
                                        textStyle={{ fontWeight: "700" }}
                                    >
                                        {t("shareCard.bannerTitle")}
                                    </AppText>
                                    <AppText
                                        variant="caption"
                                        color="mutedForeground"
                                        numberOfLines={1}
                                    >
                                        {t("shareCard.bannerSubtitle")}
                                    </AppText>
                                </View>
                                <ChevronRight
                                    size={16}
                                    color={colors.mutedForeground}
                                    strokeWidth={2.2}
                                />
                            </AnimatedPressable>
                        ) : null}
                        <View className="gap-4">
                            <ActivityChartHeader
                                title={t("activity.golfActivity")}
                                period={activityLabel}
                                onTodayPress={
                                    showTodayShortcut
                                        ? handleTodayJump
                                        : undefined
                                }
                            />
                            <ActivityHeatmap
                                values={activityValues}
                                endDate={heatmapEndDate}
                                numDays={daysInYear}
                                selectedDateKey={selectedDateKey}
                                focusTodayToken={focusTodayToken}
                                onDayPress={(date) => setDaySelection({
                                    filter: selectedYear,
                                    dateKey: toDateKey(date),
                                })}
                                onTodayPress={handleTodayJump}
                            />
                            {selectedDateKey ? (
                                <View className="gap-3 pt-1">
                                    <View className="flex-row items-center justify-between gap-3">
                                        <AppText
                                            variant="h3"
                                            style={{ flex: 1, minWidth: 0 }}
                                        >
                                            {formatActivityDate(
                                                selectedDateKey,
                                                i18n.language,
                                            )}
                                        </AppText>
                                        <AppText
                                            variant="subtext"
                                            color="mutedForeground"
                                            align="right"
                                            wrap={false}
                                            textStyle={{
                                                fontWeight: "600",
                                                fontVariant: ["tabular-nums"],
                                            }}
                                        >
                                            {t("activity.sessionCount", {
                                                count: selectedDayCount,
                                            })}
                                        </AppText>
                                    </View>
                                    <ActivityDayReservations
                                        query={dayReservationsQuery}
                                        referenceTime={referenceTime}
                                    />
                                </View>
                            ) : null}
                        </View>
                    </View>
                </View>
            </Screen>

        </>
    );
}

function ActivityDayReservations({
    query,
    referenceTime,
}: {
    query: ReturnType<typeof useMemberReservationsForDay>;
    referenceTime: number;
}) {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const { data, isError, isRefetching, refetch } = query;

    const handleReservationPress = useCallback(
        (reservation: MemberReservationSummaryResponse) => {
            void queryClient.prefetchQuery(
                getMemberReservationDetailQueryOptions(
                    reservation.id,
                    reservation.reservationType,
                ),
            );
            runWithNavigationLock(() => {
                router.push({
                    pathname: "/reservation/[id]",
                    params: {
                        id: String(reservation.id),
                        type: reservation.reservationType,
                    },
                });
            });
        },
        [queryClient, router, runWithNavigationLock],
    );

    if (!data && !isError) {
        return (
            <View className="gap-2.5" accessibilityRole="progressbar" accessibilityLabel={t("activity.loading")}>
                <ReservationCardSkeleton />
                <ReservationCardSkeleton />
            </View>
        );
    }

    if (!data) {
        return (
            <CompactEmptyState
                tone="danger"
                title={t("reservations.failedListTitle")}
                message={t("common.pullToRefreshAndTryAgain")}
                actionLabel={t("common.refreshTryAgain")}
                actionPending={isRefetching}
                onAction={() => { void refetch(); }}
            />
        );
    }

    return (
        <View className="gap-2.5">
            {isError ? (
                <AnimatedPressable
                    accessibilityRole="button"
                    disabled={isRefetching}
                    haptic="selection"
                    accessibilityState={{ disabled: isRefetching, busy: isRefetching }}
                    className="min-h-12 justify-center rounded-xl bg-muted px-4"
                    onPress={() => { void refetch(); }}
                >
                    <NativeText variant="subtext" color="mutedForeground">
                        {`${t("reservations.failedListTitle")} · ${t(isRefetching ? "common.refreshing" : "common.refreshTryAgain")}`}
                    </NativeText>
                </AnimatedPressable>
            ) : null}
            {data.length === 0 ? (
                <CompactEmptyState title={t("reservations.noReservationsTitle")} />
            ) : (
                data.map((reservation) => (
                    <ReservationCard
                        key={`${reservation.reservationType}:${reservation.id}`}
                        reservation={reservation}
                        referenceTime={referenceTime}
                        disabled={isLocked}
                        onPress={handleReservationPress}
                    />
                ))
            )}
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

function ActivityChartHeader({
    title,
    period,
    onTodayPress,
}: {
    title: string;
    period: string;
    onTodayPress?: () => void;
}) {
    const { t } = useTranslation();

    return (
        <View className="flex-row items-center justify-between gap-3">
            <NativeText variant="h3" style={{ flex: 1, minWidth: 0 }}>
                {title}
            </NativeText>
            <View className="flex-row items-center gap-2">
                {onTodayPress ? (
                    <AnimatedPressable
                        accessibilityRole="button"
                        accessibilityLabel={t("activity.today")}
                        hitSlop={8}
                        className="justify-center"
                        onPress={onTodayPress}
                    >
                        <View className="rounded-full bg-muted px-3 py-1">
                            <AppText
                                variant="caption"
                                color="primary"
                                wrap={false}
                                textStyle={{ fontWeight: "700" }}
                            >
                                {t("activity.today")}
                            </AppText>
                        </View>
                    </AnimatedPressable>
                ) : null}
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
        <Screen bottomSafeArea={process.env.EXPO_OS === "ios"}>
            <View className="gap-5" accessibilityRole="progressbar" accessibilityLabel={t("activity.loading")}>
                <View className="flex-row flex-wrap items-center gap-2">
                    {Array.from({ length: yearCount }, (_, index) => (
                        <View key={index} className="min-h-12 justify-center">
                            <Skeleton className="h-8 w-16 rounded-full" />
                        </View>
                    ))}
                    <View className="min-h-12 justify-center">
                        <Skeleton className="h-8 w-14 rounded-full" />
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
                            <ReservationCardSkeleton />
                            <ReservationCardSkeleton />
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

function ActivityStat({
    value,
    label,
}: {
    value: string;
    label: string;
}) {
    return (
        <View className="min-w-0 flex-1 gap-1 py-1">
            <AppText
                variant="h1"
                color="primary"
                numberOfLines={1}
                textStyle={{
                    fontWeight: "800",
                    fontVariant: ["tabular-nums"],
                }}
            >
                {value}
            </AppText>
            <AppText variant="caption" color="mutedForeground" numberOfLines={2}>
                {label}
            </AppText>
        </View>
    );
}
