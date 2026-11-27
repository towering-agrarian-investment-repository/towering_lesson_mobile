import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "react-native-reanimated";
import {
    FlatList,
    Pressable,
    ScrollView,
    View,
    useWindowDimensions,
    type LayoutChangeEvent,
    type ViewProps,
} from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { AppText } from "../AppText";
import { cn } from "../../utils/cn";
import { colorWithOpacity } from "../../utils/color";
import { triggerSelectionHaptic } from "../../utils/haptics";
import { useTheme, type ThemeColors } from "../../utils/theme";
import { getReservationStatusLabel } from "../../../utils/status-tone";
import { formatDateForAPI } from "../../../utils/time-helper";
import {
    buildHeatmapWeeks,
    formatActivityDate,
    getActivityStatusColor,
    getFocusMonthWeekIndex,
    getHeatmapCellColor,
    parseCalendarDate,
    toDateKey,
    type ActivityHeatmapStatus,
    type ActivityHeatmapValue,
    type ActivityHeatmapWeek,
} from "./activity-chart-data";
import {
    HEATMAP_CELL_GAP as CELL_GAP,
    HEATMAP_CELL_RADIUS as CELL_RADIUS,
    getActivityHeatmapLayout,
} from "./activity-heatmap-layout";

export type { ActivityHeatmapStatus, ActivityHeatmapValue } from "./activity-chart-data";

const weekKeyExtractor = (week: ActivityHeatmapWeek) => week.days[0].dateKey;

function ActivityStatusLegend({
    className,
    includeMixed = true,
    includeCancelled = false,
    includeToday = false,
    onTodayPress,
}: {
    className?: string;
    includeMixed?: boolean;
    includeCancelled?: boolean;
    includeToday?: boolean;
    onTodayPress?: () => void;
}) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const statuses = [
        {
            key: "reserved",
            label: getReservationStatusLabel("RESERVED", t),
            color: getActivityStatusColor("reserved", colors),
        },
        {
            key: "completed",
            label: getReservationStatusLabel("COMPLETED", t),
            color: getActivityStatusColor("completed", colors),
        },
        {
            key: "no-show",
            label: getReservationStatusLabel("NO_SHOW", t),
            color: getActivityStatusColor("no-show", colors),
        },
        ...(includeCancelled
            ? [
                  {
                      key: "cancelled",
                      label: getReservationStatusLabel("CANCELLED", t),
                      color: getActivityStatusColor("cancelled", colors),
                  },
              ]
            : []),
        ...(includeMixed ? [{ key: "mixed", label: t("activity.mixed"), color: colors.warning }] : []),
    ];

    const legend = (
        <View
            className={cn(
                includeToday ? "flex-row items-center gap-3" : "flex-row flex-wrap items-center gap-x-4 gap-y-2",
                className,
            )}
        >
            {includeToday ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("activity.today")}
                    accessibilityState={{ disabled: !onTodayPress }}
                    disabled={!onTodayPress}
                    className="min-h-12 flex-row items-center gap-1.5"
                    onPress={onTodayPress}
                >
                    <View
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            borderWidth: 1.5,
                            borderColor: colors.primary,
                        }}
                    />
                    <AppText variant="subtext" color="mutedForeground" wrap={false}>
                        {t("activity.today")}
                    </AppText>
                </Pressable>
            ) : null}
            {statuses.map((status) => (
                <View key={status.key} className="flex-row items-center gap-1.5">
                    <View
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            backgroundColor: status.color,
                        }}
                    />
                    <AppText variant="subtext" color="mutedForeground" wrap={false}>
                        {status.label}
                    </AppText>
                </View>
            ))}
        </View>
    );

    if (!includeToday) return legend;

    return (
        <ScrollView
            horizontal
            nestedScrollEnabled
            directionalLockEnabled
            contentInsetAdjustmentBehavior="never"
            showsHorizontalScrollIndicator={false}
            style={{ width: "100%", flexGrow: 0, flexShrink: 0 }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        >
            {legend}
        </ScrollView>
    );
}

type ActivityHeatmapProps = Omit<ViewProps, "children"> & {
    values: ActivityHeatmapValue[];
    endDate?: Date;
    numDays?: number;
    title?: string;
    legend?: boolean;
    showSelectedHeader?: boolean;
    focusTodayToken?: number;
    disabled?: boolean;
    className?: string;
    selectedDateKey?: string | null;
    onDayPress?: (date: Date, count: number) => void;
    onTodayPress?: () => void;
};

const WEEKDAY_OFFSETS = [0, 1, 2, 3, 4, 5, 6];

function createHeatmapDateLabelGetter(language: string) {
    const formatter = new Intl.DateTimeFormat(language, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
    const labels = new Map<number, string>();
    return (date: Date) => {
        const timestamp = date.getTime();
        const cached = labels.get(timestamp);
        if (cached !== undefined) return cached;

        const label = formatter.format(date);
        labels.set(timestamp, label);
        return label;
    };
}

export function ActivityHeatmap({
    values,
    endDate,
    numDays = 365,
    title,
    legend = true,
    showSelectedHeader = false,
    focusTodayToken = 0,
    disabled = false,
    className,
    selectedDateKey,
    onDayPress,
    onTodayPress,
    onLayout,
    ...props
}: ActivityHeatmapProps) {
    const { colors } = useTheme();
    const reducedMotion = useReducedMotion();
    const { fontScale: deviceFontScale } = useWindowDimensions();
    const {
        t,
        i18n: { language },
    } = useTranslation();
    const todayKey = formatDateForAPI(new Date());
    const endDateKey = endDate ? toDateKey(endDate) : todayKey;
    const [containerWidth, setContainerWidth] = useState(0);
    const listRef = useRef<FlatList<ActivityHeatmapWeek>>(null);
    const valuesByDate = useMemo(() => new Map(values.map((value) => [toDateKey(value.date), value])), [values]);
    const weeks = useMemo(
        () => buildHeatmapWeeks(valuesByDate, endDateKey, numDays, language),
        [valuesByDate, endDateKey, numDays, language],
    );
    const rangeKey = weeks.length ? `${weeks[0].days[0].dateKey}-${weeks[weeks.length - 1].days[6].dateKey}` : "empty";
    const todayWeekIndex =
        todayKey <= endDateKey ? weeks.findIndex((week) => week.days.some((day) => day.dateKey === todayKey)) : -1;
    const [selection, setSelection] = useState<{
        rangeKey: string;
        dateKey: string;
    } | null>(null);
    const selectedDay =
        selectedDateKey !== undefined
            ? selectedDateKey
            : selection?.rangeKey === rangeKey
              ? selection.dateKey
              : todayWeekIndex >= 0
                ? todayKey
                : null;
    const selectedValue = selectedDay ? valuesByDate.get(selectedDay) : undefined;
    const useShortWeekdays = language === "en" || language === "km" || language === "zh";
    const weekdayLabels = useMemo(() => {
        const formatter = new Intl.DateTimeFormat(language, {
            weekday: useShortWeekdays ? "short" : "narrow",
        });
        return WEEKDAY_OFFSETS.map((offset) => formatter.format(new Date(2024, 0, 1 + offset)));
    }, [language, useShortWeekdays]);
    const getDateLabel = useMemo(() => createHeatmapDateLabelGetter(language), [language]);
    const focusMonthWeekIndex = useMemo(
        () => getFocusMonthWeekIndex(weeks, endDateKey, todayKey),
        [weeks, endDateKey, todayKey],
    );
    const { axisFontSize, labelColumnWidth, monthLabelHeight, availableWidth, cellSize } = getActivityHeatmapLayout(
        containerWidth,
        deviceFontScale,
        language,
    );
    // Exactly 12 whole weeks fit the width, so no column is cut off at the right edge.
    // The shared layout also sizes the loading grid to these columns.
    const viewportWeeks = Math.max(1, Math.ceil(availableWidth / (cellSize + CELL_GAP)));
    const visibleWeeks = viewportWeeks + 1;
    const initialWeekIndex =
        todayWeekIndex >= 0 ? Math.max(0, todayWeekIndex - Math.floor(visibleWeeks / 2)) : focusMonthWeekIndex;
    const maxScrollOffset = Math.max(0, weeks.length * (cellSize + CELL_GAP) - availableWidth);
    const initialScrollOffset = Math.min(maxScrollOffset, initialWeekIndex * (cellSize + CELL_GAP));
    const edgeKey = `${rangeKey}:${containerWidth}`;
    const initialEdges = {
        key: edgeKey,
        left: initialScrollOffset > 1,
        right: maxScrollOffset - initialScrollOffset > 1,
    };
    const [scrollEdges, setScrollEdges] = useState(initialEdges);
    const scrollEdgesRef = useRef(scrollEdges);
    const visibleEdges = scrollEdges.key === edgeKey ? scrollEdges : initialEdges;
    const handleLayout = (event: LayoutChangeEvent) => {
        setContainerWidth(event.nativeEvent.layout.width);
        onLayout?.(event);
    };
    const handleSelectDay = useCallback(
        (dateKey: string, date: Date, count: number) => {
            if (disabled) return;
            triggerSelectionHaptic();
            setSelection({ rangeKey, dateKey });
            onDayPress?.(date, count);
        },
        [disabled, onDayPress, rangeKey],
    );
    const handleTodayPress = () => {
        if (disabled) return;
        if (todayWeekIndex >= 0) {
            triggerSelectionHaptic();
            setSelection({ rangeKey, dateKey: todayKey });
            onDayPress?.(parseCalendarDate(todayKey), valuesByDate.get(todayKey)?.count ?? 0);
            listRef.current?.scrollToOffset({
                offset: Math.min(
                    maxScrollOffset,
                    Math.max(0, todayWeekIndex - Math.floor(visibleWeeks / 2)) * (cellSize + CELL_GAP),
                ),
                animated: !reducedMotion,
            });
        } else {
            onTodayPress?.();
        }
    };

    useEffect(() => {
        if (!focusTodayToken || todayWeekIndex < 0) return;
        listRef.current?.scrollToOffset({
            offset: Math.min(
                maxScrollOffset,
                Math.max(0, todayWeekIndex - Math.floor(visibleWeeks / 2)) * (cellSize + CELL_GAP),
            ),
            animated: !reducedMotion,
        });
    }, [cellSize, focusTodayToken, maxScrollOffset, reducedMotion, todayWeekIndex, visibleWeeks]);
    const renderWeek = useCallback(
        ({ item: week }: { item: ActivityHeatmapWeek }) => (
            <HeatmapWeekColumn
                week={week}
                cellSize={cellSize}
                axisFontSize={axisFontSize}
                monthLabelHeight={monthLabelHeight}
                todayKey={todayKey}
                selectedDay={
                    selectedDay && selectedDay >= week.days[0].dateKey && selectedDay <= week.days[6].dateKey
                        ? selectedDay
                        : null
                }
                disabled={disabled}
                colors={colors}
                getDateLabel={getDateLabel}
                onSelectDay={handleSelectDay}
            />
        ),
        [
            cellSize,
            axisFontSize,
            monthLabelHeight,
            todayKey,
            selectedDay,
            disabled,
            colors,
            getDateLabel,
            handleSelectDay,
        ],
    );

    const getWeekItemLayout = useCallback(
        (_: ArrayLike<ActivityHeatmapWeek> | null | undefined, index: number) => ({
            length: cellSize + CELL_GAP,
            offset: index * (cellSize + CELL_GAP),
            index,
        }),
        [cellSize],
    );

    return (
        <View {...props} className={cn("w-full gap-3", className)} onLayout={handleLayout}>
            {title ? <AppText variant="h3">{title}</AppText> : null}
            <View className="flex-row" style={{ gap: CELL_GAP }}>
                <View style={{ paddingTop: monthLabelHeight + CELL_GAP }}>
                    <Svg width={labelColumnWidth} height={cellSize * 7 + CELL_GAP * 6} accessible={false}>
                        {weekdayLabels.map((label, index) => (
                            <SvgText
                                key={WEEKDAY_OFFSETS[index]}
                                x={0}
                                y={WEEKDAY_OFFSETS[index] * (cellSize + CELL_GAP) + cellSize / 2}
                                alignmentBaseline="central"
                                fontSize={axisFontSize}
                                fill={colors.mutedForeground}
                            >
                                {label}
                            </SvgText>
                        ))}
                    </Svg>
                </View>
                {containerWidth > 0 ? (
                    <View style={{ flex: 1 }}>
                        <FlatList
                            ref={listRef}
                            key={rangeKey}
                            data={weeks}
                            renderItem={renderWeek}
                            extraData={selectedDay}
                            initialScrollIndex={weeks.length ? initialWeekIndex : undefined}
                            initialNumToRender={Math.min(visibleWeeks, Math.max(1, weeks.length - initialWeekIndex))}
                            maxToRenderPerBatch={viewportWeeks}
                            windowSize={3}
                            keyExtractor={weekKeyExtractor}
                            getItemLayout={getWeekItemLayout}
                            horizontal
                            nestedScrollEnabled
                            directionalLockEnabled
                            contentInsetAdjustmentBehavior="never"
                            snapToInterval={cellSize + CELL_GAP}
                            decelerationRate="fast"
                            style={{ flex: 1 }}
                            showsHorizontalScrollIndicator={false}
                            scrollEventThrottle={100}
                            onScroll={(event) => {
                                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                                const nextEdges = {
                                    key: edgeKey,
                                    left: contentOffset.x > 1,
                                    right: contentSize.width - layoutMeasurement.width - contentOffset.x > 1,
                                };
                                if (
                                    scrollEdgesRef.current.key !== nextEdges.key ||
                                    scrollEdgesRef.current.left !== nextEdges.left ||
                                    scrollEdgesRef.current.right !== nextEdges.right
                                ) {
                                    scrollEdgesRef.current = nextEdges;
                                    setScrollEdges(nextEdges);
                                }
                            }}
                        />
                        {visibleEdges.left ? (
                            <LinearGradient
                                pointerEvents="none"
                                colors={[colors.background, colorWithOpacity(colors.background, 0)]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    left: 0,
                                    width: cellSize,
                                }}
                            />
                        ) : null}
                        {visibleEdges.right ? (
                            <LinearGradient
                                pointerEvents="none"
                                colors={[colorWithOpacity(colors.background, 0), colors.background]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    right: 0,
                                    width: cellSize,
                                }}
                            />
                        ) : null}
                    </View>
                ) : null}
            </View>
            {legend ? (
                <ActivityStatusLegend
                    className="justify-center"
                    includeToday={showSelectedHeader}
                    includeCancelled={values.some(
                        (value) => value.status === "cancelled" || (value.statusBreakdown?.cancelled ?? 0) > 0,
                    )}
                    onTodayPress={!disabled && showSelectedHeader ? handleTodayPress : undefined}
                />
            ) : null}
            {showSelectedHeader && selectedDay ? (
                <View className="flex-row items-center justify-between gap-3">
                    <AppText variant="h3" style={{ flex: 1, minWidth: 0 }}>
                        {formatActivityDate(selectedDay, language)}
                    </AppText>
                    <AppText
                        variant="subtext"
                        color="mutedForeground"
                        align="right"
                        wrap={false}
                        textStyle={{ fontWeight: "600" }}
                    >
                        {t("activity.sessionCount", { count: selectedValue?.count ?? 0 })}
                    </AppText>
                </View>
            ) : null}
        </View>
    );
}

// Draw a status icon inside exception cells alongside their accessible labels.
function StatusGlyph({ status, size, colors }: { status: ActivityHeatmapStatus; size: number; colors: ThemeColors }) {
    if (status === "completed" || status === "unknown") {
        return null;
    }
    const ink = colors.primaryForeground;
    return (
        <Svg width={size} height={size} viewBox="0 0 12 12" accessible={false} pointerEvents="none">
            {status === "checked-in" ? (
                <Path
                    d="M2.5 6.5l2.3 2.3L9.5 4"
                    fill="none"
                    stroke={ink}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ) : null}
            {status === "reserved" ? <Circle cx={6} cy={6} r={2.4} fill={ink} /> : null}
            {status === "mixed" ? (
                <>
                    <Circle cx={6} cy={6} r={3.8} fill="none" stroke={ink} strokeWidth={1.7} />
                    <Path d="M6 2.2a3.8 3.8 0 0 1 0 7.6z" fill={ink} />
                </>
            ) : null}
            {status === "no-show" ? (
                <Path
                    d="M3.2 3.2l5.6 5.6M8.8 3.2L3.2 8.8"
                    fill="none"
                    stroke={ink}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                />
            ) : null}
            {status === "cancelled" ? (
                <>
                    <Circle cx={6} cy={6} r={3.6} fill="none" stroke={ink} strokeWidth={1.4} />
                    <Path d="M3.5 8.5l5-5" fill="none" stroke={ink} strokeWidth={1.4} strokeLinecap="round" />
                </>
            ) : null}
        </Svg>
    );
}

const HeatmapWeekColumn = memo(function HeatmapWeekColumn({
    week,
    cellSize,
    axisFontSize,
    monthLabelHeight,
    todayKey,
    selectedDay,
    disabled,
    colors,
    getDateLabel,
    onSelectDay,
}: {
    week: ActivityHeatmapWeek;
    cellSize: number;
    axisFontSize: number;
    monthLabelHeight: number;
    todayKey: string;
    selectedDay: string | null;
    disabled?: boolean;
    colors: ThemeColors;
    getDateLabel: (date: Date) => string;
    onSelectDay: (dateKey: string, date: Date, count: number) => void;
}) {
    const { t } = useTranslation();
    return (
        <View style={{ width: cellSize + CELL_GAP, paddingRight: CELL_GAP, gap: CELL_GAP }}>
            <View style={{ height: monthLabelHeight, overflow: "visible" }}>
                {week.monthLabel ? (
                    <AppText
                        variant="caption"
                        color="mutedForeground"
                        allowFontScaling={false}
                        wrap={false}
                        numberOfLines={1}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: Math.max(
                                (cellSize + CELL_GAP) * 4,
                                Math.ceil(axisFontSize * (week.monthLabel.length + 1.5)),
                            ),
                            fontSize: axisFontSize,
                            lineHeight: monthLabelHeight,
                        }}
                    >
                        {week.monthLabel}
                    </AppText>
                ) : null}
            </View>
            {week.days.map((day) => {
                const isToday = day.dateKey === todayKey;
                const isSelected = day.dateKey === selectedDay;
                const statusLabel =
                    day.status === "mixed"
                        ? t("activity.mixed")
                        : day.status === "unknown"
                          ? t("activity.other")
                          : day.status
                            ? getReservationStatusLabel(day.status, t)
                            : null;
                return (
                    <Pressable
                        key={day.dateKey}
                        accessibilityRole="button"
                        accessibilityState={{
                            selected: isSelected,
                            disabled: Boolean(disabled),
                        }}
                        accessibilityLabel={`${t("activity.activityCount", { count: day.count })} ${t("activity.onDate", { date: getDateLabel(day.date) })}${statusLabel ? ` · ${statusLabel}` : ""}${isToday ? ` (${t("activity.today")})` : ""}`}
                        disabled={disabled}
                        hitSlop={CELL_GAP / 2}
                        style={({ pressed }) => ({
                            width: cellSize,
                            height: cellSize,
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: CELL_RADIUS,
                            backgroundColor: getHeatmapCellColor(day.count, colors, day.status),
                            borderWidth: isSelected ? 2 : isToday ? 1.5 : 0,
                            borderColor: isSelected ? colors.foreground : colors.primary,
                            opacity: pressed && !disabled ? 0.7 : 1,
                        })}
                        onPress={() => onSelectDay(day.dateKey, day.date, day.count)}
                    >
                        {day.status ? (
                            <StatusGlyph status={day.status} size={Math.round(cellSize * 0.5)} colors={colors} />
                        ) : null}
                        {isSelected && isToday ? (
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    top: 2,
                                    right: 2,
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: colors.primary,
                                }}
                            />
                        ) : null}
                    </Pressable>
                );
            })}
        </View>
    );
});
