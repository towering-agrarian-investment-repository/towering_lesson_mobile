import { forwardRef, useEffect, type ComponentRef } from "react";
import { Pressable, type PressableProps, type PressableStateCallbackType } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { colorWithOpacity } from "../utils/color";
import { triggerImpactHaptic, triggerSelectionHaptic } from "../utils/haptics";
import { motionDuration, motionEase, motionPressScale } from "../utils/motion";
import { useTheme } from "../utils/theme";

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);
const IS_ANDROID = process.env.EXPO_OS === "android";

type AnimatedPressableProps = Omit<PressableProps, "style"> & {
    className?: string;
    style?: PressableProps["style"];
    haptic?: "selection" | "impact" | false;
    /** Uses native Material foreground ripple on Android (default true). */
    ripple?: boolean;
};

export const AnimatedPressable = forwardRef<ComponentRef<typeof Pressable>, AnimatedPressableProps>(
    function AnimatedPressable(
        {
            disabled,
            pressRetentionOffset = 16,
            haptic = false,
            ripple = true,
            android_ripple,
            onPress,
            onPressIn,
            onPressOut,
            style,
            ...props
        },
        ref,
    ) {
        const { colors, resolvedScheme } = useTheme();
        const pressed = useSharedValue(0);
        const reducedMotion = useReducedMotion();
        const useAndroidRipple = IS_ANDROID && ripple && !disabled && Boolean(onPress);

        useEffect(() => {
            if (disabled || useAndroidRipple) {
                pressed.set(0);
            }
        }, [disabled, pressed, useAndroidRipple]);

        const animatedStyle = useAnimatedStyle(() => {
            const progress = pressed.get();
            return {
                transform: [
                    {
                        scale: reducedMotion || useAndroidRipple ? 1 : 1 - progress * (1 - motionPressScale),
                    },
                ],
            };
        });

        const resolvedRipple =
            android_ripple ??
            (useAndroidRipple
                ? {
                      color: colorWithOpacity(colors.foreground, resolvedScheme === "dark" ? 0.14 : 0.08),
                      foreground: true,
                  }
                : undefined);

        return (
            <ReanimatedPressable
                {...props}
                ref={ref}
                disabled={disabled}
                pressRetentionOffset={pressRetentionOffset}
                android_ripple={resolvedRipple}
                onPress={
                    onPress
                        ? (event) => {
                              if (!disabled) {
                                  if (haptic === "selection") {
                                      triggerSelectionHaptic();
                                  } else if (haptic === "impact") {
                                      triggerImpactHaptic();
                                  }
                              }
                              onPress(event);
                          }
                        : undefined
                }
                onPressIn={(event) => {
                    if (!disabled && !useAndroidRipple) {
                        pressed.set(
                            reducedMotion
                                ? 1
                                : withTiming(1, {
                                      duration: motionDuration.fast,
                                      easing: motionEase,
                                  }),
                        );
                    }
                    onPressIn?.(event);
                }}
                onPressOut={(event) => {
                    if (!useAndroidRipple) {
                        pressed.set(
                            reducedMotion
                                ? 0
                                : withTiming(0, {
                                      duration: motionDuration.fast,
                                      easing: motionEase,
                                  }),
                        );
                    }
                    onPressOut?.(event);
                }}
                style={
                    typeof style === "function"
                        ? (state: PressableStateCallbackType) => [style(state), animatedStyle]
                        : [style, animatedStyle]
                }
            />
        );
    },
);
