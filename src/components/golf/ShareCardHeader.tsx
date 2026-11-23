import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { Skeleton } from "@/design-system/components/Skeleton";
import { colorWithOpacity } from "@/design-system/utils/color";
import { useTheme } from "@/design-system/utils/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { Text, View, type TextStyle } from "react-native";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import {
    getShareCardLocale,
    getShareCardThemePalette,
    SHARE_CARD_HEIGHT,
    SHARE_CARD_WIDTH,
    usesLatinShareCardText,
    type ShareCardTheme,
} from "./monthly-share-card-layout";

type ShareCardBackdropProps = {
    width: number;
    theme: ShareCardTheme;
    gradientId: string;
};

/** Pure vector topographic contour backdrop + radial spotlight for razor-sharp exports. */
export function ShareCardBackdrop({
    width,
    theme,
    gradientId,
}: ShareCardBackdropProps) {
    const { colors } = useTheme();
    const palette = getShareCardThemePalette(theme, colors);
    const scale = width / SHARE_CARD_WIDTH;
    const height = SHARE_CARD_HEIGHT * scale;

    return (
        <>
            {palette.gradient ? (
                <LinearGradient
                    colors={[...palette.gradient]}
                    locations={[0, 0.55, 1]}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width,
                        height,
                    }}
                />
            ) : null}
            {palette.showContours ? (
                <Svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${SHARE_CARD_WIDTH} ${SHARE_CARD_HEIGHT}`}
                    style={{ position: "absolute", left: 0, top: 0 }}
                    accessible={false}
                >
                    {palette.spotlightColor ? (
                        <Defs>
                            <RadialGradient
                                id={gradientId}
                                cx="82%"
                                cy="14%"
                                rx="58%"
                                ry="38%"
                            >
                                <Stop
                                    offset="0%"
                                    stopColor={palette.spotlightColor}
                                    stopOpacity="1"
                                />
                                <Stop
                                    offset="100%"
                                    stopColor={palette.spotlightColor}
                                    stopOpacity="0"
                                />
                            </RadialGradient>
                        </Defs>
                    ) : null}
                    {palette.spotlightColor ? (
                        <Rect
                            x={0}
                            y={0}
                            width={SHARE_CARD_WIDTH}
                            height={SHARE_CARD_HEIGHT}
                            fill={`url(#${gradientId})`}
                        />
                    ) : null}
                    <Path
                        d="M 580 -20 C 640 130, 810 180, 1140 140"
                        fill="none"
                        stroke={palette.contourColor}
                        strokeWidth={2}
                    />
                    <Path
                        d="M 660 -20 C 710 185, 860 250, 1140 225"
                        fill="none"
                        stroke={palette.contourColor}
                        strokeWidth={2}
                    />
                    <Path
                        d="M 760 -20 C 795 235, 920 315, 1140 310"
                        fill="none"
                        stroke={palette.contourColor}
                        strokeWidth={2}
                    />
                    <Path
                        d="M -20 1245 C 240 1190, 480 1320, 760 1280 C 920 1255, 1020 1295, 1140 1265"
                        fill="none"
                        stroke={palette.contourColor}
                        strokeWidth={2}
                    />
                </Svg>
            ) : (
                <View
                    style={{
                        position: "absolute",
                        left: 68 * scale,
                        top: 52 * scale,
                        width: 986 * scale,
                        height: 5 * scale,
                        borderRadius: 2.5 * scale,
                        backgroundColor: colors.primary,
                    }}
                />
            )}
        </>
    );
}

type ShareCardHeaderProps = {
    periodLabel: string;
    totalReservations: number;
    hoursPlayed: number;
    activeDays: number;
    loadingValues: boolean;
    width: number;
    theme: ShareCardTheme;
};

/** Athlete/scorecard poster header shared by monthly and yearly share cards. */
export function ShareCardHeader({
    periodLabel,
    totalReservations,
    hoursPlayed,
    activeDays,
    loadingValues,
    width,
    theme,
}: ShareCardHeaderProps) {
    const { colors } = useTheme();
    const { i18n } = useTranslation();
    const language = getShareCardLocale(i18n.language);
    const copy = i18n.getFixedT(language, "translation", "shareCard");
    const activityCopy = i18n.getFixedT(language, "translation", "activity");
    const latin = usesLatinShareCardText(language);
    const tallScript = /^km(-|$)/i.test(language);
    const palette = getShareCardThemePalette(theme, colors);
    const ink = palette.ink;
    const mutedInk = palette.mutedInk;
    const scale = width / SHARE_CARD_WIDTH;
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
    const activeDaysLabel = numberFormatter.format(activeDays);
    const countSize =
        countLabel.length <= 2 ? 204 : countLabel.length === 3 ? 168 : 136;
    const countHeight = Math.max(204, countSize + 14);
    const hoursLabel = new Intl.NumberFormat(language, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(hoursPlayed);
    const hourUnit = copy("hourShort");
    const shortUnit = hourUnit.length === 1;
    const hoursValueText = `${hoursLabel}${shortUnit ? hourUnit : ""}`;
    const hoursLabelText = shortUnit
        ? copy("played")
        : `${hourUnit} · ${copy("played")}`;
    const activeDaysTitle = activityCopy("reservationDays");

    return (
        <>
            <Text
                allowFontScaling={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={[
                    pos(68, 86, 620, tallScript ? 56 : 48),
                    type(34, tallScript ? 52 : 44, "800", mutedInk),
                    { letterSpacing: latin ? 5 * scale : 0 },
                ]}
            >
                {latin ? periodLabel.toLocaleUpperCase(language) : periodLabel}
            </Text>

            <View
                style={{
                    ...pos(754, 72, 300, 72),
                    justifyContent: "center",
                    alignItems: "flex-end",
                }}
            >
                <HappyGolfLogo
                    width={252 * scale}
                    height={60 * scale}
                    primaryColor={palette.logoColor}
                />
            </View>

            <View
                style={{
                    ...pos(68, 162, 986, 2),
                    backgroundColor: palette.divider,
                }}
            />

            {loadingValues ? (
                <View
                    style={pos(68, 206, 260, 176)}
                    accessibilityRole="progressbar"
                >
                    <Skeleton
                        className="h-full w-full rounded-2xl"
                        style={{
                            backgroundColor: colorWithOpacity(
                                palette.heroAccent,
                                0.28,
                            ),
                        }}
                    />
                </View>
            ) : (
                <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                    style={[
                        pos(68, 186, 464, countHeight),
                        type(
                            countSize,
                            countHeight,
                            "900",
                            palette.heroAccent,
                        ),
                        { fontVariant: ["tabular-nums"] },
                    ]}
                >
                    {countLabel}
                </Text>
            )}

            <Text
                allowFontScaling={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                style={[
                    pos(72, 404, 460, tallScript ? 60 : 52),
                    type(34, tallScript ? 54 : 44, "800", ink),
                    { letterSpacing: latin ? 4 * scale : 0 },
                ]}
            >
                {latin
                    ? copy("reservations").toLocaleUpperCase(language)
                    : copy("reservations")}
            </Text>

            <View
                style={{
                    ...pos(556, 212, 2, 240),
                    backgroundColor: palette.divider,
                }}
            />

            {loadingValues ? (
                <View
                    style={pos(604, 216, 240, 62)}
                    accessibilityRole="progressbar"
                >
                    <Skeleton
                        className="h-full w-full rounded-xl"
                        style={{
                            backgroundColor: colorWithOpacity(
                                palette.mutedInk,
                                0.28,
                            ),
                        }}
                    />
                </View>
            ) : (
                <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                    style={[
                        pos(604, 206, 450, 74),
                        type(66, 74, "800", ink),
                        { fontVariant: ["tabular-nums"] },
                    ]}
                >
                    {hoursValueText}
                </Text>
            )}

            <Text
                allowFontScaling={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                style={[
                    pos(604, 282, 450, tallScript ? 40 : 34),
                    type(23, tallScript ? 36 : 30, "700", mutedInk),
                    { letterSpacing: latin ? 2.5 * scale : 0 },
                ]}
            >
                {latin
                    ? hoursLabelText.toLocaleUpperCase(language)
                    : hoursLabelText}
            </Text>

            <View
                style={{
                    ...pos(604, 334, 450, 2),
                    backgroundColor: palette.divider,
                }}
            />

            {loadingValues ? (
                <View
                    style={pos(604, 358, 180, 62)}
                    accessibilityRole="progressbar"
                >
                    <Skeleton
                        className="h-full w-full rounded-xl"
                        style={{
                            backgroundColor: colorWithOpacity(
                                palette.mutedInk,
                                0.28,
                            ),
                        }}
                    />
                </View>
            ) : (
                <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                    style={[
                        pos(604, 350, 450, 74),
                        type(66, 74, "800", ink),
                        { fontVariant: ["tabular-nums"] },
                    ]}
                >
                    {activeDaysLabel}
                </Text>
            )}

            <Text
                allowFontScaling={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                style={[
                    pos(604, 426, 450, tallScript ? 40 : 34),
                    type(23, tallScript ? 36 : 30, "700", mutedInk),
                    { letterSpacing: latin ? 2.5 * scale : 0 },
                ]}
            >
                {latin
                    ? activeDaysTitle.toLocaleUpperCase(language)
                    : activeDaysTitle}
            </Text>

            <View
                style={{
                    ...pos(68, 486, 986, 2),
                    backgroundColor: palette.divider,
                }}
            />
        </>
    );
}
