import { Host, Text, type TextProps } from "@expo/ui";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import type { ViewProps, ViewStyle } from "react-native";
import { useTheme, type ThemeColors } from "../utils/theme";
import { typography } from "../utils/typography";

type NativeTextProps = Pick<TextProps, "children" | "numberOfLines"> & Pick<ViewProps, "accessibilityRole" | "accessibilityLiveRegion"> & {
    variant?: keyof typeof typography;
    color?: keyof ThemeColors;
    align?: "left" | "center" | "right";
    /** Constrain the host width for wrapping; false keeps badges intrinsic. */
    wrap?: boolean;
    /** Layout for the existing Host, including a measured width or row flex. */
    style?: ViewStyle;
    /** Unscaled native text overrides; font size and line height scale once. */
    textStyle?: TextProps["textStyle"];
};

/** Standalone Expo text. Native button/Column children use Expo Text directly. */
export function NativeText({
    children,
    variant = "body",
    color = "foreground",
    align = "left",
    wrap = true,
    style,
    textStyle,
    numberOfLines,
    accessibilityRole,
    accessibilityLiveRegion,
}: NativeTextProps) {
    const { colors, fontScale } = useTheme();
    const token = typography[variant];
    const fillWidth = wrap && style?.width === undefined && style?.flex === undefined;
    const textAlign = textStyle?.textAlign ?? align;

    return (
        <Host
            matchContents={wrap ? { vertical: true } : true}
            ignoreSafeArea="all"
            accessibilityRole={accessibilityRole}
            accessibilityLiveRegion={accessibilityLiveRegion}
            style={[fillWidth && { width: "100%" }, style]}
        >
            <Text
                numberOfLines={numberOfLines}
                textStyle={{
                    color: colors[color],
                    ...token,
                    ...textStyle,
                    textAlign,
                    fontSize: (textStyle?.fontSize ?? token.fontSize) * fontScale,
                    lineHeight: (textStyle?.lineHeight ?? token.lineHeight) * fontScale,
                }}
                modifiers={wrap
                    ? process.env.EXPO_OS === "ios"
                        ? [frame({ maxWidth: Infinity, alignment: textAlign === "center" ? "center" : textAlign === "right" ? "trailing" : "leading" })]
                        : [fillMaxWidth()]
                    : undefined}
            >
                {children}
            </Text>
        </Host>
    );
}
