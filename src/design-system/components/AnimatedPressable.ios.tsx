import { forwardRef, useEffect, type ComponentRef } from "react";
import { Pressable, type PressableProps, type PressableStateCallbackType } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { triggerImpactHaptic, triggerSelectionHaptic } from "../utils/haptics";
import { motionDuration, motionEase, motionPressScale } from "../utils/motion";

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

export type AnimatedPressableProps = Omit<PressableProps, "style"> & {
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
                transform: [
                    {
                        scale: reducedMotion ? 1 : 1 - progress * (1 - motionPressScale),
                    },
                ],
            };
        });

        return (
            <ReanimatedPressable
                {...props}
                className={className}
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
                                      duration: motionDuration.fast,
                                      easing: motionEase,
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
                                  duration: motionDuration.fast,
                                  easing: motionEase,
                              }),
                    );
                    onPressOut?.(event);
                }}
                style={
                    typeof style === "function"
                        ? (state: PressableStateCallbackType) => [style(state), animatedStyle]
                        : [style, animatedStyle]
                }
            >
                {children}
            </ReanimatedPressable>
        );
    },
);
