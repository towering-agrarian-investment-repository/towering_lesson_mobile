import { Host, Text } from "@expo/ui";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { NativeText } from "../NativeText";
import { cn } from "../../utils/cn";
import { colorWithOpacity } from "../../utils/color";
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
import { chartLeadingModifiers, getChartTextStyles } from "./chart-text-styles";

export type {
  ActivityHeatmapStatus,
  ActivityHeatmapValue,
} from "./activity-chart-data";

export function ActivityStatusLegend({
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
  const { colors, fontScale } = useTheme();
  const textStyles = getChartTextStyles(colors, fontScale);
  const statuses = [
    { key: "reserved", label: getReservationStatusLabel("RESERVED", t), color: getActivityStatusColor("reserved", colors) },
    { key: "completed", label: getReservationStatusLabel("COMPLETED", t), color: getActivityStatusColor("completed", colors) },
    { key: "no-show", label: getReservationStatusLabel("NO_SHOW", t), color: getActivityStatusColor("no-show", colors) },
    ...(includeCancelled
      ? [{ key: "cancelled", label: getReservationStatusLabel("CANCELLED", t), color: getActivityStatusColor("cancelled", colors) }]
      : []),
    ...(includeMixed
      ? [{ key: "mixed", label: t("activity.mixed"), color: colors.warning }]
      : []),
  ];

  const legend = (
    <View
      className={cn(
        includeToday
          ? "flex-row items-center gap-3"
          : "flex-row flex-wrap items-center gap-x-4 gap-y-2",
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
          <Host matchContents ignoreSafeArea="all">
            <Text textStyle={textStyles.muted}>{t("activity.today")}</Text>
          </Host>
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
          <Host matchContents ignoreSafeArea="all">
            <Text textStyle={textStyles.muted}>{status.label}</Text>
          </Host>
        </View>
      ))}
    </View>
  );

  if (!includeToday) return legend;

  return (
    <ScrollView
      horizontal
      style={{ width: "100%" }}
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
  className?: string;
  selectedDateKey?: string | null;
  onDayPress?: (date: Date, count: number) => void;
  onTodayPress?: () => void;
};

const WEEKDAY_OFFSETS = [0, 1, 2, 3, 4, 5, 6];

export function ActivityHeatmap({
  values,
  endDate,
  numDays = 365,
  title,
  legend = true,
  className,
  selectedDateKey,
  onDayPress,
  onTodayPress,
  onLayout,
  ...props
}: ActivityHeatmapProps) {
  const { colors, fontScale } = useTheme();
  const { fontScale: deviceFontScale } = useWindowDimensions();
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const textStyles = getChartTextStyles(colors, fontScale);
  const todayKey = formatDateForAPI(new Date());
  const endDateKey = endDate ? toDateKey(endDate) : todayKey;
  const [containerWidth, setContainerWidth] = useState(0);
  const listRef = useRef<FlatList<ActivityHeatmapWeek>>(null);
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
  const todayWeekIndex = todayKey <= endDateKey
    ? weeks.findIndex((week) => week.days.some((day) => day.dateKey === todayKey))
    : -1;
  const [selection, setSelection] = useState<{
    rangeKey: string;
    dateKey: string;
  } | null>(null);
  const selectedDay = selectedDateKey !== undefined
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
    return WEEKDAY_OFFSETS.map((offset) =>
      formatter.format(new Date(2024, 0, 1 + offset)),
    );
  }, [language, useShortWeekdays]);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [language],
  );
  const focusMonthWeekIndex = useMemo(
    () => getFocusMonthWeekIndex(weeks, endDateKey, todayKey),
    [weeks, endDateKey, todayKey],
  );
  const {
    axisFontSize,
    labelColumnWidth,
    monthLabelHeight,
    availableWidth,
    cellSize,
  } = getActivityHeatmapLayout(containerWidth, deviceFontScale, language);
  // Exactly 12 whole weeks fit the width, so no column is cut off at the right edge.
  // The shared layout also sizes the loading grid to these columns.
  const visibleWeeks = Math.max(
    1,
    Math.ceil(availableWidth / (cellSize + CELL_GAP)) + 1,
  );
  const initialWeekIndex = todayWeekIndex >= 0
    ? Math.max(0, todayWeekIndex - Math.floor(visibleWeeks / 2))
    : focusMonthWeekIndex;
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
      setSelection({ rangeKey, dateKey });
      onDayPress?.(date, count);
    },
    [onDayPress, rangeKey],
  );
  const handleTodayPress = () => {
    if (todayWeekIndex >= 0) {
      setSelection({ rangeKey, dateKey: todayKey });
      onDayPress?.(parseCalendarDate(todayKey), valuesByDate.get(todayKey)?.count ?? 0);
      listRef.current?.scrollToIndex({ index: todayWeekIndex, animated: true, viewPosition: 0.5 });
    } else {
      onTodayPress?.();
    }
  };
  const renderWeek = useCallback(
    ({ item: week }: { item: ActivityHeatmapWeek }) => (
      <HeatmapWeekColumn
        week={week}
        cellSize={cellSize}
        axisFontSize={axisFontSize}
        monthLabelHeight={monthLabelHeight}
        todayKey={todayKey}
        selectedDay={
          selectedDay &&
          selectedDay >= week.days[0].dateKey &&
          selectedDay <= week.days[6].dateKey
            ? selectedDay
            : null
        }
        colors={colors}
        dateFormatter={dateFormatter}
        onSelectDay={handleSelectDay}
      />
    ),
    [
      cellSize,
      axisFontSize,
      monthLabelHeight,
      todayKey,
      selectedDay,
      colors,
      dateFormatter,
      handleSelectDay,
    ],
  );

  return (
    <View
      {...props}
      className={cn("w-full gap-3", className)}
      onLayout={handleLayout}
    >
      {title ? (
        <Host
          matchContents={{ vertical: true }}
          ignoreSafeArea="all"
          style={{ width: "100%" }}
        >
          <Text textStyle={textStyles.title} modifiers={chartLeadingModifiers}>
            {title}
          </Text>
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
              y={WEEKDAY_OFFSETS[index] * (cellSize + CELL_GAP) + cellSize / 2}
              alignmentBaseline="central"
              fontSize={axisFontSize}
              fill={colors.mutedForeground}
            >
              {label}
            </SvgText>
          ))}
        </Svg>
        {containerWidth > 0 ? (
          <View style={{ flex: 1 }}>
            <FlatList
              ref={listRef}
              key={rangeKey}
              data={weeks}
              renderItem={renderWeek}
              extraData={selectedDay}
              initialScrollIndex={weeks.length ? initialWeekIndex : undefined}
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
              snapToInterval={cellSize + CELL_GAP}
              decelerationRate="fast"
              style={{ flex: 1 }}
              showsHorizontalScrollIndicator
              contentContainerStyle={{ paddingBottom: 12 }}
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
                colors={[
                  colors.background,
                  colorWithOpacity(colors.background, 0),
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 12,
                  left: 0,
                  width: cellSize,
                }}
              />
            ) : null}
            {visibleEdges.right ? (
              <LinearGradient
                pointerEvents="none"
                colors={[
                  colorWithOpacity(colors.background, 0),
                  colors.background,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 12,
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
          includeToday
          includeCancelled={values.some((value) =>
            value.status === "cancelled" || (value.statusBreakdown?.cancelled ?? 0) > 0
          )}
          onTodayPress={handleTodayPress}
        />
      ) : null}
      {selectedDay ? (
        <View className="flex-row items-center justify-between gap-3">
          <NativeText variant="h3" style={{ flex: 1, minWidth: 0 }}>
            {formatActivityDate(selectedDay, language)}
          </NativeText>
          <NativeText variant="subtext" color="mutedForeground" align="right" wrap={false} textStyle={{ fontWeight: "600" }}>
            {t("activity.sessionCount", { count: selectedValue?.count ?? 0 })}
          </NativeText>
        </View>
      ) : null}
    </View>
  );
}

// Draw a status icon inside supported cells alongside their accessible labels.
function StatusGlyph({ status, size }: { status: ActivityHeatmapStatus; size: number }) {
  if (status === "cancelled" || status === "unknown") return null;
  const ink = status === "mixed" || status === "checked-in" ? "#3B2400" : "#FFFFFF";
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      accessible={false}
      pointerEvents="none"
    >
      {status === "completed" || status === "checked-in" ? (
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
          <Circle
            cx={6}
            cy={6}
            r={3.8}
            fill="none"
            stroke={ink}
            strokeWidth={1.7}
          />
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
  colors,
  dateFormatter,
  onSelectDay,
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
            <SvgText
              x={0}
              y={axisFontSize}
              fontSize={axisFontSize}
              fill={colors.mutedForeground}
            >
              {week.monthLabel}
            </SvgText>
          </Svg>
        ) : null}
      </View>
      {week.days.map((day) => {
        const isToday = day.dateKey === todayKey;
        const isSelected = day.dateKey === selectedDay;
        const statusLabel = day.status === "mixed"
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
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${t("activity.activityCount", { count: day.count })} ${t("activity.onDate", { date: dateFormatter.format(day.date) })}${statusLabel ? ` · ${statusLabel}` : ""}${isToday ? ` (${t("activity.today")})` : ""}`}
            hitSlop={CELL_GAP / 2}
            style={{
              width: cellSize,
              height: cellSize,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: CELL_RADIUS,
              backgroundColor: getHeatmapCellColor(
                day.count,
                colors,
                day.status,
              ),
              borderWidth: isSelected || isToday ? 1.5 : 0,
              borderColor: isSelected ? colors.foreground : colors.primary,
            }}
            onPress={() => onSelectDay(day.dateKey, day.date, day.count)}
          >
            {day.status ? (
              <StatusGlyph
                status={day.status}
                size={Math.round(cellSize * 0.5)}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
});
