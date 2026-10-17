import { Host, Text } from "@expo/ui";
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

import { buildWeekSummaries, getWeekStart, toDateKey as weekKey, parseCalendarDate, formatStatusBreakdown, formatTypeBreakdown, type WeeklySummaryValue, type WeeklyWeek } from "./activity-chart-data";
import { chartLeadingModifiers, chartCenterModifiers, getChartTextStyles } from "./chart-text-styles";
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
    const { colors, fontScale: uiFontScale } = useTheme();
    const textStyles = getChartTextStyles(colors, uiFontScale);
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
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={textStyles.title}
                        modifiers={chartLeadingModifiers}>
                        {title}
                    </Text>
                </Host>
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
                        <Host
                            matchContents
                            ignoreSafeArea="all"
                            style={{ position: "absolute", top: -6 }}
                        >
                            <Text
                                textStyle={textStyles.muted}
                            >
                                {String(maxTotal ?? "")}
                            </Text>
                        </Host>
                        <Host
                            matchContents
                            ignoreSafeArea="all"
                            style={{
                                position: "absolute",
                                top: plotHeight / 2 - 6,
                            }}
                        >
                            <Text
                                textStyle={textStyles.muted}
                            >
                                {String(Math.ceil(maxTotal / 2) ?? "")}
                            </Text>
                        </Host>
                        <Host
                            matchContents
                            ignoreSafeArea="all"
                            style={{ position: "absolute", bottom: 0 }}
                        >
                            <Text
                                textStyle={textStyles.muted}
                            >
                                {"0"}
                            </Text>
                        </Host>
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
            <ActivityStatusLegend className="justify-center" includeMixed={false} />
            {selectedSummary ? (
                <View className="gap-0.5">
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={textStyles.muted}
                            modifiers={chartLeadingModifiers}>
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
                        </Text>
                    </Host>
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={textStyles.muted}
                            modifiers={chartLeadingModifiers}>
                            {formatTypeBreakdown(selectedSummary.typeCounts, t) ||
                                "-"}
                        </Text>
                    </Host>
                </View>
            ) : (
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={textStyles.muted}
                        modifiers={chartLeadingModifiers}>
                        {overallCount !== undefined
                            ? `${t("activity.overall")} · ${overallCount} ${unitLabel}`
                            : "-"}
                    </Text>
                </Host>
            )}
            {!hasData ? (
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{ ...textStyles.muted, textAlign: "center" }}
                        modifiers={chartCenterModifiers}>
                        {t("activity.noRecorded", { unit: unitLabel })}
                    </Text>
                </Host>
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
                                backgroundColor: week.total === 0 ? colors.muted : getStatusColor(
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
                color: getStatusColor(fallbackStatus, colors),
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
            color: getStatusColor(entry.status, colors),
        };
    });
}

function getStatusColor(
    status: ActivityHeatmapStatus | undefined,
    colors: ReturnType<typeof useTheme>["colors"],
) {
    switch (status) {
        case "completed":
            return colors.success;
        case "no-show":
            return colors.danger;
        case "cancelled":
            return colors.mutedForeground;
        case "reserved":
            return colors.ticketPrivate;
        case "mixed":
            return colors.warning;
        case "unknown":
        default:
            return colors.primary;
    }
}
