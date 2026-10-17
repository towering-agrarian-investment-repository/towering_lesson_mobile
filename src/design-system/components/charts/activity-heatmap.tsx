import { Host, Text } from "@expo/ui";
import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    Pressable,
    View,
    useWindowDimensions,
    type LayoutChangeEvent,
    type ViewProps,
} from "react-native";
import Svg, { Text as SvgText } from "react-native-svg";
import { cn } from "../../utils/cn";
import { useTheme, type ThemeColors } from "../../utils/theme";
import { typography } from "../../utils/typography";
import {
    buildHeatmapWeeks,
    formatActivityDate,
    formatStatusBreakdown,
    formatTypeBreakdown,
    getFocusMonthWeekIndex,
    getHeatmapCellColor,
    toDateKey,
    type ActivityHeatmapValue,
    type ActivityHeatmapWeek,
} from "./activity-chart-data";
import { chartLeadingModifiers, getChartTextStyles } from "./chart-text-styles";

export type { ActivityHeatmapStatus, ActivityHeatmapValue } from "./activity-chart-data";

export function ActivityStatusLegend({
    className,
    includeMixed = true,
}: {
    className?: string;
    includeMixed?: boolean;
}) {
    const { t } = useTranslation();
    const { colors, fontScale } = useTheme();
    const textStyles = getChartTextStyles(colors, fontScale);
    const statuses = [
        { key: "completed", label: t("activity.completed"), color: colors.success },
        { key: "absent", label: t("activity.absent"), color: colors.danger },
        { key: "booked", label: t("activity.booked"), color: colors.ticketPrivate },
        ...(includeMixed ? [{ key: "mixed", label: t("activity.mixed"), color: colors.warning }] : []),
    ];

    return (
        <View className={cn("flex-row flex-wrap items-center gap-x-4 gap-y-2", className)}>
            {statuses.map((status) => (
                <View key={status.key} className="flex-row items-center gap-1.5">
                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: status.color }} />
                    <Host matchContents ignoreSafeArea="all">
                        <Text textStyle={textStyles.muted}>{status.label}</Text>
                    </Host>
                </View>
            ))}
        </View>
    );
}

type ActivityHeatmapProps = Omit<ViewProps, "children"> & {
    values: ActivityHeatmapValue[];
    endDate?: Date;
    numDays?: number;
    title?: string;
    legend?: boolean;
    overallCount?: number;
    overallUnitLabel?: string;
    className?: string;
    onDayPress?: (date: Date, count: number) => void;
};

const CELL_GAP = 4;
const CELL_RADIUS = 5;
const MIN_CELL = 24;
const MAX_CELL = 36;
const LABEL_COL_WIDTH = 24;
const MONTH_LABEL_HEIGHT = 24;
const WEEKDAY_OFFSETS = [0, 2, 4, 6];

export function ActivityHeatmap({
    values,
    endDate,
    numDays = 365,
    title,
    legend = true,
    overallCount,
    overallUnitLabel,
    className,
    onDayPress,
    onLayout,
    ...props
}: ActivityHeatmapProps) {
    const { colors, fontScale } = useTheme();
    const { fontScale: deviceFontScale } = useWindowDimensions();
    const { t, i18n: { language } } = useTranslation();
    const textStyles = getChartTextStyles(colors, fontScale);
    const todayKey = toDateKey(new Date());
    const endDateKey = endDate ? toDateKey(endDate) : todayKey;
    const [containerWidth, setContainerWidth] = useState(0);
    const valuesByDate = useMemo(
        () => new Map(values.map((value) => [toDateKey(value.date), value])),
        [values],
    );
    const weeks = useMemo(
        () => buildHeatmapWeeks(valuesByDate, endDateKey, numDays, language),
        [valuesByDate, endDateKey, numDays, language],
    );
    const rangeKey = weeks.length
        ? `${weeks[0].days[0].dateKey}-${weeks[weeks.length - 1].days[6].dateKey}`
        : "empty";
    const [selection, setSelection] = useState<{ rangeKey: string; dateKey: string } | null>(null);
    const selectedDay = selection?.rangeKey === rangeKey ? selection.dateKey : null;
    const selectedValue = selectedDay ? valuesByDate.get(selectedDay) : undefined;
    const selectedTypes = formatTypeBreakdown(selectedValue?.typeCounts, t);
    const weekdayLabels = useMemo(() => {
        const formatter = new Intl.DateTimeFormat(language, { weekday: "narrow" });
        return WEEKDAY_OFFSETS.map((offset) => formatter.format(new Date(2024, 0, 1 + offset)));
    }, [language]);
    const dateFormatter = useMemo(() => new Intl.DateTimeFormat(language, {
        year: "numeric", month: "short", day: "numeric",
    }), [language]);
    const focusMonthWeekIndex = useMemo(
        () => getFocusMonthWeekIndex(weeks, endDateKey, todayKey),
        [weeks, endDateKey, todayKey],
    );
    const axisFontSize = typography.subtext.fontSize * deviceFontScale;
    const labelColumnWidth = Math.max(LABEL_COL_WIDTH, axisFontSize * 1.5);
    const monthLabelHeight = Math.max(MONTH_LABEL_HEIGHT, axisFontSize * 1.4);
    const availableWidth = Math.max(0, containerWidth - labelColumnWidth - CELL_GAP);
    const cellSize = Math.max(MIN_CELL,
        Math.min(MAX_CELL, Math.floor((availableWidth - 11 * CELL_GAP) / 12)));
    const visibleWeeks = Math.max(1, Math.ceil(availableWidth / (cellSize + CELL_GAP)) + 1);
    const handleLayout = (event: LayoutChangeEvent) => {
        setContainerWidth(event.nativeEvent.layout.width);
        onLayout?.(event);
    };
    const handleSelectDay = useCallback((dateKey: string, date: Date, count: number) => {
        setSelection({ rangeKey, dateKey });
        onDayPress?.(date, count);
    }, [onDayPress, rangeKey]);
    const renderWeek = useCallback(({ item: week }: { item: ActivityHeatmapWeek }) => (
        <HeatmapWeekColumn
            week={week}
            cellSize={cellSize}
            axisFontSize={axisFontSize}
            monthLabelHeight={monthLabelHeight}
            todayKey={todayKey}
            selectedDay={selectedDay && selectedDay >= week.days[0].dateKey && selectedDay <= week.days[6].dateKey
                ? selectedDay : null}
            colors={colors}
            dateFormatter={dateFormatter}
            onSelectDay={handleSelectDay}
        />
    ), [cellSize, axisFontSize, monthLabelHeight, todayKey, selectedDay, colors, dateFormatter, handleSelectDay]);

    return (
        <View {...props} className={cn("w-full gap-3", className)} onLayout={handleLayout}>
            {title ? (
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text textStyle={textStyles.title} modifiers={chartLeadingModifiers}>{title}</Text>
                </Host>
            ) : null}
            <View className="flex-row" style={{ gap: CELL_GAP }}>
                <Svg
                    width={labelColumnWidth}
                    height={cellSize * 7 + CELL_GAP * 6}
                    style={{ marginTop: monthLabelHeight + CELL_GAP }}
                    accessible={false}
                >
                    {weekdayLabels.map((label, index) => (
                        <SvgText
                            key={WEEKDAY_OFFSETS[index]}
                            x={0}
                            y={index * 2 * (cellSize + CELL_GAP) + cellSize / 2}
                            alignmentBaseline="central"
                            fontSize={axisFontSize}
                            fill={colors.mutedForeground}
                        >{label}</SvgText>
                    ))}
                </Svg>
                {containerWidth > 0 ? (
                    <FlatList
                        key={rangeKey}
                        data={weeks}
                        renderItem={renderWeek}
                        extraData={selectedDay}
                        initialScrollIndex={weeks.length ? focusMonthWeekIndex : undefined}
                        initialNumToRender={visibleWeeks}
                        maxToRenderPerBatch={visibleWeeks}
                        windowSize={5}
                        keyExtractor={(week) => week.days[0].dateKey}
                        getItemLayout={(_, index) => ({
                            length: cellSize + CELL_GAP,
                            offset: index * (cellSize + CELL_GAP),
                            index,
                        })}
                        horizontal
                        style={{ flex: 1 }}
                        showsHorizontalScrollIndicator
                        contentContainerStyle={{ paddingBottom: 12 }}
                    />
                ) : null}
            </View>
            {legend ? <ActivityStatusLegend className="justify-center" /> : null}
            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                <Text textStyle={textStyles.muted} modifiers={chartLeadingModifiers}>
                    {selectedDay
                        ? `${t("activity.activityCount", { count: selectedValue?.count ?? 0 })} ${t("activity.onDate", { date: formatActivityDate(selectedDay, language) })}${formatStatusBreakdown(selectedValue?.statusBreakdown, t)}${selectedTypes ? ` · ${selectedTypes}` : ""}`
                        : overallCount !== undefined
                            ? `${t("activity.overall")} · ${overallCount} ${overallUnitLabel ?? t("activity.reservations")}`
                            : "-"}
                </Text>
            </Host>
        </View>
    );
}

const HeatmapWeekColumn = memo(function HeatmapWeekColumn({
    week, cellSize, axisFontSize, monthLabelHeight, todayKey, selectedDay, colors, dateFormatter, onSelectDay,
}: {
    week: ActivityHeatmapWeek;
    cellSize: number;
    axisFontSize: number;
    monthLabelHeight: number;
    todayKey: string;
    selectedDay: string | null;
    colors: ThemeColors;
    dateFormatter: Intl.DateTimeFormat;
    onSelectDay: (dateKey: string, date: Date, count: number) => void;
}) {
    const { t } = useTranslation();
    return (
        <View style={{ width: cellSize, gap: CELL_GAP, marginRight: CELL_GAP }}>
            <View style={{ height: monthLabelHeight, overflow: "visible" }}>
                {week.monthLabel ? (
                    <Svg
                        width={Math.max(cellSize, axisFontSize * week.monthLabel.length)}
                        height={monthLabelHeight}
                        style={{ position: "absolute", left: 0, overflow: "visible" }}
                        accessible={false}
                    >
                        <SvgText x={0} y={axisFontSize} fontSize={axisFontSize} fill={colors.mutedForeground}>
                            {week.monthLabel}
                        </SvgText>
                    </Svg>
                ) : null}
            </View>
            {week.days.map((day) => {
                const isToday = day.dateKey === todayKey;
                const isSelected = day.dateKey === selectedDay;
                return (
                    <Pressable
                        key={day.dateKey}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`${t("activity.activityCount", { count: day.count })} ${t("activity.onDate", { date: dateFormatter.format(day.date) })}${isToday ? ` (${t("activity.today")})` : ""}`}
                        hitSlop={4}
                        style={{
                            width: cellSize,
                            height: cellSize,
                            borderRadius: CELL_RADIUS,
                            backgroundColor: getHeatmapCellColor(day.count, colors, day.status),
                            borderWidth: isSelected || isToday ? 1.5 : 0,
                            borderColor: isSelected ? colors.foreground : colors.primary,
                        }}
                        onPress={() => onSelectDay(day.dateKey, day.date, day.count)}
                    />
                );
            })}
        </View>
    );
});
