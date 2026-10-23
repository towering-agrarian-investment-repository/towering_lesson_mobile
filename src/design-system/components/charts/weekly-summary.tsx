import { AppText } from "../AppText";
import { memo, useCallback, useMemo, useState } from "react";
import {
    FlatList,
    Pressable,
    Text as RNText,
    View,
    type LayoutChangeEvent,
    type ViewProps,
} from "react-native";
import { cn } from "../../utils/cn";
import { useTheme } from "../../utils/theme";
import { typography } from "../../utils/typography";

import { buildWeekSummaries, getActivityStatusColor, getWeekStart, toDateKey as weekKey, parseCalendarDate, formatStatusBreakdown, formatTypeBreakdown, type WeeklySummaryValue, type WeeklyWeek } from "./activity-chart-data";
import { useTranslation } from "react-i18next";
import { ActivityStatusLegend, type ActivityHeatmapStatus } from "./activity-heatmap";

export type { WeeklySummaryValue } from "./activity-chart-data";

type WeeklySummaryProps = Omit<ViewProps, "children"> & {
    values: WeeklySummaryValue[];
    startDate?: Date;
    endDate?: Date;
    numWeeks?: number;
    initialScrollToEnd?: boolean;
    overallCount?: number;
    title?: string;
    unitLabel?: string; // e.g. "activities", "min"
    className?: string;
    onWeekPress?: (weekStart: Date, total: number) => void;
};

const BAR_GAP = 8;
const BAR_WIDTH_DEFAULT = 48;
const BAR_WIDTH_MIN = 48;
const BAR_WIDTH_MAX = 72;
const MIN_BAR_HEIGHT = 3
const Y_AXIS_WIDTH = 32;
const CHART_GAP = 8;

export function WeeklySummary({
    values,
    startDate,
    endDate,
    numWeeks = 12,
    initialScrollToEnd = false,
    overallCount,
    title,
    unitLabel = "activities",
    className,
    onWeekPress,
    onLayout,
    ...props
}: WeeklySummaryProps) {
    const {
        t,
        i18n: { language },
    } = useTranslation();
    const { colors } = useTheme();
    const [containerWidth, setContainerWidth] = useState(0);
    const startDateKey = startDate ? weekKey(startDate) : "";
    const endDateKey = weekKey(endDate ?? new Date());
    const weeks = useMemo(
        () =>
            buildWeekSummaries(
                values,
                startDateKey ? parseCalendarDate(startDateKey) : undefined,
                parseCalendarDate(endDateKey),
                numWeeks,
                language,
            ),
        [values, startDateKey, endDateKey, numWeeks, language],
    );
    const dateFormatter = useMemo(() => new Intl.DateTimeFormat(language, {
        year: "numeric", month: "short", day: "numeric",
    }), [language]);
    const maxTotal = Math.max(2, Math.ceil(Math.max(0, ...weeks.map((w) => w.total)) / 2) * 2);
    const hasData = weeks.some((week) => week.total > 0);
    const rangeKey = weeks.length
        ? `${weekKey(weeks[0].weekStart)}-${weekKey(weeks[weeks.length - 1].weekStart)}`
        : "empty";

    const currentWeekKey = weekKey(getWeekStart(new Date()));
    const [selection, setSelection] = useState<{
        rangeKey: string;
        weekKey: string;
    } | null>(null);
    const selectedWeek =
        selection?.rangeKey === rangeKey ? selection.weekKey : null;
    const selectedSummary = weeks.find(
        (w) => weekKey(w.weekStart) === selectedWeek,
    );

    const chartViewportWidth = Math.max(
        0,
        containerWidth - Y_AXIS_WIDTH - CHART_GAP,
    );
    const barWidth =
        chartViewportWidth > 0
            ? Math.min(
                BAR_WIDTH_MAX,
                Math.max(BAR_WIDTH_MIN, Math.floor(chartViewportWidth / 5) - BAR_GAP),
            )
            : BAR_WIDTH_DEFAULT;
    const gridWidth = weeks.length * (barWidth + BAR_GAP);
    const plotHeight = Math.max(184, Math.min(256, Math.round(containerWidth * 0.45)));
    const needsScroll =
        chartViewportWidth > 0 && gridWidth > chartViewportWidth;
    const visibleBars = Math.max(1, Math.ceil(chartViewportWidth / (barWidth + BAR_GAP)) + 1);

    const handleLayout = (event: LayoutChangeEvent) => {
        setContainerWidth(event.nativeEvent.layout.width);
        onLayout?.(event);
    };

    const handleBarPress = useCallback(
        (weekStart: Date, total: number, key: string) => {
            setSelection({ rangeKey, weekKey: key });
            onWeekPress?.(weekStart, total);
        },
        [onWeekPress, rangeKey],
    );

    const renderBar = useCallback(
        ({ item: week }: { item: WeeklyWeek }) => (
            <WeeklyBar
                week={week}
                barWidth={barWidth}
                plotHeight={plotHeight}
                maxTotal={maxTotal}
                currentWeekKey={currentWeekKey}
                isSelected={weekKey(week.weekStart) === selectedWeek}
                isDimmed={selectedWeek !== null && weekKey(week.weekStart) !== selectedWeek}
                accessibilityLabel={`${week.total} ${unitLabel} · ${t("activity.weekOf", { date: dateFormatter.format(week.weekStart) })}${weekKey(week.weekStart) === currentWeekKey ? ` (${t("activity.currentWeek")})` : ""}`}
                colors={colors}
                onPress={handleBarPress}
            />
        ),
        [
            barWidth,
            plotHeight,
            colors,
            dateFormatter,
            currentWeekKey,
            handleBarPress,
            maxTotal,
            selectedWeek,
            unitLabel,
            t,
        ],
    );

    return (
        <View
            className={cn("w-full gap-3", className)}
            onLayout={handleLayout}
            {...props}
        >
            {title ? (
                <AppText variant="h3">{title}</AppText>
            ) : null}
            {containerWidth === 0 ? null : (
                <View className="flex-row" style={{ gap: CHART_GAP }}>
                    {[0, 0.5, 1].map((position) => (
                        <View
                            key={position}
                            pointerEvents="none"
                            className="absolute border-b border-border"
                            style={{
                                left: Y_AXIS_WIDTH + CHART_GAP,
                                right: 0,
                                top: position * plotHeight,
                            }}
                        />
                    ))}
                    <View
                        style={{ width: Y_AXIS_WIDTH, height: plotHeight }}
                    >
                        <AppText variant="subtext" color="mutedForeground" wrap={false} style={{ position: "absolute", top: -6 }}>
                            {String(maxTotal ?? "")}
                        </AppText>
                        <AppText variant="subtext" color="mutedForeground" wrap={false} style={{ position: "absolute", top: plotHeight / 2 - 6 }}>
                            {String(Math.ceil(maxTotal / 2) ?? "")}
                        </AppText>
                        <AppText variant="subtext" color="mutedForeground" wrap={false} style={{ position: "absolute", bottom: 0 }}>
                            {"0"}
                        </AppText>
                    </View>
                    <FlatList
                        key={rangeKey}
                        data={weeks}
                        renderItem={renderBar}
                        extraData={selectedWeek}
                        initialNumToRender={visibleBars}
                        maxToRenderPerBatch={visibleBars}
                        windowSize={5}
                        initialScrollIndex={
                            initialScrollToEnd && needsScroll && weeks.length
                                ? Math.max(0, weeks.length - 1)
                                : undefined
                        }
                        keyExtractor={(week) => weekKey(week.weekStart)}
                        getItemLayout={(_, index) => ({
                            length: barWidth + BAR_GAP,
                            offset: index * (barWidth + BAR_GAP),
                            index,
                        })}
                        horizontal
                        style={{ flex: 1 }}
                        showsHorizontalScrollIndicator
                        contentContainerStyle={{
                            gap: BAR_GAP,
                            paddingRight: BAR_GAP,
                            paddingBottom: 12,
                        }}
                    />
                </View>
            )}
            <ActivityStatusLegend
                className="justify-center"
                includeMixed={false}
                includeCancelled={values.some((value) =>
                    value.status === "cancelled" || (value.statusBreakdown?.cancelled ?? 0) > 0
                )}
            />
            {selectedSummary ? (
                <View className="gap-0.5">
                    <AppText variant="subtext" color="mutedForeground">
                            {t("activity.weekOf", {
                                date: selectedSummary.label,
                            }) +
                                " · " +
                                String(selectedSummary.total ?? "") +
                                " " +
                                unitLabel +
                                formatStatusBreakdown(
                                    selectedSummary.statusBreakdown, t,
                                )}
                    </AppText>
                    <AppText variant="subtext" color="mutedForeground">
                            {formatTypeBreakdown(selectedSummary.typeCounts, t) ||
                                "-"}
                    </AppText>
                </View>
            ) : (
                <AppText variant="subtext" color="mutedForeground">
                        {overallCount !== undefined
                            ? `${t("activity.overall")} · ${overallCount} ${unitLabel}`
                            : "-"}
                </AppText>
            )}
            {!hasData ? (
                <AppText variant="subtext" color="mutedForeground" align="center">
                        {t("activity.noRecorded", { unit: unitLabel })}
                </AppText>
            ) : null}
        </View>
    );
}

const WeeklyBar = memo(function WeeklyBar({
    week,
    barWidth,
    plotHeight,
    maxTotal,
    currentWeekKey,
    isSelected,
    isDimmed,
    accessibilityLabel,
    colors,
    onPress,
}: {
    week: WeeklyWeek;
    barWidth: number;
    plotHeight: number;
    maxTotal: number;
    currentWeekKey: string;
    isSelected: boolean;
    isDimmed: boolean;
    accessibilityLabel: string;
    colors: ReturnType<typeof useTheme>["colors"];
    onPress: (weekStart: Date, total: number, key: string) => void;
}) {
    const key = weekKey(week.weekStart);
    const isCurrent = key === currentWeekKey;
    const barHeight = Math.max(
        MIN_BAR_HEIGHT,
        Math.round((week.total / maxTotal) * plotHeight),
    );
    const segments = buildStatusSegments(
        week.statusBreakdown,
        week.total,
        barHeight,
        week.status,
        colors,
    );

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={accessibilityLabel}
            onPress={() => onPress(week.weekStart, week.total, key)}
            style={{ width: barWidth, alignItems: "center", gap: 8 }}
        >
            <View
                style={{
                    width: barWidth,
                    height: plotHeight,
                    justifyContent: "flex-end",
                    alignItems: "center",
                    position: "relative",
                }}
            >
                <View
                    style={{
                        width: Math.round(barWidth * 0.65),
                        height: barHeight,
                        borderRadius: 6,
                        overflow: "hidden",
                        opacity: isDimmed ? 0.4 : 1,
                        borderWidth: isCurrent ? 1.5 : 0,
                        borderColor: colors.foreground,
                    }}
                >
                    {segments.map((segment) => (
                        <View
                            key={segment.status}
                            style={{
                                flex: segment.height,
                                backgroundColor: week.total === 0 ? colors.muted : getActivityStatusColor(
                                    segment.status,
                                    colors,
                                ),
                            }}
                        />
                    ))}
                </View>
            </View>
            <RNText
                accessible={false}
                style={{ ...typography.subtext, color: colors.mutedForeground, textAlign: "center", includeFontPadding: false, width: barWidth }}
            >
                {week.label}
            </RNText>
        </Pressable>
    );
});

function buildStatusSegments(
    breakdown: Partial<Record<ActivityHeatmapStatus, number>> | undefined,
    total: number,
    barHeight: number,
    fallbackStatus: ActivityHeatmapStatus | undefined,
    colors: ReturnType<typeof useTheme>["colors"],
) {
    const statusOrder: ActivityHeatmapStatus[] = [
        "checked-in",
        "completed",
        "no-show",
        "reserved",
        "cancelled",
        "unknown",
    ];
    const entries = statusOrder
        .map((status) => ({ status, count: breakdown?.[status] ?? 0 }))
        .filter((entry) => entry.count > 0);

    if (entries.length === 0) {
        return [
            {
                status: fallbackStatus ?? "unknown",
                height: barHeight,
                color: getActivityStatusColor(fallbackStatus, colors),
            },
        ];
    }

    let remainingHeight = barHeight;
    return entries.map((entry, index) => {
        const height =
            index === entries.length - 1
                ? remainingHeight
                : Math.round((entry.count / Math.max(1, total)) * barHeight);
        remainingHeight -= height;
        return {
            status: entry.status,
            height: Math.max(0, height),
            color: getActivityStatusColor(entry.status, colors),
        };
    });
}
