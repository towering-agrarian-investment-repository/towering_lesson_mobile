import { AppText } from "@/design-system/components/AppText";
import { useTheme } from "@/design-system/utils/theme";
import { type ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut, useReducedMotion } from "react-native-reanimated";

export function FormFieldShell({
    label,
    errorMessage,
    helperText,
    children,
}: {
    label?: string;
    errorMessage?: string;
    helperText?: string;
    children: ReactNode;
}) {
    const { colors: uiColors } = useTheme();
    const reducedMotion = useReducedMotion();

    return (
        <View className="gap-1.5">
            {label ? (
                <AppText variant="label" textStyle={{ color: uiColors.foreground + "d9" }}>
                    {label}
                </AppText>
            ) : null}

            {children}

            {errorMessage ? (
                <Animated.View
                    entering={reducedMotion ? undefined : FadeIn.duration(150)}
                    exiting={reducedMotion ? undefined : FadeOut.duration(120)}
                >
                    <AppText variant="meta" color="danger">
                        {errorMessage}
                    </AppText>
                </Animated.View>
            ) : helperText ? (
                <AppText variant="caption" color="mutedForeground">
                    {helperText}
                </AppText>
            ) : null}
        </View>
    );
}
