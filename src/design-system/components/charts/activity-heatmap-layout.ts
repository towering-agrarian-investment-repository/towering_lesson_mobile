import { typography } from "../../utils/typography";

export const HEATMAP_CELL_GAP = 4;
export const HEATMAP_CELL_RADIUS = 7;

const MIN_CELL = 20;
const MAX_CELL = 36;
const LABEL_COL_WIDTH = 24;
const MONTH_LABEL_HEIGHT = 24;

export function getActivityHeatmapLayout(
    containerWidth: number,
    deviceFontScale: number,
    language: string,
) {
    const axisFontSize = typography.subtext.fontSize * deviceFontScale;
    const labelColumnWidth = Math.max(
        LABEL_COL_WIDTH,
        axisFontSize * (
            language === "km" ? 5 : language === "zh" ? 2.5 : language === "en" ? 3 : 1.5
        ),
    );
    const monthLabelHeight = Math.max(MONTH_LABEL_HEIGHT, axisFontSize * 1.4);
    const availableWidth = Math.max(0, containerWidth - labelColumnWidth - HEATMAP_CELL_GAP);
    const cellSize = Math.max(
        MIN_CELL,
        Math.min(MAX_CELL, (availableWidth - 11 * HEATMAP_CELL_GAP) / 12),
    );

    return { axisFontSize, labelColumnWidth, monthLabelHeight, availableWidth, cellSize };
}
