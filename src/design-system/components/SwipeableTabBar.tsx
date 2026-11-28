import { useMemo, useState } from "react";
import { Animated, View } from "react-native";
import type { NavigationState, SceneRendererProps } from "react-native-tab-view";
import { cn } from "../utils/cn";
import { typography } from "../utils/typography";
import { AnimatedPressable } from "./AnimatedPressable";
import { AppText } from "./AppText";

export type SwipeableTabRoute = {
    key: string;
    title: string;
    accessibilityLabel?: string;
};

type SwipeableTabBarProps<TRoute extends SwipeableTabRoute> = SceneRendererProps & {
    navigationState: NavigationState<TRoute>;
    onTabPress: (index: number) => void;
};

const TAB_GAP = 4;

export function SwipeableTabBar<TRoute extends SwipeableTabRoute>({
    position,
    navigationState,
    onTabPress,
}: SwipeableTabBarProps<TRoute>) {
    const [trackWidth, setTrackWidth] = useState(0);
    const { routes, index: activeIndex } = navigationState;
    const count = routes.length;
    const hasMeasured = trackWidth > 0 && count > 0;
    const pillWidth = hasMeasured ? (trackWidth - (count - 1) * TAB_GAP) / count : 0;
    const step = pillWidth + TAB_GAP;

    const indicatorTranslateX = useMemo(
        () =>
            count > 1
                ? position.interpolate({
                      inputRange: [0, count - 1],
                      outputRange: [0, step * (count - 1)],
                      extrapolate: "clamp",
                  })
                : 0,
        [count, position, step],
    );

    const activeOpacities = useMemo(
        () =>
            count > 1
                ? Array.from({ length: count }, (_, tabIndex) =>
                      position.interpolate({
                          inputRange: [tabIndex - 1, tabIndex, tabIndex + 1],
                          outputRange: [0, 1, 0],
                          extrapolate: "clamp",
                      }),
                  )
                : null,
        [count, position],
    );

    return (
        <View className="rounded-2xl bg-surface p-1">
            <View
                accessibilityRole="tablist"
                className="relative flex-row gap-1"
                onLayout={({ nativeEvent }) => setTrackWidth(nativeEvent.layout.width)}
            >
                {hasMeasured ? (
                    <Animated.View
                        pointerEvents="none"
                        className="absolute inset-y-0 left-0 rounded-xl bg-primary"
                        style={{
                            width: pillWidth,
                            transform: [{ translateX: indicatorTranslateX }],
                        }}
                    />
                ) : null}
                {routes.map((route, tabIndex) => {
                    const isSelected = activeIndex === tabIndex;
                    const activeOpacity = activeOpacities ? activeOpacities[tabIndex] : isSelected ? 1 : 0;

                    return (
                        <AnimatedPressable
                            key={route.key}
                            accessibilityRole="tab"
                            accessibilityLabel={route.accessibilityLabel ?? route.title}
                            accessibilityState={{
                                selected: isSelected,
                            }}
                            className={cn(
                                "min-h-12 flex-1 items-center justify-center rounded-xl px-1",
                                isSelected && !hasMeasured && "bg-primary",
                            )}
                            onPress={() => onTabPress(tabIndex)}
                        >
                            <AppText
                                variant="caption"
                                color={isSelected && !hasMeasured ? "primaryForeground" : "mutedForeground"}
                                align="center"
                                wrap={false}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1.35}
                                textStyle={{
                                    lineHeight: typography.caption.lineHeight,
                                    fontSize: typography.caption.fontSize,
                                    fontWeight: "600",
                                }}
                            >
                                {route.title}
                            </AppText>
                            {hasMeasured ? (
                                <Animated.View
                                    pointerEvents="none"
                                    className="absolute inset-0 items-center justify-center px-1"
                                    style={{ opacity: activeOpacity }}
                                >
                                    <AppText
                                        variant="caption"
                                        color="primaryForeground"
                                        align="center"
                                        wrap={false}
                                        numberOfLines={1}
                                        maxFontSizeMultiplier={1.35}
                                        textStyle={{
                                            lineHeight: typography.caption.lineHeight,
                                            fontSize: typography.caption.fontSize,
                                            fontWeight: "600",
                                        }}
                                    >
                                        {route.title}
                                    </AppText>
                                </Animated.View>
                            ) : null}
                        </AnimatedPressable>
                    );
                })}
            </View>
        </View>
    );
}
