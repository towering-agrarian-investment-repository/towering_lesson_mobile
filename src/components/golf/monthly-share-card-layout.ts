import layout from "../../../assets/HappyGolf_ShareCard_V4/spec/layout_v4.json";

/** Coordinates are measured in the V4 poster's source space. */
export const SHARE_CARD_WIDTH = layout.sourceImage.width;
export const SHARE_CARD_HEIGHT = layout.sourceImage.height;
export const SHARE_CARD_EXPORT_WIDTH = layout.exportSize.width;
export const SHARE_CARD_EXPORT_HEIGHT = layout.exportSize.height;
export const SHARE_CARD_CORNER_RADIUS = 36;

const localeCache = new Map<string, string>();
const shareCardFormattersCache = new Map<
    string,
    {
        monthFormatter: Intl.DateTimeFormat;
        numberFormatter: Intl.NumberFormat;
        hoursFormatter: Intl.NumberFormat;
        weekdays: string[];
    }
>();

export function getShareCardLocale(locale?: string) {
    const key = locale || "en";
    const cached = localeCache.get(key);
    if (cached !== undefined) {
        return cached;
    }
    let resolved = "en";
    try {
        resolved = Intl.DateTimeFormat.supportedLocalesOf(key)[0] || "en";
    } catch {
        resolved = "en";
    }
    localeCache.set(key, resolved);
    return resolved;
}

function getShareCardFormatters(locale?: string) {
    const safeLocale = getShareCardLocale(locale);
    let cached = shareCardFormattersCache.get(safeLocale);
    if (!cached) {
        const weekdayFormatter = new Intl.DateTimeFormat(safeLocale, {
            weekday: /^(zh|ja|ko)/i.test(safeLocale) ? "narrow" : "short",
            timeZone: "UTC",
            calendar: "gregory",
        });
        cached = {
            monthFormatter: new Intl.DateTimeFormat(safeLocale, {
                month: "long",
                year: "numeric",
                calendar: "gregory",
                timeZone: "UTC",
            }),
            numberFormatter: new Intl.NumberFormat(safeLocale),
            hoursFormatter: new Intl.NumberFormat(safeLocale, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
            }),
            weekdays: Array.from({ length: 7 }, (_, column) =>
                weekdayFormatter.format(new Date(Date.UTC(2024, 0, column + 1))),
            ),
        };
        shareCardFormattersCache.set(safeLocale, cached);
    }
    return cached;
}

export function usesLatinShareCardText(locale: string) {
    return /^en(-|$)/i.test(locale);
}

export function formatShareCardCount(value: number, locale: string) {
    return getShareCardFormatters(locale).numberFormatter.format(value);
}

export function formatShareCardHours(value: number, locale: string) {
    return getShareCardFormatters(locale).hoursFormatter.format(value);
}

export function formatShareCardMonth(year: number, month: number, locale: string) {
    return getShareCardFormatters(locale).monthFormatter.format(new Date(Date.UTC(year, month, 1)));
}

export function getShareCardCalendar(year: number, month: number, locale: string) {
    const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
    const dayCount = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const rows = Math.max(5, Math.ceil((offset + dayCount) / 7));
    const { numberFormatter, weekdays } = getShareCardFormatters(locale);
    const grid = layout.components.calendarGrid;
    // Six-week months keep the footer at its measured position.
    const cellHeight = rows === 6 ? 88 : grid.cellH;
    const rowStride = rows === 6 ? 92 : grid.rowStride;

    return {
        rows,
        weekdays,
        cells: Array.from({ length: rows * 7 }, (_, index) => {
            const day = index - offset + 1;
            const inMonth = day >= 1 && day <= dayCount;
            return {
                dateKey: inMonth
                    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    : null,
                label: inMonth ? numberFormatter.format(day) : "",
                inMonth,
                column: index % 7,
                x: grid.x + (index % 7) * grid.columnStride,
                y: grid.y + Math.floor(index / 7) * rowStride,
                width: grid.cellW,
                height: cellHeight,
            };
        }),
    };
}
