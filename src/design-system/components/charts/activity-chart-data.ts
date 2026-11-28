import { colorWithOpacity } from "../../utils/color";
import type { ThemeColors } from "../../utils/theme";
import { getReservationStatusColor } from "../../../utils/status-tone";

export type ActivityHeatmapStatus =
    "completed" | "checked-in" | "no-show" | "cancelled" | "reserved" | "mixed" | "unknown";
export type ActivityHeatmapValue = {
    date: string | number | Date;
    count: number;
    status?: ActivityHeatmapStatus;
    statusBreakdown?: Partial<Record<ActivityHeatmapStatus, number>>;
    typeCounts?: { lesson: number; bay: number };
};
type ActivityHeatmapDay = Omit<ActivityHeatmapValue, "date"> & {
    date: Date;
    dateKey: string;
};
export type ActivityHeatmapWeek = {
    days: ActivityHeatmapDay[];
    monthLabel?: string;
};

export function toDateKey(date: string | number | Date) {
    // Date-only API values are local calendar dates, not UTC timestamps.
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parsed = new Date(date);
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

export function parseCalendarDate(date: string | number | Date) {
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
        const [year, month, day] = date.slice(0, 10).split("-").map(Number);
        return new Date(year, month - 1, day);
    }
    const parsed = new Date(date);
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

const activityDateFormatterCache = new Map<string, Intl.DateTimeFormat>();

export function formatActivityDate(dateKey: string, language: string) {
    const parsed = parseCalendarDate(dateKey);
    const cacheKey = `${language}|${parsed.getTimezoneOffset()}`;
    let formatter = activityDateFormatterCache.get(cacheKey);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat(language, {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
        activityDateFormatterCache.set(cacheKey, formatter);
    }
    return formatter.format(parsed);
}

export function buildHeatmapWeeks(
    valuesByDate: ReadonlyMap<string, ActivityHeatmapValue>,
    endDateKey: string,
    numDays: number,
    language: string,
): ActivityHeatmapWeek[] {
    if (!Number.isFinite(numDays) || numDays < 1) return [];
    const end = parseCalendarDate(endDateKey);
    if (!Number.isFinite(end.getTime())) return [];
    const start = new Date(end);
    start.setDate(start.getDate() - (Math.floor(numDays) - 1));
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const monthFormatter = new Intl.DateTimeFormat(language, { month: "short" });
    const weeks: ActivityHeatmapWeek[] = [];
    for (let weekStart = new Date(start); weekStart <= end; weekStart.setDate(weekStart.getDate() + 7)) {
        const days = Array.from({ length: 7 }, (_, offset) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + offset);
            const dateKey = toDateKey(date);
            const value = valuesByDate.get(dateKey);
            return {
                date,
                dateKey,
                count: value?.count ?? 0,
                status: value?.status,
                statusBreakdown: value?.statusBreakdown,
                typeCounts: value?.typeCounts,
            };
        });
        weeks.push({
            days,
            monthLabel: weekStart.getDate() <= 7 ? monthFormatter.format(weekStart) : undefined,
        });
    }
    return weeks;
}

export function getFocusMonthWeekIndex(weeks: ActivityHeatmapWeek[], endDateKey: string, todayKey: string) {
    const today = parseCalendarDate(todayKey);
    const year = parseCalendarDate(endDateKey).getFullYear();
    const month = year === today.getFullYear() ? today.getMonth() : 0;
    return Math.max(
        0,
        weeks.findIndex((week) =>
            week.days.some(({ date }) => date.getFullYear() === year && date.getMonth() === month),
        ),
    );
}

export function getHeatmapCellColor(count: number, colors: ThemeColors, status?: ActivityHeatmapStatus) {
    if (count <= 0) return colors.muted;
    if (status && status !== "unknown") return getActivityStatusColor(status, colors);
    const level = Math.min(4, Math.max(1, Math.floor(count)));
    return colorWithOpacity(colors.primary, level === 4 ? 1 : level / 5);
}

export function getActivityStatusColor(status: ActivityHeatmapStatus | undefined, colors: ThemeColors) {
    if (status === "mixed") return colors.warning;
    if (!status || status === "unknown") return colors.primary;
    return getReservationStatusColor(colors, status);
}
