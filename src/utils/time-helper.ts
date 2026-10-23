import { format, isMatch, isValid, parse } from "date-fns";
import i18n from "@/i18n";
import { getDateLocale } from "./date-locale";
import { getAppTimeZoneDateParts, toAppTimeZoneDate } from "./timezone";

const NO_VALUE = "—";

function coerceAppDate(value?: string | number | Date | null) {
    if (value === null || value === undefined || value === "") return null;
    return toAppTimeZoneDate(value);
}

function formatAppDate(
    value: string | number | Date,
    pattern: string,
) {
    const date = coerceAppDate(value);

    if (!date || !isValid(date)) return null;

    return format(date, pattern, { locale: getDateLocale(i18n.resolvedLanguage ?? i18n.language) });
}

export const formatDateValue = (
    value: string | number | Date | null | undefined,
    pattern: string,
) => {
    if (value === null || value === undefined || value === "") return NO_VALUE;

    return formatAppDate(value, pattern) ?? NO_VALUE;
};

function parseClockValue(value: string) {
    const trimmed = value.trim();

    const patterns = ["HH:mm:ss", "HH:mm", "hh:mm a", "h:mm a"];

    for (const pattern of patterns) {
        if (isMatch(trimmed, pattern)) {
            const parsed = parse(trimmed, pattern, new Date());

            if (isValid(parsed)) return parsed;
        }
    }

    return null;
}

export const fmtDate = (value?: string | Date | null) =>
    value ? formatAppDate(value, "MMM d, yyyy") ?? NO_VALUE : NO_VALUE;

export const fmtTime = (value?: string | Date | null) => {
    if (!value) return NO_VALUE;

    if (typeof value === "string") {
        const parsedClock = parseClockValue(value);

        if (parsedClock) {
            return format(parsedClock, "h:mm a", { locale: getDateLocale(i18n.resolvedLanguage ?? i18n.language) });
        }
    }

    return formatAppDate(value, "h:mm a") ?? NO_VALUE;
};

export const formatTimeRange = (
    start?: string | Date | null,
    end?: string | Date | null,
) => `${fmtTime(start)} - ${fmtTime(end)}`;

export const fmtDateTime = (value?: string | Date | null) =>
    value ? formatAppDate(value, "MMM d, yyyy • h:mm a") ?? NO_VALUE : NO_VALUE;

export const formatDateForAPI = (date: Date | string): string => {
    const parts = getAppTimeZoneDateParts(date);

    if (!parts) return "";

    const { year, month, day } = parts;

    return `${year}-${month}-${day}`;
};

export const formatDateForDisplay = (date: Date | string | null): string => {
    if (!date) return "";

    const parts = getAppTimeZoneDateParts(date);

    if (!parts) return "";

    const { year, month, day } = parts;

    return `${year}.${month}.${day}`;
};

