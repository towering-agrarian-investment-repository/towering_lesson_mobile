import type { TFunction } from "i18next";
import { colorWithOpacity } from "../../utils/color";
import type { ThemeColors } from "../../utils/theme";

export type ActivityHeatmapStatus =
    "completed" | "no-show" | "cancelled" | "reserved" | "mixed" | "unknown";
export type ActivityHeatmapValue = {
    date: string | number | Date;
    count: number;
    status?: ActivityHeatmapStatus;
    statusBreakdown?: Partial<Record<ActivityHeatmapStatus, number>>;
    typeCounts?: { lesson: number; bay: number };
};
export type ActivityHeatmapDay = Omit<ActivityHeatmapValue, "date"> & {
    date: Date;
    dateKey: string;
};
export type ActivityHeatmapWeek = {
    days: ActivityHeatmapDay[];
    monthLabel?: string;
};

export type WeeklySummaryValue = {
    weekStart: string | number | Date;
    total: number;
    status?: ActivityHeatmapStatus;
    statusBreakdown?: Partial<Record<ActivityHeatmapStatus, number>>;
    typeCounts?: { lesson: number; bay: number };
};
export type WeeklyWeek = Omit<WeeklySummaryValue, "weekStart"> & {
    weekStart: Date;
    label: string;
};

export function getWeekStart(value: string | number | Date) {
    const date = parseCalendarDate(value);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return date;
}

export function buildWeekSummaries(
    values: WeeklySummaryValue[], startDate: Date | undefined,
    endDate: Date, numWeeks: number, language: string,
): WeeklyWeek[] {
    const end = getWeekStart(endDate);
    if (!Number.isFinite(end.getTime())) return [];
    if (!startDate && (!Number.isFinite(numWeeks) || numWeeks < 1)) return [];
    const start = startDate ? getWeekStart(startDate) : new Date(end);
    if (!startDate) start.setDate(start.getDate() - (Math.floor(numWeeks) - 1) * 7);
    if (!Number.isFinite(start.getTime()) || start > end) return [];
    const totals = new Map(values.map(value => [toDateKey(getWeekStart(value.weekStart)), value]));
    const formatter = new Intl.DateTimeFormat(language, { month: "short", day: "numeric" });
    const weeks: WeeklyWeek[] = [];
    // Calendar increments preserve the final week across daylight-saving changes.
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 7)) {
        const weekStart = new Date(cursor);
        const value = totals.get(toDateKey(weekStart));
        weeks.push({ ...value, weekStart, total: value?.total ?? 0, label: formatter.format(weekStart) });
    }
    return weeks;
}

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

export function formatActivityDate(dateKey: string, language: string) {
    return parseCalendarDate(dateKey).toLocaleDateString(language, {
        year: "numeric", month: "short", day: "numeric",
    });
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

export function getFocusMonthWeekIndex(
    weeks: ActivityHeatmapWeek[], endDateKey: string, todayKey: string,
) {
    const today = parseCalendarDate(todayKey);
    const year = parseCalendarDate(endDateKey).getFullYear();
    const month = year === today.getFullYear() ? today.getMonth() : 0;
    return Math.max(0, weeks.findIndex((week) => week.days.some(
        ({ date }) => date.getFullYear() === year && date.getMonth() === month,
    )));
}

export function getHeatmapCellColor(count: number, colors: ThemeColors, status?: ActivityHeatmapStatus) {
    if (count <= 0) return colors.muted;
    switch (status) {
        case "completed": return colors.success;
        case "no-show": return colors.danger;
        case "cancelled": return colors.mutedForeground;
        case "reserved": return colors.ticketPrivate;
        case "mixed": return colors.warning;
        default: {
            const level = Math.min(4, Math.max(1, Math.floor(count)));
            return colorWithOpacity(colors.primary, level === 4 ? 1 : level / 5);
        }
    }
}

export function formatStatusBreakdown(
    breakdown: Partial<Record<ActivityHeatmapStatus, number>> | undefined,
    t: TFunction,
) {
    if (!breakdown) return "";
    const labels: Record<ActivityHeatmapStatus, string> = {
        completed: t("activity.completed"),
        "no-show": t("activity.absent"),
        cancelled: t("activity.cancelled"),
        reserved: t("activity.booked"),
        mixed: t("activity.mixed"),
        unknown: t("activity.other"),
    };
    const details = Object.entries(breakdown)
        .filter(([, count]) => count && count > 0)
        .map(([status, count]) => `${count} ${labels[status as ActivityHeatmapStatus]}`)
        .join(" · ");
    return details ? ` · ${details}` : "";
}

export function formatTypeBreakdown(typeCounts: { lesson: number; bay: number } | undefined, t: TFunction) {
    if (!typeCounts) return "";
    return [
        typeCounts.bay > 0 ? `${typeCounts.bay} ${t("activity.bay")}` : null,
        typeCounts.lesson > 0 ? `${typeCounts.lesson} ${t("activity.lesson")}` : null,
    ].filter(Boolean).join(" · ");
}
