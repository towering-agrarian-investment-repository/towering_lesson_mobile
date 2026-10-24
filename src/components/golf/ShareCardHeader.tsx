import { Skeleton } from "@/design-system/components/Skeleton";
import { colorWithOpacity } from "@/design-system/utils/color";
import { useTheme } from "@/design-system/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View, type TextStyle } from "react-native";
import layout from "../../../assets/HappyGolf_ShareCard_V4/spec/layout_v4.json";
import { getShareCardLocale, SHARE_CARD_WIDTH, usesLatinShareCardText } from "./monthly-share-card-layout";

type ShareCardHeaderProps = {
    periodLabel: string;
    totalReservations: number;
    hoursPlayed: number;
    loadingValues: boolean;
    width: number;
};

/** The same measured header for monthly and yearly cards; only the period and totals vary. */
export function ShareCardHeader({ periodLabel, totalReservations, hoursPlayed, loadingValues, width }: ShareCardHeaderProps) {
    const { colors, resolvedScheme } = useTheme();
    const { i18n } = useTranslation();
    const language = getShareCardLocale(i18n.language);
    const copy = i18n.getFixedT(language, "translation", "shareCard");
    const latin = usesLatinShareCardText(language);
    const tallScript = /^km(-|$)/i.test(language);
    const dark = resolvedScheme === "dark";
    const ink = dark ? colors.foreground : layout.style.textDark;
    const mutedInk = dark ? colors.mutedForeground : layout.style.textMuted;
    const scale = width / SHARE_CARD_WIDTH;
    const pos = (x: number, y: number, w: number, h: number) => ({
        position: "absolute" as const, left: x * scale, top: y * scale, width: w * scale, height: h * scale,
    });
    const type = (size: number, line: number, weight: TextStyle["fontWeight"], color = ink): TextStyle => ({
        fontSize: size * scale, lineHeight: line * scale, fontWeight: weight, color, includeFontPadding: false,
    });
    const countLabel = new Intl.NumberFormat(language).format(totalReservations);
    const countSize = countLabel.length <= 2 ? 260 : countLabel.length === 3 ? 210 : 165;
    const countHeight = Math.max(248, countSize + 16);
    const countOpticalOffset = totalReservations >= 10 && totalReservations <= 19 && totalReservations !== 11 ? -18 : 0;
    const hoursLabel = new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(hoursPlayed);
    const hourUnit = copy("hourShort");
    const shortUnit = hourUnit.length === 1;
    const hoursFontSize = hoursLabel.length >= 7 ? 45 : hoursLabel.length >= 5 ? 60 : 78;

    return (
        <>
            <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
                style={[pos(50, 101, 428, tallScript ? 56 : 50), type(35, tallScript ? 52 : 45, "700", mutedInk),
                    { letterSpacing: latin ? 7 * scale : 0, textAlign: "center" }]}>
                {latin ? periodLabel.toLocaleUpperCase(language) : periodLabel}
            </Text>
            {loadingValues ? (
                <View style={pos(165, 193, 182, 175)} accessibilityRole="progressbar">
                    <View style={{ position: "absolute", left: 0, top: 0, width: 60 * scale, height: "100%" }}>
                        <Skeleton className="h-full w-full rounded-xl" style={{ backgroundColor: colorWithOpacity(colors.primary, 0.32) }} />
                    </View>
                    <View style={{ position: "absolute", right: 0, top: 0, width: 90 * scale, height: "100%" }}>
                        <Skeleton className="h-full w-full rounded-xl" style={{ backgroundColor: colorWithOpacity(colors.primary, 0.32) }} />
                    </View>
                </View>
            ) : (
                <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
                    style={[pos(78 + countOpticalOffset, 153, 372, countHeight), type(countSize, countHeight, "900", colors.primary),
                        { textAlign: "center", textAlignVertical: "center", fontVariant: ["tabular-nums"] }]}>
                    {countLabel}
                </Text>
            )}
            <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}
                style={[pos(78, layout.components.reservationLabel.y, 372, tallScript ? 75 : 68), type(56, tallScript ? 73 : 65, "900"),
                    { textAlign: "center" }]}>
                {copy("reservations")}
            </Text>
            <View style={{ ...pos(472, 313, 4, 155), borderRadius: 2 * scale,
                backgroundColor: colorWithOpacity(colors.mutedForeground, dark ? 0.7 : 0.55) }} />
            <View style={{ ...pos(505, 339, 120, 120), borderRadius: 60 * scale,
                backgroundColor: dark ? colorWithOpacity(colors.warning, 0.28) : "#FFF0AE",
                alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="time-outline" size={78 * scale} color={ink} />
            </View>
            {loadingValues ? (
                <View style={pos(640, 366, 173, 45)} accessibilityRole="progressbar">
                    <Skeleton className="h-full w-full rounded-lg" style={{ backgroundColor: colorWithOpacity(colors.mutedForeground, 0.38) }} />
                </View>
            ) : (
                <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}
                    style={[pos(640, 346, 170, 82), type(hoursFontSize, 82, "800")]}>
                    {`${hoursLabel}${shortUnit ? hourUnit : ""}`}
                </Text>
            )}
            <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}
                style={[pos(642, 418, 300, 38), type(26, 36, "700", mutedInk),
                    { letterSpacing: latin ? 2 * scale : 0 }]}>
                {shortUnit ? copy("played") : `${hourUnit} · ${copy("played")}`}
            </Text>
        </>
    );
}
