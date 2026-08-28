import { AppText, useTheme } from "@/design-system";
import type { ActivityHeatmapStatus, ActivityHeatmapValue } from "@/design-system/components/charts/activity-heatmap";
import { useState } from "react";
import { useWindowDimensions, View, type LayoutChangeEvent } from "react-native";

type ActivityShareChartsProps = {
    dailyValues: ActivityHeatmapValue[];
    startDate: Date;
    endDate: Date;
    numDays: number;
};

const CELL_GAP = 4;
const MIN_WEEKS = 8;

export function ActivityShareCharts({ dailyValues, startDate, endDate, numDays }: ActivityShareChartsProps) {
    const { colors } = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    const [measuredWidth, setMeasuredWidth] = useState(0);
    const chartWidth = measuredWidth || Math.max(180, screenWidth - 96);
    const gridWidth = chartWidth;
    const weeks = padWeeks(buildWeeks(dailyValues, startDate, endDate, numDays), MIN_WEEKS);
    const cellGap = Math.max(1, Math.min(CELL_GAP, Math.floor(gridWidth / Math.max(1, weeks.length * 10))));
    const cellSize = Math.max(3, Math.min(32, Math.floor((gridWidth - Math.max(0, weeks.length - 1) * cellGap) / Math.max(1, weeks.length))));
    const monthLabels = getMonthLabels(weeks);

    return (
        <View className="gap-5" onLayout={(event: LayoutChangeEvent) => setMeasuredWidth(event.nativeEvent.layout.width)}>
            <View className="gap-2">
                <View className="flex-row justify-between" style={{ gap: cellGap }}>
                    {weeks.map((week, weekIndex) => (
                        <View key={weekIndex} style={{ gap: cellGap }}>
                                {week.map((day) => (
                                    <View key={day.date} style={{ width: cellSize, height: cellSize, alignItems: "center", justifyContent: "center", borderRadius: cellSize / 3, backgroundColor: getDayColor(day, colors) }}>
                                    {cellSize >= 14 ? (
                                        <AppText
                                            variant="caption"
                                            style={{ fontSize: Math.max(6, Math.floor(cellSize * 0.32)), lineHeight: Math.max(7, Math.floor(cellSize * 0.38)), color: day.count === 0 ? colors.mutedForeground : colors.primaryForeground }}
                                            >
                                                {Number(day.date.slice(8))}
                                            </AppText>
                                        ) : null}
                                    </View>
                                ))}
                        </View>
                    ))}
                </View>
                <View className="flex-row justify-between">
                    {monthLabels.map((label) => <AppText key={label} variant="caption" className="text-[9px]">{label}</AppText>)}
                </View>
            </View>
        </View>
    );
}

type ShareDay = { date: string; count: number; status?: ActivityHeatmapStatus };

function buildWeeks(values: ActivityHeatmapValue[], startDate: Date, endDate: Date, numDays: number) {
    const counts = new Map(values.map((value) => [toDateKey(value.date), value]));
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    if (numDays < 1) start.setTime(end.getTime());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const weeks: ShareDay[][] = [];
    for (let weekStart = new Date(start); weekStart <= end; weekStart.setDate(weekStart.getDate() + 7)) {
        weeks.push(Array.from({ length: 7 }, (_, offset) => { const date = new Date(weekStart); date.setDate(date.getDate() + offset); const key = toDateKey(date); const value = counts.get(key); return { date: key, count: value?.count ?? 0, status: value?.status }; }));
    }
    return weeks;
}

function padWeeks(weeks: ShareDay[][], minimumWeeks: number) {
    if (weeks.length >= minimumWeeks) return weeks;

    const before = Math.floor((minimumWeeks - weeks.length) / 2);
    const after = minimumWeeks - weeks.length - before;
    const firstDate = new Date(`${weeks[0][0].date}T00:00:00`);
    const lastDate = new Date(`${weeks[weeks.length - 1][0].date}T00:00:00`);
    const emptyWeek = (weekStart: Date) => Array.from({ length: 7 }, (_, offset) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + offset);
        return { date: toDateKey(date), count: 0 };
    });

    const leadingWeeks = Array.from({ length: before }, (_, index) => {
        const weekStart = new Date(firstDate);
        weekStart.setDate(firstDate.getDate() - (before - index) * 7);
        return emptyWeek(weekStart);
    });
    const trailingWeeks = Array.from({ length: after }, (_, index) => {
        const weekStart = new Date(lastDate);
        weekStart.setDate(lastDate.getDate() + (index + 1) * 7);
        return emptyWeek(weekStart);
    });

    return [...leadingWeeks, ...weeks, ...trailingWeeks];
}

function getMonthLabels(weeks: ShareDay[][]) {
    const labels: string[] = [];
    for (const week of weeks) { const month = new Date(`${week[0].date}T00:00:00`).toLocaleDateString(undefined, { month: "short" }); if (labels[labels.length - 1] !== month) labels.push(month); }
    const selected = labels.length > 1 ? [labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]] : labels;
    return selected.filter((label, index) => selected.indexOf(label) === index);
}

function getDayColor(day: ShareDay, colors: ReturnType<typeof useTheme>["colors"]) { return day.count === 0 ? colors.muted : getStatusColor(day.status, colors); }
function getStatusColor(status: ActivityHeatmapStatus | undefined, colors: ReturnType<typeof useTheme>["colors"]) { switch (status) { case "completed": return colors.success; case "no-show": return colors.danger; case "cancelled": return colors.mutedForeground; case "reserved": return colors.ticketPrivate; case "mixed": return colors.warning; default: return colors.primary; } }
function toDateKey(date: string | number | Date) { if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date; const parsed = new Date(date); return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`; }
