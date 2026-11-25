import { Text, type TextProps, type TextStyle } from "react-native";
import { cn } from "../utils/cn";
import { typography } from "../utils/typography";

const textColorClasses = {
    background: "text-background",
    foreground: "text-foreground",
    surface: "text-surface",
    card: "text-card",
    border: "text-border",
    muted: "text-muted",
    mutedForeground: "text-muted-foreground",
    primary: "text-primary",
    primaryForeground: "text-primary-foreground",
    danger: "text-danger",
    dangerForeground: "text-danger-foreground",
    success: "text-success",
    warning: "text-warning",
    warningText: "text-warning-text",
    ticketBay: "text-ticket-bay",
    ticketPrivate: "text-ticket-private",
    ticketGroup: "text-ticket-group",
    ticketProgram: "text-ticket-program",
    ticketDefault: "text-ticket-default",
    btnMainStart: "text-bg-btn-main-start",
    btnMainEnd: "text-bg-btn-main-end",
    btnMainPressedStart: "text-bg-btn-main-pressed-start",
    btnMainPressedEnd: "text-bg-btn-main-pressed-end",
    mediaForeground: "text-media-foreground",
} as const;

export type AppTextColor = keyof typeof textColorClasses;

export type AppTextProps = TextProps & {
    variant?: keyof typeof typography;
    color?: AppTextColor;
    align?: "left" | "center" | "right";
    wrap?: boolean;
    /** Align numerals in timers, scores, and ticket counts. */
    tabular?: boolean;
    textStyle?: TextStyle;
};

export function AppText({
    variant = "body",
    color = "foreground",
    align = "left",
    wrap = true,
    tabular = false,
    className,
    style,
    textStyle,
    maxFontSizeMultiplier = 1.5,
    ...props
}: AppTextProps) {
    return (
        <Text
            {...props}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            lineBreakStrategyIOS="hangul-word"
            className={cn(textColorClasses[color], className)}
            style={[
                typography[variant],
                { textAlign: align, flexShrink: wrap ? 1 : 0 },
                tabular ? { fontVariant: ["tabular-nums"] } : null,
                textStyle,
                style,
            ]}
        />
    );
}
