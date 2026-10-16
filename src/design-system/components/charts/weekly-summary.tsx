import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { typography } from "@/design-system/utils/typography";
import { Host, Text } from "@expo/ui";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    FlatList,
    Pressable,
    View,
    type LayoutChangeEvent,
    type ViewProps,
} from "react-native";
import { cn } from "../../utils/cn";
import { useTheme } from "../../utils/theme";

import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { ActivityStatusLegend, type ActivityHeatmapStatus } from "./activity-heatmap";

export type WeeklySummaryValue = {
    weekStart: string | number | Date;
    total: number;
    status?: ActivityHeatmapStatus;
    statusBreakdown?: Partial<Record<ActivityHeatmapStatus, number>>;
    typeCounts?: { lesson: number; bay: number };
};
type WeeklyWeek = {
    weekStart: Date;
    total: number;
    status?: ActivityHeatmapStatus;
    statusBreakdown?: Partial<Record<ActivityHeatmapStatus, number>>;
    typeCounts?: { lesson: number; bay: number };
    label: string;
};

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
const MIN_BAR_HEIGHT = 3; // thin baseline sliver so zero weeks are still visible/tappable
const Y_AXIS_WIDTH = 32;
const CHART_GAP = 8;

export function WeeklySummary({
    values,
    startDate,
    endDate = new Date(),
    numWeeks = 12,
    initialScrollToEnd = false,
    overallCount,
    title,
    unitLabel = "activities",
    className,
    onWeekPress,
    ...props
}: WeeklySummaryProps) {
    const { colors: uiColors } = useTheme();
    const {
        t,
        i18n: { language },
    } = useTranslation();
    const { colors, fontScale: uiFontScale } = useTheme();
    const [containerWidth, setContainerWidth] = useState(0);
    const startDateKey = startDate ? weekKey(startDate) : "";
    const endDateKey = weekKey(endDate);
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
    const maxTotal = Math.max(2, Math.ceil(Math.max(0, ...weeks.map((w) => w.total)) / 2) * 2);
    const hasData = weeks.some((week) => week.total > 0);
    const rangeKey = weeks.length
        ? `${weekKey(weeks[0].weekStart)}-${weekKey(weeks[weeks.length - 1].weekStart)}`
        : "empty";

    const currentWeekKey = weekKey(parseCalendarDate(new Date()));
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
    const maxScrollX = Math.max(0, gridWidth - chartViewportWidth);

    const handleLayout = (event: LayoutChangeEvent) =>
        setContainerWidth(event.nativeEvent.layout.width);

    const scrollRef = useRef<FlatList<(typeof weeks)[number]>>(null);
    const autoScrolledRange = useRef<string | null>(null);
    useEffect(() => {
        if (autoScrolledRange.current === rangeKey || containerWidth === 0)
            return;
        const initialScrollX = initialScrollToEnd ? maxScrollX : 0;
        scrollRef.current?.scrollToOffset({
            offset: initialScrollX,
            animated: false,
        });
        autoScrolledRange.current = rangeKey;
    }, [containerWidth, initialScrollToEnd, maxScrollX, rangeKey]);

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
                selectedWeek={selectedWeek}
                unitLabel={unitLabel}
                colors={colors}
                onPress={handleBarPress}
            />
        ),
        [
            barWidth,
            plotHeight,
            colors,
            currentWeekKey,
            handleBarPress,
            maxTotal,
            selectedWeek,
            unitLabel,
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
                        textStyle={{
                            ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale,
                            color: uiColors.foreground,
                            fontSize: typography.h3.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
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
                                textStyle={{
                                    ...typography.subtext, lineHeight: typography.subtext.lineHeight * uiFontScale,
                                    color: uiColors.mutedForeground,
                                    fontSize: typography.subtext.fontSize * uiFontScale,
                                }}
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
                                textStyle={{
                                    ...typography.subtext, lineHeight: typography.subtext.lineHeight * uiFontScale,
                                    color: uiColors.mutedForeground,
                                    fontSize: typography.subtext.fontSize * uiFontScale,
                                }}
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
                                textStyle={{
                                    ...typography.subtext, lineHeight: typography.subtext.lineHeight * uiFontScale,
                                    color: uiColors.mutedForeground,
                                    fontSize: typography.subtext.fontSize * uiFontScale,
                                }}
                            >
                                {"0"}
                            </Text>
                        </Host>
                    </View>
                    <FlatList
                        ref={scrollRef}
                        data={weeks}
                        renderItem={renderBar}
                        extraData={selectedWeek}
                        initialScrollIndex={
                            initialScrollToEnd && needsScroll
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
                            textStyle={{
                                ...typography.subtext, lineHeight: typography.subtext.lineHeight * uiFontScale,
                                color: uiColors.mutedForeground,
                                textAlign: "left" as const,
                                fontSize:
                                    typography.subtext.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {t("activity.weekOf", {
                                date: selectedSummary.label,
                            }) +
                                " · " +
                                String(selectedSummary.total ?? "") +
                                " " +
                                unitLabel +
                                formatStatusBreakdown(
                                    selectedSummary.statusBreakdown,
                                )}
                        </Text>
                    </Host>
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={{
                                ...typography.subtext, lineHeight: typography.subtext.lineHeight * uiFontScale,
                                color: uiColors.mutedForeground,
                                textAlign: "left" as const,
                                fontSize:
                                    typography.subtext.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {formatTypeBreakdown(selectedSummary.typeCounts) ||
                                "-"}
                        </Text>
                    </Host>
                </View>
            ) : (
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.subtext, lineHeight: typography.subtext.lineHeight * uiFontScale,
                            color: uiColors.mutedForeground,
                            textAlign: "left" as const,
                            fontSize: typography.subtext.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {overallCount !== undefined
                            ? `${t("activity.overall")} · ${overallCount} ${unitLabel}`
                            : "-"}
                    </Text>
                </Host>
            )}
            {!hasData ? (
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.subtext, lineHeight: typography.subtext.lineHeight * uiFontScale,
                            textAlign: "center" as const,
                            color: uiColors.mutedForeground,
                            fontSize: typography.subtext.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
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
    selectedWeek,
    unitLabel,
    colors,
    onPress,
}: {
    week: WeeklyWeek;
    barWidth: number;
    plotHeight: number;
    maxTotal: number;
    currentWeekKey: string;
    selectedWeek: string | null;
    unitLabel: string;
    colors: ReturnType<typeof useTheme>["colors"];
    onPress: (weekStart: Date, total: number, key: string) => void;
}) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const key = weekKey(week.weekStart);
    const isCurrent = key === currentWeekKey;
    const isSelected = key === selectedWeek;
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
            accessibilityLabel={`${week.total} ${unitLabel} · ${t("activity.weekOf", { date: key })}${isCurrent ? ` (${t("activity.currentWeek")})` : ""}`}
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
                        opacity: selectedWeek && !isSelected ? 0.4 : 1,
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
            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: barWidth }}>
                <Text
                    textStyle={{
                        ...typography.subtext, lineHeight: typography.subtext.lineHeight * uiFontScale,
                        color: uiColors.mutedForeground,
                        fontSize: typography.subtext.fontSize * uiFontScale,
                        textAlign: "center",
                    }}
                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}
                >
                    {week.label}
                </Text>
            </Host>
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

function buildWeekSummaries(
    values: WeeklySummaryValue[],
    startDate: Date | undefined,
    endDate: Date,
    numWeeks: number,
    language: string,
) {
    const totals = new Map(values.map((v) => [weekKey(v.weekStart), v]));
    const start = parseCalendarDate(startDate ?? endDate);
    const end = parseCalendarDate(endDate);
    const startDayOfWeek = (start.getDay() + 6) % 7;
    const firstWeekStart = new Date(start);
    firstWeekStart.setDate(start.getDate() - startDayOfWeek);
    const daysSinceMonday = (end.getDay() + 6) % 7;
    const lastWeekStart = new Date(end);
    lastWeekStart.setDate(end.getDate() - daysSinceMonday);

    const weekCount = startDate
        ? Math.floor(
            (lastWeekStart.getTime() - firstWeekStart.getTime()) /
            (7 * 24 * 60 * 60 * 1000),
        ) + 1
        : numWeeks;

    const weeks: WeeklyWeek[] = [];
    for (let i = 0; i < weekCount; i++) {
        const weekStart = new Date(firstWeekStart);
        weekStart.setDate(firstWeekStart.getDate() + i * 7);
        const key = weekKey(weekStart);
        const value = totals.get(key);
        weeks.push({
            weekStart,
            total: value?.total ?? 0,
            status: value?.status,
            statusBreakdown: value?.statusBreakdown,
            typeCounts: value?.typeCounts,
            label: weekStart.toLocaleDateString(language, {
                month: "short",
                day: "numeric",
            }),
        });
    }
    return weeks;
}

function weekKey(date: string | number | Date) {
    const d = parseCalendarDate(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Same timezone-safe parsing as ActivityHeatmap — treats plain "YYYY-MM-DD"
// strings as local calendar dates instead of routing through UTC.
function parseCalendarDate(date: string | number | Date) {
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
        const [year, month, day] = date.slice(0, 10).split("-").map(Number);
        return new Date(year, month - 1, day);
    }
    const parsed = new Date(date);
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function formatStatusBreakdown(
    breakdown?: Partial<Record<ActivityHeatmapStatus, number>>,
) {
    if (!breakdown) return "";

    const labels: Record<ActivityHeatmapStatus, string> = {
        completed: i18n.t("activity.completed"),
        "no-show": i18n.t("activity.absent"),
        cancelled: i18n.t("activity.cancelled"),
        reserved: i18n.t("activity.booked"),
        mixed: i18n.t("activity.mixed"),
        unknown: i18n.t("activity.other"),
    };
    const details = Object.entries(breakdown)
        .filter(([, count]) => count && count > 0)
        .map(
            ([status, count]) =>
                `${count} ${labels[status as ActivityHeatmapStatus]}`,
        )
        .join(" · ");

    return details ? ` · ${details}` : "";
}

function formatTypeBreakdown(typeCounts?: { lesson: number; bay: number }) {
    if (!typeCounts) return "";

    const details = [
        typeCounts.bay > 0
            ? `${typeCounts.bay} ${i18n.t("activity.bay")}`
            : null,
        typeCounts.lesson > 0
            ? `${typeCounts.lesson} ${i18n.t("activity.lesson")}`
            : null,
    ]
        .filter(Boolean)
        .join(" · ");

    return details;
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
