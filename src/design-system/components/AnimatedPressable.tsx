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

const PRESS_EASING = Easing.bezier(0.23, 1, 0.32, 1);
const PRESS_DURATION_MS = 120;
const PRESSED_SCALE = 0.97;
const PRESSED_OPACITY = 0.92;
const OUTER_CLASS_TOKEN =
    /^(?:(?:disabled:)?opacity-\S+|flex-1|grow|shrink(?:-0)?|self-\S+|w-full)$/;

function splitPressableClassName(className?: string) {
    if (!className) {
        return { outerClassName: undefined, innerClassName: undefined };
    }
    const outerTokens: string[] = [];
    const innerTokens: string[] = [];
    for (const token of className.trim().split(/\s+/)) {
        if (!token) continue;
        if (OUTER_CLASS_TOKEN.test(token)) {
            outerTokens.push(token);
            if (token === "w-full") {
                innerTokens.push(token);
            }
        } else {
            innerTokens.push(token);
        }
    }
    return {
        outerClassName:
            outerTokens.length > 0 ? outerTokens.join(" ") : undefined,
        innerClassName:
            innerTokens.length > 0 ? innerTokens.join(" ") : undefined,
    };
}

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
        children,
        className,
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
    const { outerClassName, innerClassName } =
        splitPressableClassName(className);

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
        <Pressable
            {...props}
            ref={ref}
            disabled={disabled}
            className={outerClassName}
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
        >
            {(state: PressableStateCallbackType) => (
                <Animated.View
                    className={innerClassName}
                    style={[
                        { flexGrow: 1 },
                        typeof style === "function" ? style(state) : style,
                        animatedStyle,
                    ]}
                >
                    {typeof children === "function"
                        ? children(state)
                        : children}
                </Animated.View>
            )}
        </Pressable>
    );
});
