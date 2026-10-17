import { NativeText } from "./NativeText";
import happyGolfToolbarLogo from "@/assets/images/happygolf_toolbar_logo.png";
import { Image, View } from "react-native";
import Animated, { cubicBezier, useReducedMotion } from "react-native-reanimated";
import { useTheme } from "../utils/theme";

type CircleLoaderProps = {
    label?: string;
    fullScreen?: boolean;
    logoOnly?: boolean;
};

export function CircleLoader({
    label,
    fullScreen = false,
    logoOnly = false,
}: CircleLoaderProps) {
    const { colors } = useTheme();
    const reduceMotion = useReducedMotion();
    const dotSize = fullScreen ? 12 : 8;
    return (
        <View
            accessibilityRole="progressbar"
            accessibilityLabel={label}
            accessibilityState={{ busy: true }}
            className={
                fullScreen
                    ? "flex-1 items-center justify-center bg-background px-6"
                    : "items-center justify-center"
            }
        >
            {logoOnly ? (
                <Animated.View style={reduceMotion ? undefined : {
                    animationName: { from: { opacity: 0.75, transform: [{ scale: 0.98 }] }, to: { opacity: 1, transform: [{ scale: 1 }] } },
                    animationDuration: 560,
                    animationIterationCount: "infinite",
                    animationDirection: "alternate",
                    animationTimingFunction: cubicBezier(0.77, 0, 0.175, 1),
                }}>
                    <Image source={happyGolfToolbarLogo} className="h-14 w-64" resizeMode="contain" />
                </Animated.View>
            ) : (
                <View className="flex-row items-center gap-2">
                    {[0, 1, 2].map((index) => (
                        <Animated.View key={index} style={{
                            width: dotSize,
                            height: dotSize,
                            borderRadius: 999,
                            backgroundColor: colors.primary,
                            ...(!reduceMotion ? {
                                animationName: {
                                    from: { opacity: 0.35, transform: [{ translateY: 0 }, { scale: 0.9 }] },
                                    to: { opacity: 1, transform: [{ translateY: -2 }, { scale: 1.15 }] },
                                },
                                animationDuration: 360,
                                animationDelay: index * 50,
                                animationIterationCount: "infinite" as const,
                                animationDirection: "alternate" as const,
                                animationTimingFunction: cubicBezier(0.77, 0, 0.175, 1),
                            } : {}),
                        }} />
                    ))}
                </View>
            )}
            {label && !logoOnly ? (
                <NativeText
                    variant="meta"
                    align="center"
                    style={{ marginTop: 12 }}
                    textStyle={{ color: colors.foreground + "bf" }}
                >
                    {label}
                </NativeText>
            ) : null}
        </View>
    );
}
