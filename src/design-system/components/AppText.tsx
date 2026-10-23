import { Text, type TextProps, type TextStyle } from "react-native";
import { cn } from "../utils/cn";
import type { ThemeColors } from "../utils/theme";
import { typography } from "../utils/typography";

const colorClasses = {
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
    success: "text-success",
    warning: "text-warning",
    ticketBay: "text-ticket-bay",
    ticketPrivate: "text-ticket-private",
    ticketGroup: "text-ticket-group",
    ticketProgram: "text-ticket-program",
    ticketDefault: "text-ticket-default",
    btnMainStart: "text-bg-btn-main-start",
    btnMainEnd: "text-bg-btn-main-end",
    btnMainPressedStart: "text-bg-btn-main-pressed-start",
    btnMainPressedEnd: "text-bg-btn-main-pressed-end",
} satisfies Record<keyof ThemeColors, string>;

type AppTextProps = TextProps & {
    variant?: keyof typeof typography;
    color?: keyof ThemeColors;
    align?: "left" | "center" | "right";
    wrap?: boolean;
    textStyle?: TextStyle;
};

export function AppText({
    variant = "body",
    color = "foreground",
    align = "left",
    wrap = true,
    className,
    style,
    textStyle,
    ...props
}: AppTextProps) {
    return (
        <Text
            {...props}
            className={cn(colorClasses[color], className)}
            style={[
                typography[variant],
                { textAlign: align, flexShrink: wrap ? 1 : 0 },
                textStyle,
                style,
            ]}
        />
    );
}
