import { NativeText } from "@/design-system/components/NativeText";
import {
    RESERVATION_TABS,
    ReservationTabScene,
} from "@/components/golf/reservation/ReservationTabScene";
import { AnimatedPressable, Screen } from "@/design-system";
import { typography } from "@/design-system/utils/typography";
import { MemberReservationType } from "@/service/reservation.service";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, AppState, View } from "react-native";
import { TabView, type TabBarProps } from "react-native-tab-view";
import { useReducedMotion } from "react-native-reanimated";

type ReservationRoute = {
    key: string;
    title: string;
};

export default function ReservationScreen() {

    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const [activeIndex, setActiveIndex] = useState(0);
    const [tabBarWidth, setTabBarWidth] = useState(0);
    const [referenceTime, setReferenceTime] = useState(Date.now);
    useFocusEffect(useCallback(() => {
        let timer: ReturnType<typeof setInterval> | undefined;
        const syncClock = () => {
            if (timer !== undefined) clearInterval(timer);
            timer = undefined;
            if (AppState.currentState !== "active") return;
            setReferenceTime(Date.now());
            timer = setInterval(() => setReferenceTime(Date.now()), 60_000);
        };

        syncClock();
        const subscription = AppState.addEventListener("change", syncClock);
        return () => {
            if (timer !== undefined) clearInterval(timer);
            subscription.remove();
        };
    }, []));
    const routes = useMemo(
        () =>
            RESERVATION_TABS.map((key) => ({
                key,
                title: t(`reservations.tabs.${key}`),
            })),
        [t],
    );
    const handleTabChange = useCallback(
        (nextIndex: number) => {
            if (nextIndex === activeIndex) {
                return;
            }

            void Haptics.selectionAsync();
            setActiveIndex(nextIndex);
        },
        [activeIndex],
    );
    const renderScene = useCallback(
        ({ route }: { route: { key: string } }) => (
            <ReservationTabScene
                type={route.key as MemberReservationType}
                referenceTime={referenceTime}
            />
        ),
        [referenceTime],
    );
    const renderTabBar = useCallback(
        ({ position }: TabBarProps<ReservationRoute>) => (
            <View className="rounded-2xl bg-surface p-1">
                <View
                    className="relative flex-row gap-1"
                    onLayout={({ nativeEvent }) =>
                        setTabBarWidth(nativeEvent.layout.width)
                    }
                >
                    {tabBarWidth > 0 ? (
                        <Animated.View
                            pointerEvents="none"
                            className="absolute inset-y-0 left-0 rounded-2xl bg-primary"
                            style={{
                                width:
                                    (tabBarWidth -
                                        (RESERVATION_TABS.length - 1) * 4) /
                                    RESERVATION_TABS.length,
                                transform: [
                                    {
                                        translateX: position.interpolate({
                                            inputRange: [
                                                0,
                                                RESERVATION_TABS.length - 1,
                                            ],
                                            outputRange: [
                                                0,
                                                ((tabBarWidth -
                                                    (RESERVATION_TABS.length -
                                                        1) *
                                                    4) /
                                                    RESERVATION_TABS.length +
                                                    4) *
                                                (RESERVATION_TABS.length -
                                                    1),
                                            ],
                                            extrapolate: "clamp",
                                        }),
                                    },
                                ],
                            }}
                        />
                    ) : null}
                    {RESERVATION_TABS.map((tab, tabIndex) => {
                        const activeOpacity = position.interpolate({
                            inputRange: [tabIndex - 1, tabIndex, tabIndex + 1],
                            outputRange: [0, 1, 0],
                            extrapolate: "clamp",
                        });

                        return (
                            <AnimatedPressable
                                key={tab}
                                accessibilityRole="button"
                                accessibilityLabel={t(
                                    "reservations.showTabAccessibility",
                                    {
                                        label: t(`reservations.tabs.${tab}`),
                                    },
                                )}
                                accessibilityState={{
                                    selected: activeIndex === tabIndex,
                                }}
                                className="min-h-11 flex-1 items-center justify-center rounded-2xl px-1"
                                onPress={() => handleTabChange(tabIndex)}
                            >
                                <NativeText
                                    variant="body"
                                    color="mutedForeground"
                                    wrap={false}
                                    numberOfLines={1}
                                    textStyle={{ lineHeight: typography.caption.lineHeight, fontSize: typography.caption.fontSize, fontWeight: "600" as const }}
                                >
                                    {t(`reservations.tabs.${tab}`)}
                                </NativeText>
                                <Animated.View
                                    pointerEvents="none"
                                    className="absolute inset-0 items-center justify-center"
                                    style={{ opacity: activeOpacity }}
                                >
                                    <NativeText
                                        variant="body"
                                        color="primaryForeground"
                                        wrap={false}
                                        numberOfLines={1}
                                        textStyle={{ lineHeight: typography.caption.lineHeight, fontSize: typography.caption.fontSize, fontWeight: "600" as const }}
                                    >
                                        {t(`reservations.tabs.${tab}`)}
                                    </NativeText>
                                </Animated.View>
                            </AnimatedPressable>
                        );
                    })}
                </View>
            </View>
        ),
        [activeIndex, handleTabChange, t, tabBarWidth],
    );

    return (
        <Screen scroll={false}>
            <TabView
                animationEnabled={!reducedMotion}
                navigationState={{ index: activeIndex, routes }}
                onIndexChange={handleTabChange}
                renderScene={renderScene}
                renderTabBar={renderTabBar}
                lazy
                style={{ flex: 1 }}
            />
        </Screen>
    );
}
