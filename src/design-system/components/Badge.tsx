import { Host, Text } from "@expo/ui";
import { View } from "react-native";
import { cn } from "../utils/cn";
import { useTheme, type ThemeColors } from "../utils/theme";
import { typography } from "../utils/typography";

type BadgeProps = {
    label: string;
    variant?: "default" | "success" | "warning" | "danger";
    className?: string;
    color?: keyof ThemeColors;
};

export function Badge({
    label,
    variant = "default",
    className,
    color,
}: BadgeProps) {
    const { colors, fontScale: uiFontScale } = useTheme();
    return (
        <View
            className={cn(
                "self-start rounded-md px-2.5 py-1",
                variant === "default" && "bg-muted",
                variant === "success" && "bg-success/10",
                variant === "warning" && "bg-warning/10",
                variant === "danger" && "bg-danger/10",
                className,
            )}
        >
            <Host matchContents ignoreSafeArea="all">
                <Text
                    textStyle={{
                        ...typography.badge, lineHeight: typography.badge.lineHeight * uiFontScale,
                        color: colors[
                            color ??
                            (variant === "default"
                                ? "mutedForeground"
                                : variant)
                        ],
                        fontSize: typography.badge.fontSize * uiFontScale,
                    }}
                >
                    {label}
                </Text>
            </Host>
        </View>
    );
}
