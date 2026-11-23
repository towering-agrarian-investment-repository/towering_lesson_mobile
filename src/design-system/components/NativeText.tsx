import type { TextProps as ExpoTextProps } from "@expo/ui";
import type { ReactNode } from "react";
import type { TextStyle, ViewProps, ViewStyle } from "react-native";
import type { ThemeColors } from "../utils/theme";
import type { typography } from "../utils/typography";
import { AppText } from "./AppText";

type NativeTextProps = Pick<ViewProps, "accessibilityRole" | "accessibilityLiveRegion"> & {
    children?: ReactNode;
    numberOfLines?: number;
    variant?: keyof typeof typography;
    color?: keyof ThemeColors;
    align?: "left" | "center" | "right";
    wrap?: boolean;
    style?: ViewStyle & TextStyle;
    textStyle?: ExpoTextProps["textStyle"] & TextStyle;
};

/**
 * Compatibility alias delegating to native Fabric RN Text (`AppText`)
 * without spawning an `@expo/ui` Host per standalone label.
 * Inside an existing `@expo/ui` Host (Button, Picker, List, BottomSheet), use `@expo/ui` `Text` directly.
 */
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
    return (
        <AppText
            variant={variant}
            color={color}
            align={align}
            wrap={wrap}
            numberOfLines={numberOfLines}
            accessibilityRole={accessibilityRole}
            accessibilityLiveRegion={accessibilityLiveRegion}
            textStyle={textStyle as TextStyle}
            style={style as TextStyle}
        >
            {children}
        </AppText>
    );
}
