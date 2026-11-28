import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import {
    getActivityStatusColor,
    toDateKey,
    type ActivityHeatmapValue,
} from "@/design-system/components/charts/activity-chart-data";
import { colorWithOpacity } from "@/design-system/utils/color";
import { getThemeColors, useTheme } from "@/design-system/utils/theme";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef, memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Text, View, type TextStyle } from "react-native";
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from "react-native-svg";
import layout from "../../../assets/HappyGolf_ShareCard_V4/spec/layout_v4.json";
import { ShareCardHeader } from "./ShareCardHeader";
import {
    getShareCardLocale,
    SHARE_CARD_CORNER_RADIUS,
    SHARE_CARD_HEIGHT,
    SHARE_CARD_WIDTH,
    usesLatinShareCardText,
} from "./monthly-share-card-layout";

type YearlyShareCardProps = {
    year: number;
    width: number;
    dailyValues: ActivityHeatmapValue[];
    totalReservations: number;
    hoursPlayed: number;
    scheme?: "light" | "dark";
    loadingValues?: boolean;
    memberName?: string;
    memberImage?: string | null;
    onReadyChange: (ready: boolean) => void;
    onAssetError: () => void;
};

const dayDecoration = require("../../../assets/HappyGolf_ShareCard_V4/assets/decorations_minimal_v4.png");
const darkDecoration = require("../../../assets/HappyGolf_ShareCard_V4/assets/decorations_minimal_v4_dark_clear.png");

const YEARLY_GRID_ORIGIN_X = 42;
const YEARLY_GRID_ORIGIN_Y = 510;
const YEARLY_GRID_WIDTH = 1009;
const YEARLY_GRID_HEIGHT = 580;

function roundedRectSubpath(x: number, y: number, w: number, h: number, r: number) {
    return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`;
}

function createYearlyFormatters(language: string) {
    const weekdayFormatter = new Intl.DateTimeFormat(language, {
        weekday: "narrow",
        calendar: "gregory",
        timeZone: "UTC",
    });
    return {
        numberFormatter: new Intl.NumberFormat(language),
        hoursFormatter: new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        yearFormatter: new Intl.NumberFormat(language, { useGrouping: false }),
        monthFormatter: new Intl.DateTimeFormat(language, { month: "long", calendar: "gregory", timeZone: "UTC" }),
        weekdays: Array.from({ length: 7 }, (_, column) => weekdayFormatter.format(Date.UTC(2024, 0, column + 1))),
    };
}

const formattersByLanguage = new Map<string, ReturnType<typeof createYearlyFormatters>>();

function getYearlyFormatters(language: string) {
    let formatters = formattersByLanguage.get(language);
    if (!formatters) {
        formatters = createYearlyFormatters(language);
        formattersByLanguage.set(language, formatters);
    }
    return formatters;
}

/** Annual activity on the same export canvas as the monthly card. */
export const YearlyShareCard = memo(
    forwardRef<React.ElementRef<typeof View>, YearlyShareCardProps>(function YearlyShareCard(
        {
            year,
            width,
            dailyValues,
            totalReservations,
            hoursPlayed,
            scheme,
            loadingValues = false,
            memberName,
            memberImage,
            onReadyChange,
            onAssetError,
        },
        ref,
    ) {
        const { resolvedScheme, primaryColorPreference } = useTheme();
        const posterScheme = scheme ?? resolvedScheme;
        const colors = getThemeColors(posterScheme, primaryColorPreference);
        const { t, i18n } = useTranslation();
        const language = getShareCardLocale(i18n.language);
        const latin = usesLatinShareCardText(language);
        const tallScript = /^km(-|$)/i.test(language);
        const copy = i18n.getFixedT(language, "translation", "shareCard");
        const dark = posterScheme === "dark";
        const canvas = colors.card;
        const ink = dark ? colors.foreground : layout.style.textDark;
        const mutedInk = dark ? colors.mutedForeground : layout.style.textMuted;
        const scale = width / SHARE_CARD_WIDTH;
        const artSource = dark ? darkDecoration : dayDecoration;
        const [loadedArtSource, setLoadedArtSource] = useState<number | null>(null);
        const [layoutReady, setLayoutReady] = useState(false);
        const [loadedAvatarUri, setLoadedAvatarUri] = useState<string | null>(null);
        const [failedAvatarUri, setFailedAvatarUri] = useState<string | null>(null);
        const artReady = loadedArtSource === artSource;
        const avatarFailed = Boolean(memberImage) && failedAvatarUri === memberImage;
        const avatarReady = !memberImage || loadedAvatarUri === memberImage || avatarFailed;
        const ready = artReady && layoutReady && avatarReady;

        useEffect(() => {
            onReadyChange(ready);
        }, [ready, onReadyChange]);

        useEffect(() => {
            return () => onReadyChange(false);
        }, [onReadyChange]);

        const pos = (x: number, y: number, w: number, h: number) => ({
            position: "absolute" as const,
            left: x * scale,
            top: y * scale,
            width: w * scale,
            height: h * scale,
        });
        const type = (size: number, line: number, weight: TextStyle["fontWeight"], color = ink): TextStyle => ({
            fontSize: size * scale,
            lineHeight: line * scale,
            fontWeight: weight,
            color,
            includeFontPadding: false,
        });
        const { numberFormatter, hoursFormatter, yearFormatter, monthFormatter, weekdays } =
            getYearlyFormatters(language);
        const countLabel = numberFormatter.format(totalReservations);
        const hoursLabel = hoursFormatter.format(hoursPlayed);
        const hourUnit = copy("hourShort");
        const yearLabel = yearFormatter.format(year);
        const byDate = new Map(
            dailyValues
                .filter((day) => toDateKey(day.date).startsWith(`${year}-`))
                .map((day) => [toDateKey(day.date), day]),
        );
        const name = memberName || t("activity.golfer");
        const satIdleFill = colorWithOpacity(colors.primary, dark ? 0.2 : 0.12);
        const sunIdleFill = colorWithOpacity(colors.danger, dark ? 0.2 : 0.12);
        const monthMeta = Array.from({ length: 12 }, (_, month) => {
            const x = YEARLY_GRID_ORIGIN_X + (month % 4) * 258;
            const y = YEARLY_GRID_ORIGIN_Y + Math.floor(month / 4) * 197;
            const monthLabel = monthFormatter.format(new Date(Date.UTC(year, month, 1)));
            const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
            const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
            return { month, x, y, monthLabel, offset, daysInMonth };
        });
        const cellPathsByFill = new Map<string, string[]>();
        for (const { month, offset, daysInMonth } of monthMeta) {
            const monthOriginX = (month % 4) * 258;
            const monthOriginY = Math.floor(month / 4) * 197;
            const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
            for (let index = 0; index < 42; index++) {
                const day = index - offset + 1;
                const dateKey = day >= 1 && day <= daysInMonth ? `${monthPrefix}${String(day).padStart(2, "0")}` : null;
                const activity = dateKey ? byDate.get(dateKey) : undefined;
                const active = !loadingValues && Boolean(activity && activity.count > 0);
                const column = index % 7;
                const fill = active
                    ? getActivityStatusColor(activity?.status, colors)
                    : column === 5
                      ? satIdleFill
                      : column === 6
                        ? sunIdleFill
                        : colors.muted;
                const rx = monthOriginX + 12 + column * 30;
                const ry = monthOriginY + 55 + Math.floor(index / 7) * 21;
                let segments = cellPathsByFill.get(fill);
                if (!segments) {
                    segments = [];
                    cellPathsByFill.set(fill, segments);
                }
                segments.push(roundedRectSubpath(rx, ry, 25, 17, 4));
            }
        }
        const batchedCellPaths = Array.from(cellPathsByFill, ([fill, segments]) => ({
            fill,
            d: segments.join(""),
        }));

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
                {dark && (
                    <LinearGradient
                        colors={[
                            colorWithOpacity(colors.reservationCompleted, 0.24),
                            canvas,
                            colorWithOpacity(colors.reservationCompleted, 0.18),
                        ]}
                        locations={[0, 0.55, 1]}
                        style={pos(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT)}
                    />
                )}
                <Image
                    source={artSource}
                    resizeMode="stretch"
                    style={pos(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT)}
                    onLoad={() => setLoadedArtSource(artSource)}
                    onError={onAssetError}
                />
                {!dark && (
                    <>
                        <Svg viewBox="0 0 150 124" style={pos(967, 109, 150, 124)}>
                            <Defs>
                                <RadialGradient id="cleanYearSky">
                                    <Stop offset="66%" stopColor="#D0F3FD" stopOpacity="1" />
                                    <Stop offset="100%" stopColor="#D0F3FD" stopOpacity="0" />
                                </RadialGradient>
                            </Defs>
                            <Ellipse cx="75" cy="62" rx="75" ry="62" fill="url(#cleanYearSky)" />
                        </Svg>
                        <View
                            style={{
                                ...pos(36, 190, 98, 115),
                                backgroundColor: canvas,
                            }}
                        />
                        <View
                            style={{
                                ...pos(340, 220, 95, 120),
                                backgroundColor: canvas,
                            }}
                        />
                    </>
                )}

                <ShareCardHeader
                    periodLabel={yearLabel}
                    totalReservations={totalReservations}
                    hoursPlayed={hoursPlayed}
                    loadingValues={loadingValues}
                    width={width}
                    scheme={posterScheme}
                />

                {monthMeta.map(({ month, x, y, monthLabel }) => (
                    <View
                        key={month}
                        style={{
                            ...pos(x, y, 235, 186),
                            borderRadius: 18 * scale,
                            backgroundColor: colors.surface,
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
                                type(22, tallScript ? 31 : 27, "800", ink),
                                {
                                    letterSpacing: latin ? 2 * scale : 0,
                                },
                            ]}
                        >
                            {latin ? monthLabel.toLocaleUpperCase(language) : monthLabel}
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
                                        column === 5 ? colors.primary : column === 6 ? colors.danger : mutedInk,
                                    ),
                                    { textAlign: "center" },
                                ]}
                            >
                                {latin ? weekday.toLocaleUpperCase(language) : weekday}
                            </Text>
                        ))}
                    </View>
                ))}
                <Svg
                    pointerEvents="none"
                    width={YEARLY_GRID_WIDTH * scale}
                    height={YEARLY_GRID_HEIGHT * scale}
                    viewBox={`0 0 ${YEARLY_GRID_WIDTH} ${YEARLY_GRID_HEIGHT}`}
                    style={pos(YEARLY_GRID_ORIGIN_X, YEARLY_GRID_ORIGIN_Y, YEARLY_GRID_WIDTH, YEARLY_GRID_HEIGHT)}
                >
                    {batchedCellPaths.map(({ fill, d }) => (
                        <Path key={fill} d={d} fill={fill} />
                    ))}
                </Svg>

                <View
                    style={{
                        ...pos(68, 1110, 964, 2),
                        backgroundColor: colors.border,
                    }}
                />
                <View
                    style={{
                        ...pos(88, 1130, 126, 126),
                        borderRadius: 63 * scale,
                        overflow: "hidden",
                        backgroundColor: colors.primary,
                    }}
                >
                    {memberImage && !avatarFailed ? (
                        <Image
                            source={{ uri: memberImage }}
                            resizeMode="cover"
                            style={{ width: "100%", height: "100%" }}
                            onLoad={() => setLoadedAvatarUri(memberImage)}
                            onError={() => {
                                setFailedAvatarUri(memberImage);
                            }}
                        />
                    ) : (
                        <>
                            <View
                                style={{
                                    position: "absolute",
                                    left: 41 * scale,
                                    top: 22 * scale,
                                    width: 44 * scale,
                                    height: 44 * scale,
                                    borderRadius: 22 * scale,
                                    backgroundColor: colors.primaryForeground,
                                }}
                            />
                            <View
                                style={{
                                    position: "absolute",
                                    left: 22 * scale,
                                    top: 72 * scale,
                                    width: 82 * scale,
                                    height: 70 * scale,
                                    borderRadius: 41 * scale,
                                    backgroundColor: colors.primaryForeground,
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
                    style={[pos(244, 1153, 420, tallScript ? 65 : 56), type(45, tallScript ? 63 : 54, "800")]}
                >
                    {name}
                </Text>
                <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.55}
                    style={[
                        pos(244, 1206, 415, tallScript ? 42 : 38),
                        type(28, tallScript ? 40 : 36, "700", mutedInk),
                        { letterSpacing: latin ? 3 * scale : 0 },
                    ]}
                >
                    {copy("member")}
                </Text>
                <View
                    style={{
                        ...pos(696, 1147, 324, 104),
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <HappyGolfLogo width={324 * scale} height={77 * scale} primaryColor={colors.primary} />
                </View>
            </View>
        );
    }),
);
