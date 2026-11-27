import { RESERVATION_TABS, ReservationTabScene } from "@/components/golf/reservation/ReservationTabScene";
import { Screen, SwipeableTabBar, type SwipeableTabRoute, triggerSelectionHaptic } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { useDayClock } from "@/lib/hook/useMinuteClock";
import { MemberReservationType } from "@/service/reservation.service";
import { toAppTimeZoneDate } from "@/utils/timezone";
import { MenuView, type MenuAction } from "@expo/ui/community/menu";
import { format } from "date-fns/format";
import { subDays } from "date-fns/subDays";
import { Stack, useIsFocused } from "expo-router";
import Filter from "lucide-react-native/icons/funnel";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { TabView, type TabBarProps } from "react-native-tab-view";

type ReservationPeriod = "all" | "upcoming" | "past";

export default function ReservationScreen() {
    const { t } = useTranslation();
    const { colors, resolvedScheme } = useTheme();
    const reducedMotion = useReducedMotion();
    const [activeIndex, setActiveIndex] = useState(0);
    const [period, setPeriod] = useState<ReservationPeriod>("all");
    const referenceTime = useDayClock();
    const businessDate = toAppTimeZoneDate(referenceTime)!;
    const today = format(businessDate, "yyyy-MM-dd");
    const yesterday = format(subDays(businessDate, 1), "yyyy-MM-dd");
    const from = period === "upcoming" ? today : undefined;
    const to = period === "past" ? yesterday : undefined;

    const filterActions: MenuAction[] = useMemo(
        () => [
            {
                id: "all",
                title: t("reservations.period.all"),
                image: "calendar",
                state: period === "all" ? "on" : "off",
            },
            {
                id: "upcoming",
                title: t("reservations.period.upcoming"),
                image: "clock",
                state: period === "upcoming" ? "on" : "off",
            },
            {
                id: "past",
                title: t("reservations.period.past"),
                image: "clock.arrow.circlepath",
                state: period === "past" ? "on" : "off",
            },
        ],
        [period, t],
    );

    const routes = useMemo<SwipeableTabRoute[]>(
        () =>
            RESERVATION_TABS.map((key) => {
                const title = t(`reservations.tabs.${key}`);
                return {
                    key,
                    title,
                    accessibilityLabel: t("reservations.showTabAccessibility", {
                        label: title,
                    }),
                };
            }),
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

    const isFocused = useIsFocused();
    const renderScene = useCallback(
        ({ route }: { route: { key: string } }) => (
            <ReservationTabScene
                type={route.key as MemberReservationType}
                isActive={isFocused && route.key === RESERVATION_TABS[activeIndex]}
                from={from}
                to={to}
                period={period}
                onPeriodChange={setPeriod}
            />
        ),
        [activeIndex, from, isFocused, period, to],
    );

    const renderTabBar = useCallback(
        (props: TabBarProps<SwipeableTabRoute>) => <SwipeableTabBar {...props} onTabPress={handleTabChange} />,
        [handleTabChange],
    );

    const screenOptions = useMemo(
        () => ({
            headerRight: () => (
                <MenuView
                    actions={filterActions}
                    colorScheme={resolvedScheme}
                    onPressAction={({ nativeEvent }) => {
                        const nextPeriod = nativeEvent.event;
                        if (nextPeriod === "all" || nextPeriod === "upcoming" || nextPeriod === "past") {
                            triggerSelectionHaptic();
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
        }),
        [colors.foreground, colors.primary, filterActions, period, resolvedScheme, t],
    );

    return (
        <>
            <Stack.Screen options={screenOptions} />
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
