import {
    getActivityStatusColor,
    toDateKey,
    type ActivityHeatmapValue,
} from "@/design-system/components/charts/activity-chart-data";
import { useTheme } from "@/design-system/utils/theme";
import { Image } from "expo-image";
import { forwardRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View, type TextStyle } from "react-native";
import layout from "../../../assets/HappyGolf_ShareCard_V4/spec/layout_v4.json";
import { ShareCardBackdrop, ShareCardHeader } from "./ShareCardHeader";
import {
    formatShareCardMonth,
    getShareCardCalendar,
    getShareCardLocale,
    getShareCardThemePalette,
    SHARE_CARD_CORNER_RADIUS,
    SHARE_CARD_HEIGHT,
    SHARE_CARD_WIDTH,
    usesLatinShareCardText,
    type ShareCardTheme,
} from "./monthly-share-card-layout";

type MonthlyGolfShareCardProps = {
    year: number;
    month: number;
    width: number;
    dailyValues: ActivityHeatmapValue[];
    hoursOnCourse: number;
    theme?: ShareCardTheme;
    loadingValues?: boolean;
    memberName?: string;
    memberImage?: string | null;
    onReadyChange: (ready: boolean) => void;
    onAssetError: () => void;
};

const { components: measured } = layout;

/** Pure vector monthly golf scorecard poster. */
export const MonthlyGolfShareCard = forwardRef<
    React.ElementRef<typeof View>,
    MonthlyGolfShareCardProps
>(function MonthlyGolfShareCard(
    {
        year,
        month,
        width,
        dailyValues,
        hoursOnCourse,
        theme = "midnight",
        loadingValues = false,
        memberName,
        memberImage,
        onReadyChange,
    },
    ref,
) {
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const language = getShareCardLocale(i18n.language);
    const copy = i18n.getFixedT(language, "translation", "shareCard");
    const latin = usesLatinShareCardText(language);
    const tallScript = /^km(-|$)/i.test(language);
    const scale = width / SHARE_CARD_WIDTH;
    const height = SHARE_CARD_HEIGHT * scale;
    const palette = getShareCardThemePalette(theme, colors);
    const ink = palette.ink;
    const mutedInk = palette.mutedInk;
    const canvas = palette.canvas;
    const [layoutReady, setLayoutReady] = useState(false);
    const [avatarReady, setAvatarReady] = useState(false);
    const [avatarFailed, setAvatarFailed] = useState(false);
    const ready = layoutReady && (!memberImage || avatarReady);

    useEffect(() => {
        onReadyChange(ready);
        return () => onReadyChange(false);
    }, [ready, onReadyChange]);

    const pos = (x: number, y: number, w: number, h: number) => ({
        position: "absolute" as const,
        left: x * scale,
        top: y * scale,
        width: w * scale,
        height: h * scale,
    });
    const type = (
        size: number,
        line: number,
        weight: TextStyle["fontWeight"],
        color = ink,
    ): TextStyle => ({
        fontSize: size * scale,
        lineHeight: line * scale,
        fontWeight: weight,
        color,
        includeFontPadding: false,
    });
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
    const values = dailyValues.filter((day) =>
        toDateKey(day.date).startsWith(monthPrefix),
    );
    const byDate = new Map(values.map((day) => [toDateKey(day.date), day]));
    const count = values.reduce((sum, day) => sum + day.count, 0);
    const activeDays = values.filter((day) => day.count > 0).length;
    const countLabel = new Intl.NumberFormat(language).format(count);
    const monthLabel = formatShareCardMonth(year, month, language);
    const yearStamp = new Intl.NumberFormat(language, {
        useGrouping: false,
    }).format(year);
    const hoursLabel = new Intl.NumberFormat(language, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(hoursOnCourse);
    const hourUnit = copy("hourShort");
    const calendar = getShareCardCalendar(year, month, language);
    const name = memberName || t("activity.golfer");

    return (
        <View
            ref={ref}
            collapsable={false}
            accessible
            accessibilityRole="image"
            accessibilityLabel={
                loadingValues
                    ? `${monthLabel}, ${t("activity.loading")}`
                    : `${monthLabel}, ${countLabel} ${copy("reservations")}, ${hoursLabel} ${hourUnit}, ${name}`
            }
            onLayout={() => setLayoutReady(true)}
            style={{
                width,
                height,
                position: "relative",
                overflow: "hidden",
                borderRadius: SHARE_CARD_CORNER_RADIUS * scale,
                backgroundColor: canvas,
                direction: "ltr",
            }}
        >
            <ShareCardBackdrop
                width={width}
                theme={theme}
                gradientId="monthlyPosterSpot"
            />

            <ShareCardHeader
                periodLabel={monthLabel}
                totalReservations={count}
                hoursPlayed={hoursOnCourse}
                activeDays={activeDays}
                loadingValues={loadingValues}
                width={width}
                theme={theme}
            />

            {calendar.weekdays.map((weekday, column) => (
                <Text
                    key={column}
                    allowFontScaling={false}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                    style={[
                        pos(
                            measured.calendarWeekdays.centersX[column] - 67,
                            511,
                            134,
                            32,
                        ),
                        type(
                            21,
                            30,
                            "700",
                            column === 5
                                ? palette.satText
                                : column === 6
                                  ? palette.sunText
                                  : mutedInk,
                        ),
                        {
                            textAlign: "center",
                            letterSpacing: latin ? 3 * scale : 0,
                        },
                    ]}
                >
                    {latin ? weekday.toLocaleUpperCase(language) : weekday}
                </Text>
            ))}

            {calendar.cells.map((cell, index) => {
                const activity = cell.dateKey
                    ? byDate.get(cell.dateKey)
                    : undefined;
                const active =
                    !loadingValues && Boolean(activity && activity.count > 0);
                const selectedColor = getActivityStatusColor(
                    activity?.status,
                    colors,
                );
                const backgroundColor = active
                    ? selectedColor
                    : cell.column === 5
                      ? palette.satBg
                      : cell.column === 6
                        ? palette.sunBg
                        : palette.cellBg;
                const color = active
                    ? colors.primaryForeground
                    : cell.column === 5
                      ? palette.satText
                      : cell.column === 6
                        ? palette.sunText
                        : mutedInk;
                return (
                    <View
                        key={index}
                        style={{
                            ...pos(cell.x, cell.y, cell.width, cell.height),
                            borderRadius: 20 * scale,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor,
                        }}
                    >
                        {cell.inMonth ? (
                            <Text
                                allowFontScaling={false}
                                style={type(
                                    34,
                                    44,
                                    active ? "800" : "500",
                                    color,
                                )}
                            >
                                {cell.label}
                            </Text>
                        ) : null}
                    </View>
                );
            })}

            <View
                style={{
                    ...pos(68, 1110, 986, 2),
                    backgroundColor: palette.divider,
                }}
            />

            <View
                style={{
                    ...pos(68, 1166, 122, 122),
                    borderRadius: 61 * scale,
                    overflow: "hidden",
                    backgroundColor: palette.avatarBg,
                }}
            >
                {memberImage && !avatarFailed ? (
                    <Image
                        source={{ uri: memberImage }}
                        cachePolicy="memory-disk"
                        recyclingKey={memberImage}
                        contentFit="cover"
                        transition={0}
                        style={{ width: "100%", height: "100%" }}
                        onLoad={() => setAvatarReady(true)}
                        onError={() => {
                            setAvatarFailed(true);
                            setAvatarReady(true);
                        }}
                    />
                ) : (
                    <>
                        <View
                            style={{
                                position: "absolute",
                                left: 40 * scale,
                                top: 22 * scale,
                                width: 42 * scale,
                                height: 42 * scale,
                                borderRadius: 21 * scale,
                                backgroundColor: palette.avatarGlyph,
                            }}
                        />
                        <View
                            style={{
                                position: "absolute",
                                left: 21 * scale,
                                top: 70 * scale,
                                width: 80 * scale,
                                height: 68 * scale,
                                borderRadius: 40 * scale,
                                backgroundColor: palette.avatarGlyph,
                            }}
                        />
                    </>
                )}
            </View>

            <Text
                allowFontScaling={false}
                numberOfLines={1}
                ellipsizeMode="tail"
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                style={[
                    pos(218, 1178, 560, tallScript ? 65 : 56),
                    type(44, tallScript ? 62 : 52, "800"),
                ]}
            >
                {name}
            </Text>

            <Text
                allowFontScaling={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.55}
                style={[
                    pos(218, 1236, 560, tallScript ? 42 : 36),
                    type(24, tallScript ? 38 : 32, "700", mutedInk),
                    { letterSpacing: latin ? 3 * scale : 0 },
                ]}
            >
                {latin ? copy("member").toLocaleUpperCase(language) : copy("member")}
            </Text>

            <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={[
                    pos(804, 1200, 250, 48),
                    type(34, 42, "800", mutedInk),
                    {
                        textAlign: "right",
                        fontVariant: ["tabular-nums"],
                        letterSpacing: 2 * scale,
                    },
                ]}
            >
                {yearStamp}
            </Text>
        </View>
    );
});
