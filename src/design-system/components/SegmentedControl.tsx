import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { cn } from "../utils/cn";
import { triggerSelectionHaptic } from "../utils/haptics";
import { AppText } from "./AppText";

const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
const SEGMENT_GAP = 4;

export type SegmentedOption<T extends string> = {
    value: T;
    label: string;
    accessibilityLabel?: string;
};

type SegmentedControlProps<T extends string> = {
    options: readonly SegmentedOption<T>[];
    value: T;
    onChange: (value: T) => void;
    disabled?: boolean;
    className?: string;
};

export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    disabled = false,
    className,
}: SegmentedControlProps<T>) {
    const reducedMotion = useReducedMotion();
    const [trackWidth, setTrackWidth] = useState(0);
    const hasAnimatedRef = useRef(false);
    const indicatorX = useSharedValue(0);
    const count = options.length;
    const activeIndex = Math.max(
        0,
        options.findIndex((option) => option.value === value),
    );
    const hasMeasured = trackWidth > 0 && count > 0;
    const segmentWidth = hasMeasured
        ? (trackWidth - (count - 1) * SEGMENT_GAP) / count
        : 0;
    const targetX = activeIndex * (segmentWidth + SEGMENT_GAP);

    useEffect(() => {
        if (!hasMeasured) return;

        if (!hasAnimatedRef.current || reducedMotion) {
            indicatorX.set(targetX);
            hasAnimatedRef.current = true;
            return;
        }

        indicatorX.set(
            withTiming(targetX, {
                duration: 200,
                easing: EASE_IN_OUT,
            }),
        );
    }, [hasMeasured, indicatorX, reducedMotion, targetX]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: indicatorX.get() }],
    }));

    return (
        <View
            accessibilityRole="tablist"
            className={cn(
                "rounded-2xl bg-muted p-1",
                disabled && "opacity-60",
                className,
            )}
        >
            <View
                className="relative flex-row items-center gap-1"
                onLayout={(event) =>
                    setTrackWidth(event.nativeEvent.layout.width)
                }
            >
                {hasMeasured ? (
                    <Animated.View
                        pointerEvents="none"
                        className="absolute inset-y-0 left-0 rounded-xl border border-border/50 bg-card"
                        style={[{ width: segmentWidth }, indicatorStyle]}
                    />
                ) : null}
                {options.map((option) => {
                    const isSelected = option.value === value;
                    return (
                        <Pressable
                            key={option.value}
                            accessibilityRole="tab"
                            accessibilityLabel={
                                option.accessibilityLabel ?? option.label
                            }
                            accessibilityState={{
                                selected: isSelected,
                                disabled,
                            }}
                            disabled={disabled}
                            pressRetentionOffset={16}
                            onPress={() => {
                                if (disabled || isSelected) return;
                                triggerSelectionHaptic();
                                onChange(option.value);
                            }}
                            className={cn(
                                "min-h-12 flex-1 items-center justify-center rounded-xl px-3 py-2",
                                !isSelected && "active:opacity-70",
                                isSelected &&
                                    !hasMeasured &&
                                    "border border-border/50 bg-card",
                            )}
                        >
                            <AppText
                                variant="meta"
                                color={
                                    isSelected
                                        ? "foreground"
                                        : "mutedForeground"
                                }
                                align="center"
                                numberOfLines={1}
                                textStyle={{
                                    fontWeight: isSelected ? "700" : "600",
                                }}
                            >
                                {option.label}
                            </AppText>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
