import layout from "../../../assets/HappyGolf_ShareCard_V4/spec/layout_v4.json";

/** Coordinates are measured in the V4 poster's source space. */
export const SHARE_CARD_WIDTH = layout.sourceImage.width;
export const SHARE_CARD_HEIGHT = layout.sourceImage.height;
export const SHARE_CARD_EXPORT_WIDTH = layout.exportSize.width;
export const SHARE_CARD_EXPORT_HEIGHT = layout.exportSize.height;
export const SHARE_CARD_CORNER_RADIUS = 36;

export function getShareCardLocale(locale?: string) {
    try {
        return Intl.DateTimeFormat.supportedLocalesOf(locale || "en")[0] || "en";
    } catch {
        return "en";
    }
}

export function usesLatinShareCardText(locale: string) {
    return /^en(-|$)/i.test(locale);
}

export function formatShareCardMonth(year: number, month: number, locale: string) {
    return new Intl.DateTimeFormat(getShareCardLocale(locale), {
        month: "long", year: "numeric", calendar: "gregory", timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month, 1)));
}

export function getShareCardCalendar(year: number, month: number, locale: string) {
    const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
    const dayCount = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const rows = Math.max(5, Math.ceil((offset + dayCount) / 7));
    const safeLocale = getShareCardLocale(locale);
    const weekdayFormatter = new Intl.DateTimeFormat(safeLocale, {
        weekday: /^(zh|ja|ko)/i.test(safeLocale) ? "narrow" : "short",
        timeZone: "UTC", calendar: "gregory",
    });
    const numberFormatter = new Intl.NumberFormat(safeLocale);
    const grid = layout.components.calendarGrid;
    // Six-week months keep the footer at its measured position.
    const cellHeight = rows === 6 ? 88 : grid.cellH;
    const rowStride = rows === 6 ? 92 : grid.rowStride;

    return {
        rows,
        weekdays: Array.from({ length: 7 }, (_, column) =>
            weekdayFormatter.format(new Date(Date.UTC(2024, 0, column + 1)))),
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
