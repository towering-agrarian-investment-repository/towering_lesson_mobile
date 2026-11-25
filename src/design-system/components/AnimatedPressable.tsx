import { forwardRef, useEffect, type ComponentRef } from "react";
import { Pressable, StyleSheet, View, type PressableProps, type PressableStateCallbackType } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { cn } from "../utils/cn";
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
};

export const AnimatedPressable = forwardRef<ComponentRef<typeof Pressable>, AnimatedPressableProps>(
    function AnimatedPressable(
        {
            disabled,
            pressRetentionOffset = 16,
            haptic = false,
            android_ripple,
            className,
            children,
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
        const useAndroidFeedback = IS_ANDROID && Boolean(onPress);
        const showPressedSurface = useAndroidFeedback && android_ripple == null;
        const pressedColor = showPressedSurface
            ? colorWithOpacity(colors.foreground, resolvedScheme === "dark" ? 0.14 : 0.08)
            : undefined;

        useEffect(() => {
            if (disabled || useAndroidFeedback) {
                pressed.set(0);
            }
        }, [disabled, pressed, useAndroidFeedback]);

        const animatedStyle = useAnimatedStyle(() => {
            const progress = pressed.get();
            return {
                transform: [
                    {
                        scale: reducedMotion || useAndroidFeedback ? 1 : 1 - progress * (1 - motionPressScale),
                    },
                ],
            };
        });

        return (
            <ReanimatedPressable
                {...props}
                // Keep the active: variant stable for the component's lifetime:
                // react-native-css resets pressable state and re-mounts children if a
                // pressable variant appears or disappears after mount. A disabled
                // pressable can never be active, so keeping the variant is harmless.
                className={cn(className, showPressedSurface && "active:overflow-hidden")}
                ref={ref}
                disabled={disabled}
                pressRetentionOffset={pressRetentionOffset}
                android_ripple={android_ripple}
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
                    if (!disabled && !useAndroidFeedback) {
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
                    if (!useAndroidFeedback) {
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
            >
                {showPressedSurface
                    ? (state: PressableStateCallbackType) => (
                          <>
                              {typeof children === "function" ? children(state) : children}
                              {!disabled && state.pressed ? (
                                  <View
                                      pointerEvents="none"
                                      accessible={false}
                                      style={[StyleSheet.absoluteFill, { backgroundColor: pressedColor }]}
                                  />
                              ) : null}
                          </>
                      )
                    : children}
            </ReanimatedPressable>
        );
    },
);
