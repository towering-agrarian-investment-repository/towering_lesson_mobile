import { toDateKey, type ActivityHeatmapValue } from "@/design-system/components/charts/activity-chart-data";
import { useState } from "react";

type Params = {
    dailyValues: ActivityHeatmapValue[];
    availableYears: number[];
    selectedYear: number | "all";
};

type YearMonth = { year: number; month: number };

/** Month shown on the share card: the user's pick, else the latest month with activity. */
export function useShareMonth({ dailyValues, availableYears, selectedYear }: Params) {
    const [selection, setSelection] = useState<YearMonth | null>(null);
    const today = new Date();
    const currentYear = today.getFullYear();
    const keys = dailyValues.filter(day => day.count > 0).map(day => toDateKey(day.date));
    const latestYear = keys.reduce((latest, key) => Math.max(latest, Number(key.slice(0, 4))), 0);
    const years = [...new Set([
        currentYear,
        ...availableYears.filter(value => value <= currentYear),
    ])].sort((a, b) => b - a);
    const preferredYear = selectedYear === "all"
        ? latestYear || availableYears[0] || currentYear
        : selectedYear;
    const fallbackYear = years.includes(preferredYear) ? preferredYear : years[0];
    const months = keys.filter(key => Number(key.slice(0, 4)) === fallbackYear)
        .map(key => Number(key.slice(5, 7)) - 1);
    const fallbackMonth = months.length ? Math.max(...months)
        : fallbackYear === currentYear ? today.getMonth() : 11;
    const { year, month } = selection && years.includes(selection.year)
        ? selection : { year: fallbackYear, month: fallbackMonth };
    const yearIndex = years.indexOf(year);
    const previousYear = years[yearIndex + 1] ?? null;
    const nextYear = years[yearIndex - 1] ?? null;
    const previousMonth = month > 0 ? { year, month: month - 1 }
        : previousYear === null ? null : { year: previousYear, month: 11 };
    const nextMonth = month < 11 ? { year, month: month + 1 }
        : nextYear === null ? null : { year: nextYear, month: 0 };

    const select = (nextYear: number, nextMonth: number) => {
        if (years.includes(nextYear)) setSelection({ year: nextYear, month: nextMonth });
    };

    return { year, month, years, previousYear, nextYear, previousMonth, nextMonth, select };
}
