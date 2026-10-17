import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import type { ThemeColors } from "../../utils/theme";
import { typography } from "../../utils/typography";

// Share native sizing/alignment without adding another text control or type ramp.
export const chartLeadingModifiers = process.env.EXPO_OS === "ios"
    ? [frame({ maxWidth: Infinity, alignment: "leading" })]
    : [fillMaxWidth()];

export const chartCenterModifiers = process.env.EXPO_OS === "ios"
    ? [frame({ maxWidth: Infinity, alignment: "center" })]
    : [fillMaxWidth()];

export function getChartTextStyles(colors: ThemeColors, fontScale: number) {
    return {
        title: {
            ...typography.h3,
            fontSize: typography.h3.fontSize * fontScale,
            lineHeight: typography.h3.lineHeight * fontScale,
            color: colors.foreground,
        },
        muted: {
            ...typography.subtext,
            fontSize: typography.subtext.fontSize * fontScale,
            lineHeight: typography.subtext.lineHeight * fontScale,
            color: colors.mutedForeground,
        },
    };
}
