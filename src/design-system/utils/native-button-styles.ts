import type { ButtonProps, TextProps } from "@expo/ui";
import type { ThemeColors } from "./theme";
import { typography } from "./typography";

type ButtonAppearance = "filled" | "outlined" | "text";

/** Use with the native Button's text variant so Material's seeded fill cannot cover our theme colors. */
export function getNativeButtonStyle(
    colors: ThemeColors,
    appearance: ButtonAppearance,
    disabled = false,
    accent = colors.primary,
): NonNullable<ButtonProps["style"]> {
    return {
        backgroundColor:
            appearance === "filled" ? accent : appearance === "outlined" ? colors.surface : "transparent",
        borderRadius: 12,
        ...(appearance === "outlined" ? { borderWidth: 1, borderColor: colors.border } : {}),
        opacity: disabled ? 0.5 : 1,
    };
}

export function getNativeButtonTextStyle(
    colors: ThemeColors,
    appearance: ButtonAppearance,
    fontScale: number,
    accent = colors.primary,
): NonNullable<TextProps["textStyle"]> {
    return {
        ...typography.label,
        lineHeight: typography.label.lineHeight * fontScale,
        fontSize: typography.label.fontSize * fontScale,
        fontWeight: "600",
        textAlign: "center",
        color: appearance === "filled" ? colors.primaryForeground : accent === colors.danger ? colors.danger : colors.foreground,
    };
}
