import { toDateKey, type ActivityHeatmapValue } from "@/design-system/components/charts/activity-chart-data";
import { useCallback, useMemo, useState } from "react";

type Params = {
    dailyValues: ActivityHeatmapValue[];
    availableYears: number[];
    selectedYear: number | "all";
};

type YearMonth = { year: number; month: number };

/** Month shown on the share card: the user's pick, else the latest month with activity. */
export function useShareMonth({ dailyValues, availableYears, selectedYear }: Params) {
    const [selection, setSelection] = useState<YearMonth | null>(null);

    const fallback = useMemo<YearMonth>(() => {
        const today = new Date();
        const keys = dailyValues.filter(day => day.count > 0).map(day => toDateKey(day.date));
        const latestYear = keys.reduce((latest, key) => Math.max(latest, Number(key.slice(0, 4))), 0);
        const year = selectedYear === "all"
            ? latestYear || availableYears[0] || today.getFullYear()
            : selectedYear;
        const months = keys
            .filter(key => Number(key.slice(0, 4)) === year)
            .map(key => Number(key.slice(5, 7)) - 1);
        const month = months.length
            ? Math.max(...months)
            : year === today.getFullYear() ? today.getMonth() : 11;
        return { year, month };
    }, [dailyValues, availableYears, selectedYear]);

    const { year, month } = selection ?? fallback;

    const years = useMemo(() => [...new Set([
        ...availableYears,
        ...Array.from({ length: 7 }, (_, index) => year + 1 - index),
    ])].sort((a, b) => b - a), [availableYears, year]);

    const select = useCallback((nextYear: number, nextMonth: number) => {
        setSelection({ year: nextYear, month: nextMonth });
    }, []);

    const step = useCallback((delta: number) => {
        const next = new Date(Date.UTC(year, month + delta, 1));
        setSelection({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
    }, [year, month]);

    return { year, month, years, select, step };
}