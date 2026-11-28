import { TZDate } from "@date-fns/tz";
import { isValid } from "date-fns/isValid";
import { parse } from "date-fns/parse";
import i18n from "@/i18n";
import { APP_TIME_ZONE, getAppTimeZoneDateParts, toValidDate } from "./timezone";

const NO_VALUE = "—";

type DatePreset = "medium" | "short" | "weekday" | "weekdayYear" | "dateTime" | "monthYear";

const DATE_PRESET_OPTIONS: Record<DatePreset, Intl.DateTimeFormatOptions> = {
    medium: { year: "numeric", month: "short", day: "numeric" },
    short: { month: "short", day: "numeric" },
    weekday: { weekday: "short", month: "short", day: "numeric" },
    weekdayYear: {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    },
    dateTime: {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    },
    monthYear: { year: "numeric", month: "long" },
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getCurrentLocale() {
    return i18n.resolvedLanguage ?? i18n.language;
}

function getCachedFormatter(key: string, options: Intl.DateTimeFormatOptions, locale = getCurrentLocale()) {
    const cacheKey = `${locale}:${key}`;
    let formatter = formatterCache.get(cacheKey);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat(locale, {
            timeZone: APP_TIME_ZONE,
            ...options,
        });
        formatterCache.set(cacheKey, formatter);
    }
    return formatter;
}

function getDateFormatter(preset: DatePreset, locale?: string) {
    return getCachedFormatter(`date:${preset}`, DATE_PRESET_OPTIONS[preset], locale);
}

function getTimeFormatter(locale?: string) {
    return getCachedFormatter(
        "time",
        {
            hour: "numeric",
            minute: "2-digit",
        },
        locale,
    );
}

function formatPreset(value: string | number | Date | null | undefined, preset: DatePreset, locale?: string) {
    const date = value == null || value === "" ? null : toValidDate(value);
    if (!date) return null;
    return getDateFormatter(preset, locale).format(date);
}

export const formatDateMedium = (value?: string | number | Date | null) => formatPreset(value, "medium") ?? NO_VALUE;

export const formatDateShort = (value?: string | number | Date | null) => formatPreset(value, "short") ?? NO_VALUE;

export const formatDateWeekday = (value?: string | number | Date | null) => formatPreset(value, "weekday") ?? NO_VALUE;

export const formatDateWeekdayYear = (value?: string | number | Date | null) =>
    formatPreset(value, "weekdayYear") ?? NO_VALUE;

export const formatDateTimeMedium = (value?: string | number | Date | null) =>
    formatPreset(value, "dateTime") ?? NO_VALUE;

export const formatMonthYear = (value?: string | number | Date | null, locale?: string) =>
    formatPreset(value, "monthYear", locale) ?? NO_VALUE;

/** App-timezone month key (`2026-11`) used for list section grouping. */
export const getMonthKey = (value?: string | number | Date | null) => {
    if (value == null || value === "") return null;
    const parts = getAppTimeZoneDateParts(value);
    return parts ? `${parts.year}-${parts.month}` : null;
};

// date-fns also accepts one-digit fields and punctuated English day periods.
const CLOCK_VALUE = /^\d{1,2}:\d{1,2}(?::\d{1,2})?(?:\s*[a-z.][a-z.\s]*)?$/i;

function parseClockValue(value: string) {
    const referenceDate = TZDate.tz(APP_TIME_ZONE);

    const patterns = ["HH:mm:ss", "HH:mm", "hh:mm a", "h:mm a"];

    for (const pattern of patterns) {
        const parsed = parse(value, pattern, referenceDate);
        if (isValid(parsed)) return parsed;
    }

    return null;
}

export const fmtDate = (value?: string | Date | null) => (value ? formatDateMedium(value) : NO_VALUE);

export const fmtTime = (value?: string | Date | null) => {
    if (!value) return NO_VALUE;

    const clock = typeof value === "string" ? value.trim() : "";
    const parsedClock = CLOCK_VALUE.test(clock) ? parseClockValue(clock) : null;
    const date = parsedClock ?? toValidDate(value);
    return date ? getTimeFormatter().format(date) : NO_VALUE;
};

export const formatTimeRange = (start?: string | Date | null, end?: string | Date | null) =>
    `${fmtTime(start)} - ${fmtTime(end)}`;

export const fmtDateTime = (value?: string | Date | null) => (value ? formatDateTimeMedium(value) : NO_VALUE);

export const formatDateForAPI = (date: Date | string | number): string => {
    const parts = getAppTimeZoneDateParts(date);

    if (!parts) return "";

    const { year, month, day } = parts;

    return `${year}-${month}-${day}`;
};

export const formatDateForDisplay = (date: Date | string | null): string => {
    if (!date) return "";

    const formatted = formatPreset(date, "medium");
    return formatted ?? "";
};
