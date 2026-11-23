import { forwardRef, useEffect, type ElementRef } from "react";
import {
    Pressable,
    type PressableProps,
    type PressableStateCallbackType,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

import {
    triggerImpactHaptic,
    triggerSelectionHaptic,
} from "../utils/haptics";

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_EASING = Easing.bezier(0.23, 1, 0.32, 1);
const PRESS_DURATION_MS = 120;
const PRESSED_SCALE = 0.97;
const PRESSED_OPACITY = 0.92;

type AnimatedPressableProps = Omit<PressableProps, "style"> & {
    className?: string;
    style?: PressableProps["style"];
    haptic?: "selection" | "impact" | false;
};

export const AnimatedPressable = forwardRef<
    ElementRef<typeof Pressable>,
    AnimatedPressableProps
>(function AnimatedPressable(
    {
        disabled,
        pressRetentionOffset = 16,
        haptic = false,
        onPress,
        onPressIn,
        onPressOut,
        style,
        ...props
    },
    ref,
) {
    const pressed = useSharedValue(0);
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        if (disabled) {
            pressed.set(0);
        }
    }, [disabled, pressed]);

    const animatedStyle = useAnimatedStyle(() => {
        const progress = pressed.get();
        return {
            opacity: 1 - progress * (1 - PRESSED_OPACITY),
            transform: [
                {
                    scale: reducedMotion
                        ? 1
                        : 1 - progress * (1 - PRESSED_SCALE),
                },
            ],
        };
    });

    return (
        <ReanimatedPressable
            {...props}
            ref={ref}
            disabled={disabled}
            pressRetentionOffset={pressRetentionOffset}
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
                if (!disabled) {
                    pressed.set(
                        reducedMotion
                            ? 1
                            : withTiming(1, {
                                  duration: PRESS_DURATION_MS,
                                  easing: PRESS_EASING,
                              }),
                    );
                }
                onPressIn?.(event);
            }}
            onPressOut={(event) => {
                pressed.set(
                    reducedMotion
                        ? 0
                        : withTiming(0, {
                              duration: PRESS_DURATION_MS,
                              easing: PRESS_EASING,
                          }),
                );
                onPressOut?.(event);
            }}
            style={
                typeof style === "function"
                    ? (state: PressableStateCallbackType) => [
                          style(state),
                          animatedStyle,
                      ]
                    : [style, animatedStyle]
            }
        />
    );
});
