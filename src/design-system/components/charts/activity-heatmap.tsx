import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, Pressable, View, type LayoutChangeEvent, type ViewProps } from "react-native";
import { cn } from "../../utils/cn";
import { useTheme, type ThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";

export type ActivityHeatmapStatus = "completed" | "no-show" | "cancelled" | "reserved" | "mixed" | "unknown";
export type ActivityHeatmapValue = {
    date: string | number | Date;
    count: number;
    status?: ActivityHeatmapStatus;
    statusBreakdown?: Partial<Record<ActivityHeatmapStatus, number>>;
    typeCounts?: { lesson: number; bay: number };
};

export function ActivityStatusLegend({ className, includeMixed = true }: { className?: string; includeMixed?: boolean }) {
    const { colors } = useTheme();

    return (
        <View className={cn("flex-row items-center", className)} style={{ gap: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors.success }} />
            <AppText variant="caption" className="text-[9px]">Done</AppText>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors.danger }} />
            <AppText variant="caption" className="text-[9px]">Absent</AppText>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors.ticketPrivate }} />
            <AppText variant="caption" className="text-[9px]">Booked</AppText>
            {includeMixed ? (
                <>
                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors.warning }} />
                    <AppText variant="caption" className="text-[9px]">Mixed</AppText>
                </>
            ) : null}
        </View>
    );
}

type ActivityHeatmapProps = Omit<ViewProps, "children"> & {
    values: ActivityHeatmapValue[];
    endDate?: Date;
    numDays?: number;
    title?: string;
    legend?: boolean;
    overallCount?: number;
    overallUnitLabel?: string;
    yearLabel?: string;
    scrollResetKey?: string | number;
    className?: string;
    onDayPress?: (date: Date, count: number) => void;
};

const CELL_GAP = 4;
const CELL_RADIUS = 5;
const MIN_CELL = 11;
const DEFAULT_CELL = 13;
const MAX_CELL = 18;
const LABEL_COL_WIDTH = 20;
const LABEL_BUFFER = 24;
const SCROLL_TRACK_WIDTH = 64;
const MIN_SCROLL_THUMB_WIDTH = 14;
const WEEKDAY_LABELS = ["M", "W", "F", "S"];

export function ActivityHeatmap({ values, endDate = new Date(), numDays = 365, title, legend = true, overallCount, overallUnitLabel = "activities", yearLabel, scrollResetKey, className, onDayPress, ...props }: ActivityHeatmapProps) {
    const { colors } = useTheme();
    const todayKey = toDateKey(new Date());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const scrollOffset = useRef(new Animated.Value(0)).current;
    const weeks = useMemo(() => buildWeeks(values, endDate, numDays), [values, endDate, numDays]);
    const selectedValue = values.find((value) => toDateKey(value.date) === selectedDay);

    // Focus the current month for the current year, or January for a historical
    // year, so changing the year always opens at a useful part of the heatmap.
    const focusMonthWeekIndex = useMemo(() => {
        const now = new Date();
        const selectedYear = parseCalendarDate(endDate).getFullYear();
        const focusYear = selectedYear === now.getFullYear() ? now.getFullYear() : selectedYear;
        const focusMonth = selectedYear === now.getFullYear() ? now.getMonth() : 0;

        return weeks.findIndex((week) => week.days.some((d) => d.date.getFullYear() === focusYear && d.date.getMonth() === focusMonth));
    }, [endDate, weeks]);

    const availableWidth = Math.max(0, containerWidth - LABEL_COL_WIDTH);
    const fitCellSize = weeks.length > 0 ? Math.floor(availableWidth / weeks.length) - CELL_GAP : DEFAULT_CELL;
    const cellSize = fitCellSize >= DEFAULT_CELL
        ? Math.min(MAX_CELL, fitCellSize)
        : Math.max(MIN_CELL, DEFAULT_CELL);
    const gridWidth = weeks.length * (cellSize + CELL_GAP) + LABEL_BUFFER;
    const needsScroll = containerWidth > 0 && gridWidth > availableWidth;
    const maxScrollX = Math.max(0, gridWidth - availableWidth);
    const scrollThumbWidth = needsScroll
        ? Math.max(MIN_SCROLL_THUMB_WIDTH, (availableWidth / gridWidth) * SCROLL_TRACK_WIDTH)
        : SCROLL_TRACK_WIDTH;
    const scrollThumbTravel = Math.max(0, SCROLL_TRACK_WIDTH - scrollThumbWidth);

    const handleLayout = (event: LayoutChangeEvent) => setContainerWidth(event.nativeEvent.layout.width);

    // Scroll so the current month starts at the left edge of the viewport on
    // first render (only once, so it doesn't fight the user if they scroll away
    // afterward).
    const scrollRef = useRef<FlatList<(typeof weeks)[number]>>(null);
    const autoScrolledRange = useRef<string | null>(null);
    const rangeKey = weeks.length
        ? `${toDateKey(weeks[0].days[0].date)}-${toDateKey(weeks[weeks.length - 1].days[0].date)}`
        : "empty";
    useEffect(() => {
        autoScrolledRange.current = null;
    }, [scrollResetKey]);

    useEffect(() => {
        if (autoScrolledRange.current === rangeKey || !needsScroll || containerWidth === 0 || focusMonthWeekIndex === -1) return;
        const maxScrollX = Math.max(0, gridWidth - availableWidth);
        const targetX = Math.min(maxScrollX, Math.max(0, focusMonthWeekIndex * (cellSize + CELL_GAP)));
        scrollRef.current?.scrollToOffset({ offset: targetX, animated: false });
        autoScrolledRange.current = rangeKey;
    }, [needsScroll, containerWidth, focusMonthWeekIndex, cellSize, availableWidth, gridWidth, rangeKey, scrollResetKey]);

    const handleSelectDay = useCallback((dateKey: string, date: Date, count: number) => {
        setSelectedDay(dateKey);
        onDayPress?.(date, count);
    }, [onDayPress]);

    const renderWeek = useCallback(({ item: week }: { item: (typeof weeks)[number] }) => (
        <HeatmapWeekColumn
            key={toDateKey(week.days[0].date)}
            week={week}
            cellSize={cellSize}
            todayKey={todayKey}
            selectedDay={selectedDay}
            colors={colors}
            onSelectDay={handleSelectDay}
        />
    ), [cellSize, colors, handleSelectDay, selectedDay, todayKey]);

    return (
        <View className={cn("w-full gap-3", className)} onLayout={handleLayout} {...props}>
            {title ? <AppText variant="h3">{title}</AppText> : null}
            <View className="flex-row items-center justify-between gap-2">
                <AppText variant="caption" className="font-semibold text-muted-foreground">
                    {yearLabel ?? parseCalendarDate(endDate).getFullYear()}
                </AppText>
                {legend ? <ActivityStatusLegend /> : null}
            </View>
            <View className="flex-row" style={{ gap: CELL_GAP }}>
                <View style={{ width: LABEL_COL_WIDTH, height: cellSize * 7 + CELL_GAP * 6, marginTop: cellSize + CELL_GAP }}>
                    {WEEKDAY_LABELS.map((label, i) => (
                        <AppText key={label} variant="caption" className="text-[9px]" style={{ position: "absolute", top: i * 2 * (cellSize + CELL_GAP) }}>
                            {label}
                        </AppText>
                    ))}
                </View>
                {containerWidth === 0 ? null : needsScroll ? (
                    <Animated.FlatList
                        ref={scrollRef}
                        data={weeks}
                        renderItem={renderWeek}
                        extraData={selectedDay}
                        initialScrollIndex={needsScroll && focusMonthWeekIndex >= 0 ? focusMonthWeekIndex : undefined}
                        keyExtractor={(week) => toDateKey(week.days[0].date)}
                        getItemLayout={(_, index) => ({ length: cellSize + CELL_GAP, offset: index * (cellSize + CELL_GAP), index })}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollOffset } } }],
                            { useNativeDriver: true },
                        )}
                        scrollEventThrottle={16}
                        contentContainerStyle={{ paddingRight: LABEL_BUFFER }}
                    />
                ) : (
                    <View className="flex-row" style={{ gap: CELL_GAP }}>
                        {weeks.map((week) => renderWeek({ item: week }))}
                    </View>
                )}
            </View>
            {needsScroll ? (
                <View
                    accessible
                    accessibilityRole="adjustable"
                    accessibilityLabel="Horizontal scroll area"
                    className="self-center rounded-full bg-muted"
                    style={{ width: SCROLL_TRACK_WIDTH, height: 4 }}
                >
                    <Animated.View
                        className="h-1 rounded-full bg-primary"
                        style={{
                            width: scrollThumbWidth,
                            transform: [{
                                translateX: scrollOffset.interpolate({
                                    inputRange: [0, Math.max(1, maxScrollX)],
                                    outputRange: [0, scrollThumbTravel],
                                    extrapolate: "clamp",
                                }),
                            }],
                        }}
                    />
                </View>
            ) : null}
            <View className="flex-row items-center justify-between gap-2">
                <AppText variant="caption" className="min-w-0 flex-1 text-[10px]" numberOfLines={1}>
                    {selectedValue
                        ? `${selectedValue.count} ${selectedValue.count === 1 ? "activity" : "activities"} on ${selectedDay}${formatStatusBreakdown(selectedValue.statusBreakdown)}${formatTypeBreakdown(selectedValue.typeCounts) ? ` · ${formatTypeBreakdown(selectedValue.typeCounts)}` : ""}`
                        : overallCount !== undefined
                            ? `Overall · ${overallCount} ${overallUnitLabel}`
                        : "-"}
                </AppText>
            </View>
        </View>
    );
}

type ActivityHeatmapDay = {
    date: Date;
    count: number;
    status?: ActivityHeatmapStatus;
    statusBreakdown?: Partial<Record<ActivityHeatmapStatus, number>>;
    typeCounts?: { lesson: number; bay: number };
};

type ActivityHeatmapWeek = {
    days: ActivityHeatmapDay[];
    monthLabel?: string;
};

const HeatmapWeekColumn = memo(function HeatmapWeekColumn({
    week,
    cellSize,
    todayKey,
    selectedDay,
    colors,
    onSelectDay,
}: {
    week: ActivityHeatmapWeek;
    cellSize: number;
    todayKey: string;
    selectedDay: string | null;
    colors: ThemeColors;
    onSelectDay: (dateKey: string, date: Date, count: number) => void;
}) {
    return (
        <View key={toDateKey(week.days[0].date)} style={{ width: cellSize, gap: CELL_GAP, marginRight: CELL_GAP }}>
            <View style={{ height: cellSize, position: "relative" }}>
                {week.monthLabel ? (
                    <AppText
                        variant="caption"
                        className="text-[9px]"
                        numberOfLines={1}
                        style={{ position: "absolute", left: 0, top: 0, width: 38, zIndex: 1 }}
                    >
                        {week.monthLabel}
                    </AppText>
                ) : null}
            </View>
            {week.days.map((day) => {
                const dateKey = toDateKey(day.date);
                const isToday = dateKey === todayKey;
                const isSelected = selectedDay === dateKey;

                return (
                    <Pressable
                        key={dateKey}
                        accessibilityRole="button"
                        accessibilityLabel={`${day.count} activities on ${dateKey}${isToday ? " (today)" : ""}`}
                        hitSlop={4}
                        style={{
                            width: cellSize,
                            height: cellSize,
                            borderRadius: CELL_RADIUS,
                            backgroundColor: getCellColor(day.count, colors, day.status),
                            borderWidth: isSelected || isToday ? 1.5 : 0,
                            borderColor: isSelected ? colors.foreground : colors.primary,
                        }}
                        onPress={() => onSelectDay(dateKey, day.date, day.count)}
                    />
                );
            })}
        </View>
    );
});

function buildWeeks(values: ActivityHeatmapValue[], endDate: Date, numDays: number) {
    const counts = new Map(values.map((value) => [toDateKey(value.date), value.count]));
    const statuses = new Map(values.map((value) => [toDateKey(value.date), value.status]));
    const statusBreakdowns = new Map(values.map((value) => [toDateKey(value.date), value.statusBreakdown]));
    const typeCounts = new Map(values.map((value) => [toDateKey(value.date), value.typeCounts]));
    const end = parseCalendarDate(endDate);
    const start = new Date(end); start.setDate(start.getDate() - (numDays - 1));
    const dayOfWeek = start.getDay(); // 0 = Sun ... 6 = Sat
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday); // rewind to that week's Monday
    const weeks: ActivityHeatmapWeek[] = [];
    for (let weekStart = new Date(start); weekStart <= end; weekStart.setDate(weekStart.getDate() + 7)) {
        const days = Array.from({ length: 7 }, (_, offset) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + offset);
            const key = toDateKey(date);
            return { date, count: counts.get(key) ?? 0, status: statuses.get(key), statusBreakdown: statusBreakdowns.get(key), typeCounts: typeCounts.get(key) };
        });
        weeks.push({ days, monthLabel: weekStart.getDate() <= 7 ? weekStart.toLocaleDateString(undefined, { month: "short" }) : undefined });
    }
    return weeks;
}

// 5-step scale: 0 = empty, 1-4 = increasing intensity, derived from the theme's primary color
// so it stays on-brand while still reading as a gradient like the Dribbble reference.
function getScaleColor(level: number, colors: ThemeColors) {
    if (level <= 0) return colors.muted;
    const opacities = ["33", "66", "99", "FF"];
    return `${colors.primary}${opacities[Math.min(level, 4) - 1]}`;
}

function getCellColor(count: number, colors: ThemeColors, status?: ActivityHeatmapStatus) {
    if (count <= 0) return getScaleColor(0, colors);

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
        default:
            return getScaleColor(Math.min(count, 4), colors);
    }
}

function formatStatusBreakdown(breakdown?: Partial<Record<ActivityHeatmapStatus, number>>) {
    if (!breakdown) return "";

    const labels: Record<ActivityHeatmapStatus, string> = {
        completed: "done",
        "no-show": "absent",
        cancelled: "cancelled",
        reserved: "booked",
        mixed: "mixed",
        unknown: "other",
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
        typeCounts.bay > 0 ? `${typeCounts.bay} bay` : null,
        typeCounts.lesson > 0 ? `${typeCounts.lesson} lesson` : null,
    ].filter(Boolean).join(" · ");

    return details;
}

function toDateKey(date: string | number | Date) {
    // Trust plain "YYYY-MM-DD" strings as-is — re-parsing them as a Date would
    // route through UTC and could shift the day depending on the caller's timezone.
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseCalendarDate(date: string | number | Date) {
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
        const [year, month, day] = date.slice(0, 10).split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    const parsed = new Date(date);
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}
