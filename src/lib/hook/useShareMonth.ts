import { toDateKey, type ActivityHeatmapValue } from "@/design-system/components/charts/activity-chart-data";
import { getAppTimeZoneDateParts } from "@/utils/timezone";
import { useState } from "react";
import { useDayClock } from "./useMinuteClock";

type Params = {
    dailyValues: ActivityHeatmapValue[];
    availableYears: number[];
    selectedYear: number | "all";
};

type YearMonth = { year: number; month: number };

/** Month shown on the share card: the user's pick, else the latest month with activity. */
export function useShareMonth({ dailyValues, availableYears, selectedYear }: Params) {
    const [selection, setSelection] = useState<YearMonth | null>(null);
    const referenceTime = useDayClock();
    const today = getAppTimeZoneDateParts(referenceTime);
    const currentYear = Number(today?.year);
    const currentMonth = Number(today?.month) - 1;
    const latestMonthByYear = new Map<number, number>();
    let latestYear = 0;
    for (const day of dailyValues) {
        if (!(day.count > 0)) continue;
        const key = toDateKey(day.date);
        const year = Number(key.slice(0, 4));
        const month = Number(key.slice(5, 7)) - 1;
        latestYear = Math.max(latestYear, year);
        latestMonthByYear.set(year, Math.max(latestMonthByYear.get(year) ?? -1, month));
    }
    const years = [...new Set([currentYear, ...availableYears.filter((value) => value <= currentYear)])].sort(
        (a, b) => b - a,
    );
    const preferredYear = selectedYear === "all" ? latestYear || availableYears[0] || currentYear : selectedYear;
    const fallbackYear = years.includes(preferredYear) ? preferredYear : years[0];
    const fallbackMonth = latestMonthByYear.get(fallbackYear) ?? (fallbackYear === currentYear ? currentMonth : 11);
    const { year, month } =
        selection && years.includes(selection.year) ? selection : { year: fallbackYear, month: fallbackMonth };
    const yearIndex = years.indexOf(year);
    const previousYear = years[yearIndex + 1] ?? null;
    const nextYear = years[yearIndex - 1] ?? null;
    const previousMonth =
        month > 0 ? { year, month: month - 1 } : previousYear === null ? null : { year: previousYear, month: 11 };
    const nextMonth = month < 11 ? { year, month: month + 1 } : nextYear === null ? null : { year: nextYear, month: 0 };

    const select = (nextYear: number, nextMonth: number) => {
        if (years.includes(nextYear)) setSelection({ year: nextYear, month: nextMonth });
    };

    return { year, month, years, previousYear, nextYear, previousMonth, nextMonth, select };
}
