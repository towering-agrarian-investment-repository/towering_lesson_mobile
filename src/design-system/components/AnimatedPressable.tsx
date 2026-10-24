import { forwardRef, useState, type ElementRef } from "react";
import { Pressable, type PressableProps } from "react-native";
import Animated, { cubicBezier, useReducedMotion } from "react-native-reanimated";

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_EASING = cubicBezier(0.23, 1, 0.32, 1);

type AnimatedPressableProps = Omit<PressableProps, "style"> & {
    className?: string;
    style?: PressableProps["style"];
};

export const AnimatedPressable = forwardRef<ElementRef<typeof Pressable>, AnimatedPressableProps>(
    function AnimatedPressable({ disabled, onHoverIn, onHoverOut, onPressIn, onPressOut, style, ...props }, ref) {
        const [pressed, setPressed] = useState(false);
        const [hovered, setHovered] = useState(false);
        const reducedMotion = useReducedMotion();

        return (
            <ReanimatedPressable
                {...props}
                ref={ref}
                disabled={disabled}
                onHoverIn={(event) => {
                    setHovered(true);
                    onHoverIn?.(event);
                }}
                onHoverOut={(event) => {
                    setHovered(false);
                    onHoverOut?.(event);
                }}
                onPressIn={(event) => {
                    setPressed(true);
                    onPressIn?.(event);
                }}
                onPressOut={(event) => {
                    setPressed(false);
                    onPressOut?.(event);
                }}
                style={[typeof style === "function" ? style({ pressed, hovered }) : style, {
                    transform: [{ scale: pressed && !disabled && !reducedMotion ? 0.985 : 1 }],
                    transitionProperty: "transform",
                    transitionDuration: reducedMotion ? 0 : 120,
                    transitionTimingFunction: PRESS_EASING,
                }]}
            />
        );
    },
);
