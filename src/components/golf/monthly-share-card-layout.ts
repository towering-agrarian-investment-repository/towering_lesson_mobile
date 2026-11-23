import { colorWithOpacity } from "@/design-system/utils/color";
import { type ThemeColors } from "@/design-system/utils/theme";
import layout from "../../../assets/HappyGolf_ShareCard_V4/spec/layout_v4.json";

/** Coordinates are measured in the V4 poster's source space. */
export const SHARE_CARD_WIDTH = layout.sourceImage.width;
export const SHARE_CARD_HEIGHT = layout.sourceImage.height;
export const SHARE_CARD_EXPORT_WIDTH = layout.exportSize.width;
export const SHARE_CARD_EXPORT_HEIGHT = layout.exportSize.height;
export const SHARE_CARD_CORNER_RADIUS = 36;

export type ShareCardTheme = "midnight" | "club" | "daylight" | "minimal";

export const SHARE_CARD_THEMES: readonly ShareCardTheme[] = [
    "midnight",
    "club",
    "daylight",
    "minimal",
];

type ShareCardThemePalette = {
    isDark: boolean;
    showContours: boolean;
    canvas: string;
    ink: string;
    mutedInk: string;
    heroAccent: string;
    divider: string;
    contourColor: string;
    spotlightColor: string | null;
    cellBg: string;
    satBg: string;
    satText: string;
    sunBg: string;
    sunText: string;
    miniCardBg: string;
    logoColor: string;
    avatarBg: string;
    avatarGlyph: string;
    gradient: readonly [string, string, string] | null;
    swatchPrimary: string;
    swatchAccent: string;
};

export function getShareCardThemePalette(
    theme: ShareCardTheme,
    colors: ThemeColors,
): ShareCardThemePalette {
    switch (theme) {
        case "midnight":
            return {
                isDark: true,
                showContours: true,
                canvas: "#090D14",
                ink: "#F8FAFC",
                mutedInk: "#94A3B8",
                heroAccent: colors.primary,
                divider: "rgba(255, 255, 255, 0.10)",
                contourColor: colorWithOpacity(colors.primary, 0.16),
                spotlightColor: colorWithOpacity(colors.primary, 0.24),
                cellBg: "rgba(255, 255, 255, 0.06)",
                satBg: colorWithOpacity(colors.primary, 0.14),
                satText: colors.primary,
                sunBg: colorWithOpacity(colors.danger, 0.14),
                sunText: colors.danger,
                miniCardBg: "rgba(255, 255, 255, 0.045)",
                logoColor: colors.primary,
                avatarBg: colors.primary,
                avatarGlyph: "#FFFFFF",
                gradient: ["#0D1420", "#090D14", "#0C121D"],
                swatchPrimary: "#090D14",
                swatchAccent: colors.primary,
            };
        case "club":
            return {
                isDark: true,
                showContours: true,
                canvas: "#072118",
                ink: "#F8FAFC",
                mutedInk: "#96BFAE",
                heroAccent: "#F5C857",
                divider: "rgba(245, 200, 87, 0.18)",
                contourColor: "rgba(245, 200, 87, 0.15)",
                spotlightColor: "rgba(245, 200, 87, 0.18)",
                cellBg: "rgba(255, 255, 255, 0.07)",
                satBg: "rgba(125, 211, 252, 0.14)",
                satText: "#7DD3FC",
                sunBg: "rgba(252, 165, 165, 0.14)",
                sunText: "#FCA5A5",
                miniCardBg: "rgba(255, 255, 255, 0.055)",
                logoColor: "#F5C857",
                avatarBg: "#124737",
                avatarGlyph: "#F5C857",
                gradient: ["#0E3A2B", "#072118", "#0A2A1F"],
                swatchPrimary: "#072118",
                swatchAccent: "#F5C857",
            };
        case "minimal":
            return {
                isDark: false,
                showContours: false,
                canvas: "#F7F7F5",
                ink: "#0F172A",
                mutedInk: "#64748B",
                heroAccent: "#0F172A",
                divider: "#E2E8F0",
                contourColor: "transparent",
                spotlightColor: null,
                cellBg: "#EBECE8",
                satBg: "#E6EEF8",
                satText: "#334155",
                sunBg: "#F7EAEB",
                sunText: "#9F1239",
                miniCardBg: "#EFEFED",
                logoColor: "#0F172A",
                avatarBg: "#0F172A",
                avatarGlyph: "#FFFFFF",
                gradient: null,
                swatchPrimary: "#F7F7F5",
                swatchAccent: "#0F172A",
            };
        case "daylight":
        default:
            return {
                isDark: false,
                showContours: true,
                canvas: "#FAFBF9",
                ink: "#0F172A",
                mutedInk: "#64748B",
                heroAccent: colors.primary,
                divider: "#E5E7EB",
                contourColor: colorWithOpacity(colors.primary, 0.16),
                spotlightColor: colorWithOpacity(colors.primary, 0.14),
                cellBg: "#EFF1EE",
                satBg: colorWithOpacity(colors.primary, 0.10),
                satText: "#0369A1",
                sunBg: "#FDEAF0",
                sunText: "#DC2626",
                miniCardBg: "#F2F4F2",
                logoColor: colors.primary,
                avatarBg: colors.primary,
                avatarGlyph: "#FFFFFF",
                gradient: null,
                swatchPrimary: "#FAFBF9",
                swatchAccent: colors.primary,
            };
    }
}

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
