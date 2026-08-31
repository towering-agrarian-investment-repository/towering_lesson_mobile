import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, View, type LayoutChangeEvent, type ViewProps } from "react-native";
import { cn } from "../../utils/cn";
import { useTheme } from "../../utils/theme";
import { AppText } from "../AppText";
import type { ActivityHeatmapStatus } from "./activity-heatmap";
import i18n from "@/i18n";

export type WeeklySummaryValue = {
    weekStart: string | number | Date;
    total: number;
    status?: ActivityHeatmapStatus;
    statusBreakdown?: Partial<Record<ActivityHeatmapStatus, number>>;
    typeCounts?: { lesson: number; bay: number };
};
type WeeklyWeek = {
    weekStart: Date;
    total: number;
    status?: ActivityHeatmapStatus;
    statusBreakdown?: Partial<Record<ActivityHeatmapStatus, number>>;
    typeCounts?: { lesson: number; bay: number };
    label: string;
};

type WeeklySummaryProps = Omit<ViewProps, "children"> & {
    values: WeeklySummaryValue[];
    startDate?: Date;
    endDate?: Date;
    numWeeks?: number;
    initialScrollToEnd?: boolean;
    overallCount?: number;
    title?: string;
    unitLabel?: string; // e.g. "activities", "min"
    className?: string;
    onWeekPress?: (weekStart: Date, total: number) => void;
};

const BAR_GAP = 8;
const BAR_WIDTH_DEFAULT = 22;
const BAR_WIDTH_MIN = 16;
const BAR_WIDTH_MAX = 32;
const MAX_BAR_HEIGHT = 80;
const MIN_BAR_HEIGHT = 3; // thin baseline sliver so zero weeks are still visible/tappable
const Y_AXIS_WIDTH = 22;
const CHART_GAP = 8;
const SCROLL_TRACK_WIDTH = 64;
const MIN_SCROLL_THUMB_WIDTH = 14;

export function WeeklySummary({ values, startDate, endDate = new Date(), numWeeks = 12, initialScrollToEnd = false, overallCount, title, unitLabel = "activities", className, onWeekPress, ...props }: WeeklySummaryProps) {
    const { colors } = useTheme();
    const [containerWidth, setContainerWidth] = useState(0);
    const startDateKey = startDate ? weekKey(startDate) : "";
    const endDateKey = weekKey(endDate);
    const weeks = useMemo(() => buildWeekSummaries(values, startDate, endDate, numWeeks), [values, startDateKey, endDateKey, numWeeks]);
    const maxTotal = Math.max(1, ...weeks.map((w) => w.total));
    const hasData = weeks.some((week) => week.total > 0);

    const currentWeekKey = weekKey(parseCalendarDate(new Date()));
    const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
    const selectedSummary = weeks.find((w) => weekKey(w.weekStart) === selectedWeek);

    useEffect(() => {
        // Reset to the overall summary whenever the year/range changes.
        setSelectedWeek(null);
    }, [weeks]);

    const chartViewportWidth = Math.max(0, containerWidth - Y_AXIS_WIDTH - CHART_GAP);
    const barWidth = chartViewportWidth > 0
        ? Math.min(BAR_WIDTH_MAX, Math.max(BAR_WIDTH_MIN, Math.floor(chartViewportWidth / 8)))
        : BAR_WIDTH_DEFAULT;
    const gridWidth = weeks.length * (barWidth + BAR_GAP);
    const needsScroll = chartViewportWidth > 0 && gridWidth > chartViewportWidth;
    const maxScrollX = Math.max(0, gridWidth - chartViewportWidth);
    const scrollThumbWidth = needsScroll
        ? Math.max(MIN_SCROLL_THUMB_WIDTH, (chartViewportWidth / gridWidth) * SCROLL_TRACK_WIDTH)
        : SCROLL_TRACK_WIDTH;

    const handleLayout = (event: LayoutChangeEvent) => setContainerWidth(event.nativeEvent.layout.width);

    const scrollRef = useRef<FlatList<(typeof weeks)[number]>>(null);
    const autoScrolledRange = useRef<string | null>(null);
    const rangeKey = weeks.length
        ? `${weekKey(weeks[0].weekStart)}-${weekKey(weeks[weeks.length - 1].weekStart)}`
        : "empty";
    useEffect(() => {
        if (autoScrolledRange.current === rangeKey || containerWidth === 0) return;
        const initialScrollX = initialScrollToEnd ? maxScrollX : 0;
        scrollRef.current?.scrollToOffset({ offset: initialScrollX, animated: false });
        autoScrolledRange.current = rangeKey;
    }, [containerWidth, gridWidth, initialScrollToEnd, rangeKey]);

    const handleBarPress = useCallback((weekStart: Date, total: number, key: string) => {
        setSelectedWeek(key);
        onWeekPress?.(weekStart, total);
    }, [onWeekPress]);

    const renderBar = useCallback(({ item: week }: { item: WeeklyWeek }) => (
        <WeeklyBar
            week={week}
            barWidth={barWidth}
            maxTotal={maxTotal}
            currentWeekKey={currentWeekKey}
            selectedWeek={selectedWeek}
            unitLabel={unitLabel}
            colors={colors}
            onPress={handleBarPress}
        />
    ), [barWidth, colors, currentWeekKey, handleBarPress, maxTotal, selectedWeek, unitLabel]);

    return (
        <View className={cn("w-full gap-3", className)} onLayout={handleLayout} {...props}>
            {title ? <AppText variant="h3">{title}</AppText> : null}
            {containerWidth === 0 ? null : (
                <View className="flex-row" style={{ gap: CHART_GAP }}>
                    <View style={{ width: Y_AXIS_WIDTH, height: MAX_BAR_HEIGHT }}>
                        <AppText variant="caption" className="text-[9px]" style={{ position: "absolute", top: -6 }}>
                            {maxTotal}
                        </AppText>
                        <AppText variant="caption" className="text-[9px]" style={{ position: "absolute", top: MAX_BAR_HEIGHT / 2 - 6 }}>
                            {Math.ceil(maxTotal / 2)}
                        </AppText>
                        <AppText variant="caption" className="text-[9px]" style={{ position: "absolute", bottom: 0 }}>
                            0
                        </AppText>
                    </View>
                    <FlatList
                        ref={scrollRef}
                        data={weeks}
                        renderItem={renderBar}
                        extraData={selectedWeek}
                        initialScrollIndex={initialScrollToEnd && needsScroll ? Math.max(0, weeks.length - 1) : undefined}
                        keyExtractor={(week) => weekKey(week.weekStart)}
                        getItemLayout={(_, index) => ({ length: barWidth + BAR_GAP, offset: index * (barWidth + BAR_GAP), index })}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: BAR_GAP, paddingRight: BAR_GAP }}
                    />
                </View>
            )}
            {needsScroll ? (
                <View
                    accessible
                    accessibilityRole="adjustable"
                    accessibilityLabel={i18n.t("activity.horizontalScroll")}
                    className="self-center rounded-full bg-muted"
                    style={{ width: SCROLL_TRACK_WIDTH, height: 4 }}
                >
                    <View
                        className="h-1 rounded-full bg-primary"
                        style={{
                            width: scrollThumbWidth,
                        }}
                    />
                </View>
            ) : null}
            {selectedSummary ? (
                <View className="gap-0.5">
                    <AppText variant="caption" className="text-left">
                        {i18n.t("activity.weekOf", { date: selectedSummary.label })} · {selectedSummary.total} {unitLabel}{formatStatusBreakdown(selectedSummary.statusBreakdown)}
                    </AppText>
                    <AppText variant="caption" className="text-left">
                        {formatTypeBreakdown(selectedSummary.typeCounts) || "-"}
                    </AppText>
                </View>
            ) : (
                <AppText variant="caption" className="text-left">
                    {i18n.t("activity.overall")} · {overallCount !== undefined ? `${overallCount} ${unitLabel}` : "-"}
                </AppText>
            )}
            {!hasData ? (
                <AppText variant="caption" className="text-center text-muted-foreground">
                    {i18n.t("activity.noRecorded", { unit: unitLabel })}
                </AppText>
            ) : null}
        </View>
    );
}

const WeeklyBar = memo(function WeeklyBar({
    week,
    barWidth,
    maxTotal,
    currentWeekKey,
    selectedWeek,
    unitLabel,
    colors,
    onPress,
}: {
    week: WeeklyWeek;
    barWidth: number;
    maxTotal: number;
    currentWeekKey: string;
    selectedWeek: string | null;
    unitLabel: string;
    colors: ReturnType<typeof useTheme>["colors"];
    onPress: (weekStart: Date, total: number, key: string) => void;
}) {
    const key = weekKey(week.weekStart);
    const isCurrent = key === currentWeekKey;
    const isSelected = key === selectedWeek;
    const barHeight = Math.max(MIN_BAR_HEIGHT, Math.round((week.total / maxTotal) * MAX_BAR_HEIGHT));
    const segments = buildStatusSegments(week.statusBreakdown, week.total, barHeight, week.status, colors);

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${week.total} ${unitLabel} · ${i18n.t("activity.weekOf", { date: key })}${isCurrent ? ` (${i18n.t("activity.currentWeek")})` : ""}`}
            onPress={() => onPress(week.weekStart, week.total, key)}
            style={{ width: barWidth, alignItems: "center", gap: 4 }}
        >
            <View style={{ width: barWidth, height: MAX_BAR_HEIGHT, justifyContent: "flex-end", position: "relative" }}>
                <View
                    style={{
                        width: barWidth,
                        height: barHeight,
                        borderRadius: 6,
                        overflow: "hidden",
                        opacity: isSelected ? 1 : 0.55,
                        borderWidth: isCurrent ? 1.5 : 0,
                        borderColor: colors.foreground,
                    }}
                >
                    {segments.map((segment) => (
                        <View
                            key={segment.status}
                            style={{ flex: segment.height, backgroundColor: getStatusColor(segment.status, colors) }}
                        />
                    ))}
                </View>
            </View>
            <AppText variant="caption" className="text-[9px]" numberOfLines={1}>
                {week.label}
            </AppText>
        </Pressable>
    );
});

function buildStatusSegments(
    breakdown: Partial<Record<ActivityHeatmapStatus, number>> | undefined,
    total: number,
    barHeight: number,
    fallbackStatus: ActivityHeatmapStatus | undefined,
    colors: ReturnType<typeof useTheme>["colors"],
) {
    const statusOrder: ActivityHeatmapStatus[] = ["completed", "no-show", "reserved", "cancelled", "unknown"];
    const entries = statusOrder
        .map((status) => ({ status, count: breakdown?.[status] ?? 0 }))
        .filter((entry) => entry.count > 0);

    if (entries.length === 0) {
        return [{ status: fallbackStatus ?? "unknown", height: barHeight, color: getStatusColor(fallbackStatus, colors) }];
    }

    let remainingHeight = barHeight;
    return entries.map((entry, index) => {
        const height = index === entries.length - 1
            ? remainingHeight
            : Math.round((entry.count / Math.max(1, total)) * barHeight);
        remainingHeight -= height;
        return { status: entry.status, height: Math.max(0, height), color: getStatusColor(entry.status, colors) };
    });
}

function buildWeekSummaries(values: WeeklySummaryValue[], startDate: Date | undefined, endDate: Date, numWeeks: number) {
    const totals = new Map(values.map((v) => [weekKey(v.weekStart), v]));
    const start = parseCalendarDate(startDate ?? endDate);
    const end = parseCalendarDate(endDate);
    const startDayOfWeek = (start.getDay() + 6) % 7;
    const firstWeekStart = new Date(start);
    firstWeekStart.setDate(start.getDate() - startDayOfWeek);
    const daysSinceMonday = (end.getDay() + 6) % 7;
    const lastWeekStart = new Date(end); lastWeekStart.setDate(end.getDate() - daysSinceMonday);

    const weekCount = startDate
        ? Math.floor((lastWeekStart.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
        : numWeeks;

    const weeks: WeeklyWeek[] = [];
    for (let i = 0; i < weekCount; i++) {
        const weekStart = new Date(firstWeekStart); weekStart.setDate(firstWeekStart.getDate() + i * 7);
        const key = weekKey(weekStart);
        const value = totals.get(key);
        weeks.push({ weekStart, total: value?.total ?? 0, status: value?.status, statusBreakdown: value?.statusBreakdown, typeCounts: value?.typeCounts, label: weekStart.toLocaleDateString(i18n.language, { month: "short", day: "numeric" }) });
    }
    return weeks;
}

function weekKey(date: string | number | Date) {
    const d = parseCalendarDate(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Same timezone-safe parsing as ActivityHeatmap — treats plain "YYYY-MM-DD"
// strings as local calendar dates instead of routing through UTC.
function parseCalendarDate(date: string | number | Date) {
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
        const [year, month, day] = date.slice(0, 10).split("-").map(Number);
        return new Date(year, month - 1, day);
    }
    const parsed = new Date(date);
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function formatStatusBreakdown(breakdown?: Partial<Record<ActivityHeatmapStatus, number>>) {
    if (!breakdown) return "";

    const labels: Record<ActivityHeatmapStatus, string> = {
        completed: i18n.t("activity.done"), "no-show": i18n.t("activity.absent"), cancelled: i18n.t("activity.cancelled"), reserved: i18n.t("activity.booked"), mixed: i18n.t("activity.mixed"), unknown: i18n.t("activity.other"),
    };
    const details = Object.entries(breakdown)
        .filter(([, count]) => count && count > 0)
        .map(([status, count]) => `${count} ${labels[status as ActivityHeatmapStatus]}`)
        .join(" · ");

    return details ? ` · ${details}` : "";
}

function formatTypeBreakdown(typeCounts?: { lesson: number; bay: number }) {
    if (!typeCounts) return "";

    const details = [
        typeCounts.bay > 0 ? `${typeCounts.bay} ${i18n.t("activity.bay")}` : null,
        typeCounts.lesson > 0 ? `${typeCounts.lesson} ${i18n.t("activity.lesson")}` : null,
    ].filter(Boolean).join(" · ");

    return details;
}

function getStatusColor(status: ActivityHeatmapStatus | undefined, colors: ReturnType<typeof useTheme>["colors"]) {
    switch (status) {
        case "completed":
            return colors.success;
        case "no-show":
            return colors.danger;
        case "cancelled":
            return colors.mutedForeground;
        case "reserved":
            return colors.ticketPrivate;
        case "mixed":
            return colors.warning;
        case "unknown":
        default:
            return colors.primary;
    }
}
