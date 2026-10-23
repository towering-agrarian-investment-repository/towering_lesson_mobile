import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { getActivityStatusColor, toDateKey, type ActivityHeatmapValue } from "@/design-system/components/charts/activity-chart-data";
import { colorWithOpacity } from "@/design-system/utils/color";
import { reservationStatusColors, useTheme } from "@/design-system/utils/theme";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import layout from "../../../assets/HappyGolf_ShareCard_V4/spec/layout_v4.json";
import { forwardRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Text, View, type TextStyle } from "react-native";
import { ShareCardHeader } from "./ShareCardHeader";
import { formatShareCardMonth, getShareCardCalendar, getShareCardLocale, SHARE_CARD_CORNER_RADIUS, SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH, usesLatinShareCardText } from "./monthly-share-card-layout";

type MonthlyGolfShareCardProps = {
    year: number;
    month: number;
    width: number;
    dailyValues: ActivityHeatmapValue[];
    hoursOnCourse: number;
    loadingValues?: boolean;
    memberName?: string;
    memberImage?: string | null;
    onReadyChange: (ready: boolean) => void;
    onAssetError: () => void;
};

const dayDecoration = require("../../../assets/HappyGolf_ShareCard_V4/assets/decorations_minimal_v4.png");
const darkDecoration = require("../../../assets/HappyGolf_ShareCard_V4/assets/decorations_minimal_v4_dark_clear.png");
const { components: measured, style: palette } = layout;

/** Dynamic text, dates, member details and the original app logo over one V4 art layer. */
export const MonthlyGolfShareCard = forwardRef<React.ElementRef<typeof View>, MonthlyGolfShareCardProps>(function MonthlyGolfShareCard({
    year, month, width, dailyValues, hoursOnCourse, loadingValues = false, memberName, memberImage,
    onReadyChange, onAssetError,
}, ref) {
    const { colors, resolvedScheme } = useTheme();
    const { t, i18n } = useTranslation();
    const language = getShareCardLocale(i18n.language);
    const copy = i18n.getFixedT(language, "translation", "shareCard");
    const latin = usesLatinShareCardText(language);
    const tallScript = /^km(-|$)/i.test(language);
    const scale = width / SHARE_CARD_WIDTH;
    const height = SHARE_CARD_HEIGHT * scale;
    const dark = resolvedScheme === "dark";
    const ink = dark ? colors.foreground : palette.textDark;
    const mutedInk = dark ? colors.mutedForeground : palette.textMuted;
    const canvas = colors.card;
    const [artReady, setArtReady] = useState(false);
    const [layoutReady, setLayoutReady] = useState(false);
    const [avatarReady, setAvatarReady] = useState(false);
    const [avatarFailed, setAvatarFailed] = useState(false);
    const ready = layoutReady && artReady && (!memberImage || avatarReady);

    useEffect(() => {
        onReadyChange(ready);
        return () => onReadyChange(false);
    }, [ready, onReadyChange]);

    const pos = (x: number, y: number, w: number, h: number) => ({
        position: "absolute" as const,
        left: x * scale, top: y * scale, width: w * scale, height: h * scale,
    });
    const type = (size: number, line: number, weight: TextStyle["fontWeight"], color = ink): TextStyle => ({
        fontSize: size * scale, lineHeight: line * scale, fontWeight: weight,
        color, includeFontPadding: false,
    });
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
    // API day keys are already branch-calendar dates; do not convert them to UTC timestamps.
    const values = dailyValues.filter(day => toDateKey(day.date).startsWith(monthPrefix));
    const byDate = new Map(values.map(day => [toDateKey(day.date), day]));
    const count = values.reduce((sum, day) => sum + day.count, 0);
    const countLabel = new Intl.NumberFormat(language).format(count);
    const monthLabel = formatShareCardMonth(year, month, language);
    const hoursLabel = new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(hoursOnCourse);
    const hourUnit = copy("hourShort");
    const calendar = getShareCardCalendar(year, month, language);
    const name = memberName || t("activity.golfer");

    return (
        <View ref={ref} collapsable={false} accessible accessibilityRole="image"
            accessibilityLabel={loadingValues ? `${monthLabel}, ${t("activity.loading")}` : `${monthLabel}, ${countLabel} ${copy("reservations")}, ${hoursLabel} ${hourUnit}, ${name}`}
            onLayout={() => setLayoutReady(true)}
            style={{ width, height, position: "relative", overflow: "hidden", borderRadius: SHARE_CARD_CORNER_RADIUS * scale,
                backgroundColor: canvas, direction: "ltr" }}>
            {dark && (
                <LinearGradient
                    colors={[colorWithOpacity(reservationStatusColors.reservationCompleted, 0.24), canvas,
                        colorWithOpacity(reservationStatusColors.reservationCompleted, 0.18)]}
                    locations={[0, 0.55, 1]}
                    style={pos(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT)}
                />
            )}
            <Image source={dark ? darkDecoration : dayDecoration} resizeMode="stretch" style={pos(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT)}
                onLoad={() => setArtReady(true)} onError={onAssetError} />
            {!dark && (
                /* Feather over the two baked-in day strokes without touching the flag. */
                <Svg viewBox="0 0 150 124" style={pos(967, 109, 150, 124)}>
                    <Defs>
                        <RadialGradient id="cleanSky">
                            <Stop offset="66%" stopColor="#D0F3FD" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#D0F3FD" stopOpacity="0" />
                        </RadialGradient>
                    </Defs>
                    <Ellipse cx="75" cy="62" rx="75" ry="62" fill="url(#cleanSky)" />
                </Svg>
            )}
            {!dark && <View style={{ ...pos(36, 190, 98, 115), backgroundColor: canvas }} />}
            {!dark && <View style={{ ...pos(340, 220, 95, 120), backgroundColor: canvas }} />}

            <ShareCardHeader periodLabel={monthLabel} totalReservations={count} hoursPlayed={hoursOnCourse}
                loadingValues={loadingValues} width={width} />

            {calendar.weekdays.map((weekday, column) => (
                <Text key={column} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}
                    style={[pos(measured.calendarWeekdays.centersX[column] - 67, 511, 134, 32),
                        type(21, 30, "700", column === 5 ? (dark ? colors.primary : palette.satText)
                            : column === 6 ? (dark ? colors.danger : palette.sunText) : mutedInk),
                        { textAlign: "center", letterSpacing: latin ? 3 * scale : 0 }]}>
                    {latin ? weekday.toLocaleUpperCase(language) : weekday}
                </Text>
            ))}
            {calendar.cells.map((cell, index) => {
                const activity = cell.dateKey ? byDate.get(cell.dateKey) : undefined;
                const active = !loadingValues && Boolean(activity && activity.count > 0);
                const selectedColor = getActivityStatusColor(activity?.status, colors);
                const backgroundColor = active ? selectedColor : cell.column === 5
                    ? (dark ? colorWithOpacity(colors.primary, 0.13) : palette.satCell)
                    : cell.column === 6 ? (dark ? colorWithOpacity(colors.danger, 0.13) : palette.sunCell)
                        : (dark ? colors.muted : palette.neutralCell);
                const color = active ? colors.primaryForeground : cell.column === 5 ? (dark ? colors.primary : palette.satText)
                    : cell.column === 6 ? (dark ? colors.danger : palette.sunText) : mutedInk;
                return (
                    <View key={index} style={{ ...pos(cell.x, cell.y, cell.width, cell.height),
                        borderRadius: measured.calendarGrid.cornerRadius * scale,
                        alignItems: "center", justifyContent: "center", backgroundColor }}>
                        {cell.inMonth ? (
                            <Text allowFontScaling={false} style={type(34, 44, active ? "700" : "500", color)}>
                                {cell.label}
                            </Text>
                        ) : null}
                    </View>
                );
            })}

            <View style={{ ...pos(68, 1110, 964, 2), backgroundColor: colors.border }} />
            <View style={{ ...pos(88, 1130, 126, 126), borderRadius: 63 * scale, overflow: "hidden",
                backgroundColor: colors.muted }}>
                {memberImage && !avatarFailed ? (
                    <Image source={{ uri: memberImage }} resizeMode="cover" style={{ width: "100%", height: "100%" }}
                        onLoad={() => setAvatarReady(true)}
                        onError={() => { setAvatarFailed(true); setAvatarReady(true); }} />
                ) : (
                    <>
                        <View style={{ position: "absolute", left: 41 * scale, top: 22 * scale,
                            width: 44 * scale, height: 44 * scale, borderRadius: 22 * scale,
                            backgroundColor: mutedInk }} />
                        <View style={{ position: "absolute", left: 22 * scale, top: 72 * scale,
                            width: 82 * scale, height: 70 * scale, borderRadius: 41 * scale,
                            backgroundColor: mutedInk }} />
                    </>
                )}
            </View>
            <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit minimumFontScale={0.65}
                style={[pos(244, 1153, 420, tallScript ? 65 : 56), type(45, tallScript ? 63 : 54, "800")]}>
                {name}
            </Text>
            <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}
                style={[pos(244, 1206, 415, tallScript ? 42 : 38), type(28, tallScript ? 40 : 36, "700", mutedInk),
                    { letterSpacing: latin ? 3 * scale : 0 }]}>
                {copy("member")}
            </Text>
            <View style={{ ...pos(696, 1147, 324, 104), justifyContent: "center", alignItems: "center" }}>
                <HappyGolfLogo width={324 * scale} height={77 * scale} primaryColor={colors.primary} />
            </View>
        </View>
    );
});
