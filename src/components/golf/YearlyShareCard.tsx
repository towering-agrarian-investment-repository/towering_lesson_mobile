import {
    getActivityStatusColor,
    toDateKey,
    type ActivityHeatmapValue,
} from "@/design-system/components/charts/activity-chart-data";
import { useTheme } from "@/design-system/utils/theme";
import { Image } from "expo-image";
import { forwardRef, memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View, type TextStyle } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { ShareCardBackdrop, ShareCardHeader } from "./ShareCardHeader";
import {
    getShareCardLocale,
    getShareCardThemePalette,
    SHARE_CARD_CORNER_RADIUS,
    SHARE_CARD_HEIGHT,
    SHARE_CARD_WIDTH,
    usesLatinShareCardText,
    type ShareCardTheme,
} from "./monthly-share-card-layout";

type YearlyShareCardProps = {
    year: number;
    width: number;
    dailyValues: ActivityHeatmapValue[];
    totalReservations: number;
    hoursPlayed: number;
    theme?: ShareCardTheme;
    loadingValues?: boolean;
    memberName?: string;
    memberImage?: string | null;
    onReadyChange: (ready: boolean) => void;
    onAssetError: () => void;
};

/** Pure vector annual scorecard poster on the exact same export canvas. */
export const YearlyShareCard = memo(
    forwardRef<React.ElementRef<typeof View>, YearlyShareCardProps>(
        function YearlyShareCard(
            {
                year,
                width,
                dailyValues,
                totalReservations,
                hoursPlayed,
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
            const latin = usesLatinShareCardText(language);
            const tallScript = /^km(-|$)/i.test(language);
            const copy = i18n.getFixedT(language, "translation", "shareCard");
            const palette = getShareCardThemePalette(theme, colors);
            const canvas = palette.canvas;
            const ink = palette.ink;
            const mutedInk = palette.mutedInk;
            const scale = width / SHARE_CARD_WIDTH;
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
            const numberFormatter = new Intl.NumberFormat(language);
            const countLabel = numberFormatter.format(totalReservations);
            const hoursLabel = new Intl.NumberFormat(language, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
            }).format(hoursPlayed);
            const hourUnit = copy("hourShort");
            const yearLabel = new Intl.NumberFormat(language, {
                useGrouping: false,
            }).format(year);
            const monthFormatter = new Intl.DateTimeFormat(language, {
                month: "long",
                calendar: "gregory",
                timeZone: "UTC",
            });
            const weekdayFormatter = new Intl.DateTimeFormat(language, {
                weekday: "narrow",
                calendar: "gregory",
                timeZone: "UTC",
            });
            const weekdays = Array.from({ length: 7 }, (_, column) =>
                weekdayFormatter.format(new Date(Date.UTC(2024, 0, column + 1))),
            );
            const yearValues = dailyValues.filter((day) =>
                toDateKey(day.date).startsWith(`${year}-`),
            );
            const activeDays = yearValues.filter((day) => day.count > 0).length;
            const byDate = new Map(
                yearValues.map((day) => [toDateKey(day.date), day]),
            );
            const name = memberName || t("activity.golfer");

            return (
                <View
                    ref={ref}
                    collapsable={false}
                    accessible
                    accessibilityRole="image"
                    accessibilityLabel={
                        loadingValues
                            ? `${yearLabel}, ${t("activity.loading")}`
                            : `${yearLabel}, ${countLabel} ${copy("reservations")}, ${hoursLabel} ${hourUnit}, ${name}`
                    }
                    onLayout={() => setLayoutReady(true)}
                    style={{
                        width,
                        height: SHARE_CARD_HEIGHT * scale,
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
                        gradientId="yearlyPosterSpot"
                    />

                    <ShareCardHeader
                        periodLabel={yearLabel}
                        totalReservations={totalReservations}
                        hoursPlayed={hoursPlayed}
                        activeDays={activeDays}
                        loadingValues={loadingValues}
                        width={width}
                        theme={theme}
                    />

                    {Array.from({ length: 12 }, (_, month) => {
                        const x = 42 + (month % 4) * 258;
                        const y = 510 + Math.floor(month / 4) * 197;
                        const monthLabel = monthFormatter.format(
                            new Date(Date.UTC(year, month, 1)),
                        );
                        const offset =
                            (new Date(Date.UTC(year, month, 1)).getUTCDay() +
                                6) %
                            7;
                        const daysInMonth = new Date(
                            Date.UTC(year, month + 1, 0),
                        ).getUTCDate();
                        return (
                            <View
                                key={month}
                                style={{
                                    ...pos(x, y, 235, 186),
                                    borderRadius: 18 * scale,
                                    backgroundColor: palette.miniCardBg,
                                }}
                            >
                                <Text
                                    allowFontScaling={false}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.65}
                                    style={[
                                        {
                                            position: "absolute",
                                            left: 12 * scale,
                                            top: 7 * scale,
                                            width: 211 * scale,
                                        },
                                        type(
                                            22,
                                            tallScript ? 31 : 27,
                                            "800",
                                            ink,
                                        ),
                                        { letterSpacing: latin ? 2 * scale : 0 },
                                    ]}
                                >
                                    {latin
                                        ? monthLabel.toLocaleUpperCase(language)
                                        : monthLabel}
                                </Text>
                                {weekdays.map((weekday, column) => (
                                    <Text
                                        key={column}
                                        allowFontScaling={false}
                                        numberOfLines={1}
                                        style={[
                                            {
                                                position: "absolute",
                                                left: (12 + column * 30) * scale,
                                                top: 35 * scale,
                                                width: 25 * scale,
                                            },
                                            type(
                                                14,
                                                18,
                                                "700",
                                                column === 5
                                                    ? palette.satText
                                                    : column === 6
                                                      ? palette.sunText
                                                      : mutedInk,
                                            ),
                                            { textAlign: "center" },
                                        ]}
                                    >
                                        {latin
                                            ? weekday.toLocaleUpperCase(language)
                                            : weekday}
                                    </Text>
                                ))}
                                <Svg
                                    width={235 * scale}
                                    height={186 * scale}
                                    viewBox="0 0 235 186"
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                    }}
                                >
                                    {Array.from({ length: 42 }, (_, index) => {
                                        const day = index - offset + 1;
                                        const dateKey =
                                            day >= 1 && day <= daysInMonth
                                                ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                                                : null;
                                        const activity = dateKey
                                            ? byDate.get(dateKey)
                                            : undefined;
                                        const active =
                                            !loadingValues &&
                                            Boolean(
                                                activity && activity.count > 0,
                                            );
                                        const column = index % 7;
                                        const fill = active
                                            ? getActivityStatusColor(
                                                  activity?.status,
                                                  colors,
                                              )
                                            : column === 5
                                              ? palette.satBg
                                              : column === 6
                                                ? palette.sunBg
                                                : palette.cellBg;
                                        return (
                                            <Rect
                                                key={index}
                                                x={12 + column * 30}
                                                y={
                                                    55 +
                                                    Math.floor(index / 7) * 21
                                                }
                                                width={25}
                                                height={17}
                                                rx={4}
                                                fill={fill}
                                            />
                                        );
                                    })}
                                </Svg>
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
                        {latin
                            ? copy("member").toLocaleUpperCase(language)
                            : copy("member")}
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
                        {yearLabel}
                    </Text>
                </View>
            );
        },
    ),
);
