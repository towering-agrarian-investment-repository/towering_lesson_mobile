import { NativeText } from "@/design-system/components/NativeText";
import {
    RESERVATION_TABS,
    ReservationTabScene,
} from "@/components/golf/reservation/ReservationTabScene";
import { AnimatedPressable, Screen } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { useMinuteClock } from "@/lib/hook/useMinuteClock";
import { MemberReservationType } from "@/service/reservation.service";
import { toAppTimeZoneDate } from "@/utils/timezone";
import { MenuView, type MenuAction } from "@expo/ui/community/menu";
import { format, subDays } from "date-fns";
import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import { Filter } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, View } from "react-native";
import { TabView, type TabBarProps } from "react-native-tab-view";
import { useReducedMotion } from "react-native-reanimated";

type ReservationRoute = {
    key: string;
    title: string;
};

type ReservationPeriod = "all" | "upcoming" | "past";

export default function ReservationScreen() {

    const { t } = useTranslation();
    const { colors, resolvedScheme } = useTheme();
    const reducedMotion = useReducedMotion();
    const [activeIndex, setActiveIndex] = useState(0);
    const [period, setPeriod] = useState<ReservationPeriod>("all");
    const [tabBarWidth, setTabBarWidth] = useState(0);
    const referenceTime = useMinuteClock();
    const businessDate = toAppTimeZoneDate(referenceTime)!;
    const today = format(businessDate, "yyyy-MM-dd");
    const yesterday = format(subDays(businessDate, 1), "yyyy-MM-dd");
    const from = period === "upcoming" ? today : undefined;
    const to = period === "past" ? yesterday : undefined;
    const filterActions: MenuAction[] = [
        {
            id: "all",
            title: t("reservations.period.all"),
            state: period === "all" ? "on" : "off",
        },
        {
            id: "upcoming",
            title: t("reservations.period.upcoming"),
            state: period === "upcoming" ? "on" : "off",
        },
        {
            id: "past",
            title: t("reservations.period.past"),
            state: period === "past" ? "on" : "off",
        },
    ];
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
                from={from}
                to={to}
                period={period}
                onPeriodChange={setPeriod}
            />
        ),
        [from, period, referenceTime, to],
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
        <>
            <Stack.Screen options={{
                headerRight: () => (
                    <MenuView
                        actions={filterActions}
                        colorScheme={resolvedScheme}
                        onPressAction={({ nativeEvent }) => {
                            const nextPeriod = nativeEvent.event;
                            if (nextPeriod === "all" || nextPeriod === "upcoming" || nextPeriod === "past") {
                                setPeriod(nextPeriod);
                            }
                        }}
                    >
                        <View
                            accessibilityRole="button"
                            accessibilityLabel={t("reservations.filterAccessibility", {
                                period: t(`reservations.period.${period}`),
                            })}
                            accessibilityState={{ selected: period !== "all" }}
                            className="min-h-12 min-w-12 items-center justify-center"
                        >
                            <Filter
                                size={22}
                                color={period === "all" ? colors.foreground : colors.primary}
                                fill={period === "all" ? "none" : colors.primary}
                            />
                        </View>
                    </MenuView>
                ),
            }} />
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
