import { NativeText } from "@/design-system/components/NativeText";
import { TICKET_TABS, TicketTabScene } from "@/components/golf/TicketTabScene";
import { AnimatedPressable, Screen, triggerSelectionHaptic } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { Stack, useRouter } from "expo-router";
import { History } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, View } from "react-native";
import { TabView, type TabBarProps } from "react-native-tab-view";
import { useReducedMotion } from "react-native-reanimated";

type TicketRoute = {
    key: string;
    title: string;
};

export default function TicketsScreen() {

    const { t } = useTranslation();
    const { colors } = useTheme();
    const router = useRouter();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const reducedMotion = useReducedMotion();
    const [activeIndex, setActiveIndex] = useState(0);
    const [tabBarWidth, setTabBarWidth] = useState(0);
    const routes = useMemo(
        () =>
            TICKET_TABS.map((key) => ({
                key,
                title: t(`tickets.filters.${key}`),
            })),
        [t],
    );
    const handleTabChange = useCallback(
        (nextIndex: number) => {
            if (nextIndex === activeIndex) {
                return;
            }

            triggerSelectionHaptic();
            setActiveIndex(nextIndex);
        },
        [activeIndex],
    );

    const renderScene = useCallback(
        ({ route }: { route: { key: string } }) => (
            <TicketTabScene
                type={route.key as (typeof TICKET_TABS)[number]}
                isActive={route.key === TICKET_TABS[activeIndex]}
            />
        ),
        [activeIndex],
    );
    const renderTabBar = useCallback(
        ({ position }: TabBarProps<TicketRoute>) => (
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
                            className="absolute inset-y-0 left-0 rounded-xl bg-primary"
                            style={{
                                width:
                                    (tabBarWidth -
                                        (TICKET_TABS.length - 1) * 4) /
                                    TICKET_TABS.length,
                                transform: [
                                    {
                                        translateX: position.interpolate({
                                            inputRange: [
                                                0,
                                                TICKET_TABS.length - 1,
                                            ],
                                            outputRange: [
                                                0,
                                                ((tabBarWidth -
                                                    (TICKET_TABS.length - 1) *
                                                    4) /
                                                    TICKET_TABS.length +
                                                    4) *
                                                (TICKET_TABS.length - 1),
                                            ],
                                            extrapolate: "clamp",
                                        }),
                                    },
                                ],
                            }}
                        />
                    ) : null}
                    {TICKET_TABS.map((tab, tabIndex) => {
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
                                    "tickets.showTabAccessibility",
                                    { label: t(`tickets.filters.${tab}`) },
                                )}
                                accessibilityState={{
                                    selected: activeIndex === tabIndex,
                                }}
                                className="min-h-11 flex-1 items-center justify-center rounded-xl px-1"
                                onPress={() => handleTabChange(tabIndex)}
                            >
                                <NativeText
                                    variant="body"
                                    color="mutedForeground"
                                    wrap={false}
                                    numberOfLines={1}
                                    textStyle={{ lineHeight: typography.caption.lineHeight, fontSize: typography.caption.fontSize, fontWeight: "600" as const }}
                                >
                                    {t(`tickets.filters.${tab}`)}
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
                                        {t(`tickets.filters.${tab}`)}
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
        <>
            <Stack.Screen
                options={{
                    headerRight: () => (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t("tickets.openHistoryAccessibility")}
                            disabled={isLocked}
                            onPress={() => {
                                triggerSelectionHaptic();
                                runWithNavigationLock(() => {
                                    router.push("/ticket-history");
                                });
                            }}
                            className="min-h-12 min-w-12 items-center justify-center active:opacity-70"
                        >
                            <History size={22} color={colors.foreground} />
                        </Pressable>
                    ),
                }}
            />
            <Screen scroll={false} bottomPadding={16}>
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
        </>
    );
}
