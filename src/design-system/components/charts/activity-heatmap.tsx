import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Animated, {
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
} from "react-native-reanimated";
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    useWindowDimensions,
    type FlatList,
    type LayoutChangeEvent,
    type ViewProps,
} from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import { AppText } from "../AppText";
import { SCREEN_HORIZONTAL_PADDING, SCREEN_MAX_WIDTH } from "../Screen";
import { cn } from "../../utils/cn";
import { colorWithOpacity } from "../../utils/color";
import { triggerSelectionHaptic } from "../../utils/haptics";
import { useTheme, type ThemeColors } from "../../utils/theme";
import { useDayClock } from "../../../lib/hook/useMinuteClock";
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
const PRESSED_CELL_STYLE = { opacity: 0.7 } as const;
const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END = { x: 1, y: 0 } as const;

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

type HeatmapAccessibilityLabels = {
    todaySuffix: string;
    zeroCount: string;
    statuses: Record<ActivityHeatmapStatus, string>;
    t: ReturnType<typeof useTranslation>["t"];
};

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
    const dayClock = useDayClock();
    const {
        t,
        i18n: { language },
    } = useTranslation();
    const todayKey = formatDateForAPI(dayClock);
    const endDateKey = endDate ? toDateKey(endDate) : todayKey;
    const [containerWidth, setContainerWidth] = useState(() =>
        Math.max(0, Math.min(Dimensions.get("window").width, SCREEN_MAX_WIDTH) - SCREEN_HORIZONTAL_PADDING * 2),
    );
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
    const accessibilityLabels = useMemo<HeatmapAccessibilityLabels>(
        () => ({
            todaySuffix: ` (${t("activity.today")})`,
            zeroCount: t("activity.activityCount", { count: 0 }),
            statuses: {
                reserved: getReservationStatusLabel("reserved", t),
                "checked-in": getReservationStatusLabel("checked-in", t),
                completed: getReservationStatusLabel("completed", t),
                cancelled: getReservationStatusLabel("cancelled", t),
                "no-show": getReservationStatusLabel("no-show", t),
                mixed: t("activity.mixed"),
                unknown: t("activity.other"),
            },
            t,
        }),
        [t],
    );
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
    const initialLeftEdge = initialScrollOffset > 1 ? 1 : 0;
    const initialRightEdge = maxScrollOffset - initialScrollOffset > 1 ? 1 : 0;
    const leftEdgeOpacity = useSharedValue(initialLeftEdge);
    const rightEdgeOpacity = useSharedValue(initialRightEdge);

    const handleScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            leftEdgeOpacity.set(event.contentOffset.x > 1 ? 1 : 0);
            rightEdgeOpacity.set(
                event.contentSize.width - event.layoutMeasurement.width - event.contentOffset.x > 1 ? 1 : 0,
            );
        },
    });

    useEffect(() => {
        leftEdgeOpacity.set(initialLeftEdge);
        rightEdgeOpacity.set(initialRightEdge);
    }, [initialLeftEdge, initialRightEdge, leftEdgeOpacity, rangeKey, rightEdgeOpacity]);

    const leftEdgeAnimatedStyle = useAnimatedStyle(() => ({
        opacity: leftEdgeOpacity.value,
    }));
    const rightEdgeAnimatedStyle = useAnimatedStyle(() => ({
        opacity: rightEdgeOpacity.value,
    }));

    const handleLayout = (event: LayoutChangeEvent) => {
        const nextWidth = event.nativeEvent.layout.width;
        setContainerWidth((current) => (Math.abs(nextWidth - current) > 0.5 ? nextWidth : current));
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
                accessibilityLabels={accessibilityLabels}
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
            accessibilityLabels,
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

    const transparentBackground = colorWithOpacity(colors.background, 0);

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
                        <Animated.FlatList
                            ref={listRef}
                            key={rangeKey}
                            data={weeks}
                            renderItem={renderWeek}
                            extraData={selectedDay}
                            initialScrollIndex={weeks.length ? initialWeekIndex : undefined}
                            initialNumToRender={Math.min(visibleWeeks, Math.max(1, weeks.length - initialWeekIndex))}
                            maxToRenderPerBatch={4}
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
                            scrollEventThrottle={16}
                            onScroll={handleScroll}
                        />
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                {
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    left: 0,
                                    width: cellSize,
                                },
                                leftEdgeAnimatedStyle,
                            ]}
                        >
                            <LinearGradient
                                colors={[colors.background, transparentBackground]}
                                start={GRADIENT_START}
                                end={GRADIENT_END}
                                style={StyleSheet.absoluteFill}
                            />
                        </Animated.View>
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                {
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    right: 0,
                                    width: cellSize,
                                },
                                rightEdgeAnimatedStyle,
                            ]}
                        >
                            <LinearGradient
                                colors={[transparentBackground, colors.background]}
                                start={GRADIENT_START}
                                end={GRADIENT_END}
                                style={StyleSheet.absoluteFill}
                            />
                        </Animated.View>
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

function hasSvgExceptionGlyph(
    status?: ActivityHeatmapStatus,
): status is "checked-in" | "mixed" | "no-show" | "cancelled" {
    return status === "checked-in" || status === "mixed" || status === "no-show" || status === "cancelled";
}

// Render all non-dot exception glyphs for a week column inside a single native SVG overlay.
function renderStatusGlyphElements(status: "checked-in" | "mixed" | "no-show" | "cancelled", ink: string) {
    if (status === "checked-in") {
        return (
            <Path
                d="M2.5 6.5l2.3 2.3L9.5 4"
                fill="none"
                stroke={ink}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        );
    }
    if (status === "mixed") {
        return (
            <>
                <Circle cx={6} cy={6} r={3.8} fill="none" stroke={ink} strokeWidth={1.7} />
                <Path d="M6 2.2a3.8 3.8 0 0 1 0 7.6z" fill={ink} />
            </>
        );
    }
    if (status === "no-show") {
        return (
            <Path
                d="M3.2 3.2l5.6 5.6M8.8 3.2L3.2 8.8"
                fill="none"
                stroke={ink}
                strokeWidth={2.2}
                strokeLinecap="round"
            />
        );
    }
    return (
        <>
            <Circle cx={6} cy={6} r={3.6} fill="none" stroke={ink} strokeWidth={1.4} />
            <Path d="M3.5 8.5l5-5" fill="none" stroke={ink} strokeWidth={1.4} strokeLinecap="round" />
        </>
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
    accessibilityLabels,
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
    accessibilityLabels: HeatmapAccessibilityLabels;
    getDateLabel: (date: Date) => string;
    onSelectDay: (dateKey: string, date: Date, count: number) => void;
}) {
    const glyphSize = Math.round(cellSize * 0.5);
    const glyphOffset = (cellSize - glyphSize) / 2;
    const glyphScale = glyphSize / 12;
    const reservedDotSize = Math.max(3, Math.round(glyphSize * 0.4));
    const hasOverlayGlyphs = week.days.some((day) => hasSvgExceptionGlyph(day.status));

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
                const statusLabel = day.status ? accessibilityLabels.statuses[day.status] : null;
                const countLabel =
                    day.count === 0
                        ? accessibilityLabels.zeroCount
                        : accessibilityLabels.t("activity.activityCount", { count: day.count });
                const cellBaseStyle = {
                    width: cellSize,
                    height: cellSize,
                    alignItems: "center" as const,
                    justifyContent: "center" as const,
                    borderRadius: CELL_RADIUS,
                    backgroundColor: getHeatmapCellColor(day.count, colors, day.status),
                    borderWidth: isSelected ? 2 : isToday ? 1.5 : 0,
                    borderColor: isSelected ? colors.foreground : colors.primary,
                };
                return (
                    <Pressable
                        key={day.dateKey}
                        accessibilityRole="button"
                        accessibilityState={{
                            selected: isSelected,
                            disabled: Boolean(disabled),
                        }}
                        accessibilityLabel={`${countLabel} ${accessibilityLabels.t("activity.onDate", { date: getDateLabel(day.date) })}${statusLabel ? ` · ${statusLabel}` : ""}${isToday ? accessibilityLabels.todaySuffix : ""}`}
                        disabled={disabled}
                        hitSlop={CELL_GAP / 2}
                        style={({ pressed }) =>
                            pressed && !disabled ? [cellBaseStyle, PRESSED_CELL_STYLE] : cellBaseStyle
                        }
                        onPress={() => onSelectDay(day.dateKey, day.date, day.count)}
                    >
                        {day.status === "reserved" ? (
                            <View
                                pointerEvents="none"
                                style={{
                                    width: reservedDotSize,
                                    height: reservedDotSize,
                                    borderRadius: reservedDotSize / 2,
                                    backgroundColor: colors.primaryForeground,
                                }}
                            />
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
            {hasOverlayGlyphs ? (
                <Svg
                    pointerEvents="none"
                    accessible={false}
                    width={cellSize}
                    height={cellSize * 7 + CELL_GAP * 6}
                    style={{
                        position: "absolute",
                        top: monthLabelHeight + CELL_GAP,
                        left: 0,
                    }}
                >
                    {week.days.map((day, dayIndex) =>
                        hasSvgExceptionGlyph(day.status) ? (
                            <G
                                key={day.dateKey}
                                transform={`translate(${glyphOffset}, ${dayIndex * (cellSize + CELL_GAP) + glyphOffset}) scale(${glyphScale})`}
                            >
                                {renderStatusGlyphElements(day.status, colors.primaryForeground)}
                            </G>
                        ) : null,
                    )}
                </Svg>
            ) : null}
        </View>
    );
});
