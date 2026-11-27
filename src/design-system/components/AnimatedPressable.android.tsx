import { forwardRef, type ComponentRef } from "react";
import { Pressable, StyleSheet, View, type PressableProps, type PressableStateCallbackType } from "react-native";

import { cn } from "../utils/cn";
import { colorWithOpacity } from "../utils/color";
import { triggerImpactHaptic, triggerSelectionHaptic } from "../utils/haptics";
import { useTheme } from "../utils/theme";

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
        const showPressedSurface = Boolean(onPress) && android_ripple == null;
        const pressedColor = showPressedSurface
            ? colorWithOpacity(colors.foreground, resolvedScheme === "dark" ? 0.14 : 0.08)
            : undefined;

        return (
            <Pressable
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
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={style}
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
            </Pressable>
        );
    },
);
