import { TZDate, tz } from "@date-fns/tz";

export const APP_TIME_ZONE = "Asia/Phnom_Penh";
export const APP_TZ = tz(APP_TIME_ZONE);

function toValidDate(value: string | number | Date): Date | null {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function toAppTimeZoneDate(value: string | number | Date): TZDate | null {
    const date = toValidDate(value);
    if (!date) return null;

    return TZDate.tz(APP_TIME_ZONE, date);
}

export function getAppTimeZoneDateParts(
    value: string | number | Date,
): { year: string; month: string; day: string } | null {
    const date = toAppTimeZoneDate(value);
    if (!date) return null;

    return {
        year: String(date.getFullYear()),
        month: String(date.getMonth() + 1).padStart(2, "0"),
        day: String(date.getDate()).padStart(2, "0"),
    };
}
