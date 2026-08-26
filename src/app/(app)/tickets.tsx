import {
    TICKET_TABS,
    TicketTabScene,
} from "@/components/golf/TicketTabScene";
import { AppText, getPressedScaleStyle, Screen } from "@/design-system";
import { useCallback, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, View } from "react-native";
import { TabView, type TabBarProps } from "react-native-tab-view";

type TicketRoute = {
    key: string;
    title: string;
};

export default function TicketsScreen() {
    const { t } = useTranslation();
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
    const handleTabChange = useCallback((nextIndex: number) => {
        if (nextIndex === activeIndex) {
            return;
        }

        void Haptics.selectionAsync();
        setActiveIndex(nextIndex);
    }, [activeIndex]);

    const renderScene = useCallback(
        ({ route }: { route: { key: string } }) => (
            <TicketTabScene type={route.key as (typeof TICKET_TABS)[number]} />
        ),
        [],
    );
    const renderTabBar = useCallback(
        ({ position }: TabBarProps<TicketRoute>) => (
            <View className="rounded-2xl bg-surface p-1">
                <View
                    className="relative flex-row gap-1"
                    onLayout={({ nativeEvent }) => setTabBarWidth(nativeEvent.layout.width)}
                >
                    {tabBarWidth > 0 ? (
                        <Animated.View
                            pointerEvents="none"
                            className="absolute inset-y-0 left-0 rounded-2xl bg-primary"
                            style={{
                                width: (tabBarWidth - (TICKET_TABS.length - 1) * 4) /
                                    TICKET_TABS.length,
                                transform: [
                                    {
                                        translateX: position.interpolate({
                                            inputRange: [0, TICKET_TABS.length - 1],
                                            outputRange: [
                                                0,
                                                ((tabBarWidth - (TICKET_TABS.length - 1) * 4) /
                                                    TICKET_TABS.length + 4) *
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
                            <Pressable
                                key={tab}
                                accessibilityRole="button"
                                accessibilityLabel={t(
                                    "tickets.showTabAccessibility",
                                    { label: t(`tickets.filters.${tab}`) },
                                )}
                                accessibilityState={{ selected: activeIndex === tabIndex }}
                                className="min-h-11 flex-1 items-center justify-center rounded-2xl px-1"
                                style={({ pressed }) =>
                                    getPressedScaleStyle(pressed, false, 0.992)
                                }
                                onPress={() => handleTabChange(tabIndex)}
                            >
                                <AppText
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.85}
                                    className="text-xs font-semibold text-muted-foreground"
                                >
                                    {t(`tickets.filters.${tab}`)}
                                </AppText>
                                <Animated.View
                                    pointerEvents="none"
                                    className="absolute inset-0 items-center justify-center"
                                    style={{ opacity: activeOpacity }}
                                >
                                    <AppText
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.85}
                                        className="text-xs font-semibold text-primary-foreground"
                                    >
                                        {t(`tickets.filters.${tab}`)}
                                    </AppText>
                                </Animated.View>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        ),
        [activeIndex, handleTabChange, t, tabBarWidth],
    );

    return (
        <Screen
            scroll={false}
            horizontalPadding={false}
            contentClassName="px-6"
        >
            <TabView
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
