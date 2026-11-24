import { TICKET_TABS, TicketTabScene } from "@/components/golf/TicketTabScene";
import {
    AnimatedPressable,
    Screen,
    SwipeableTabBar,
    type SwipeableTabRoute,
    triggerSelectionHaptic,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { Stack, useRouter } from "expo-router";
import { History } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "react-native-reanimated";
import { TabView, type TabBarProps } from "react-native-tab-view";

export default function TicketsScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const router = useRouter();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const reducedMotion = useReducedMotion();
    const [activeIndex, setActiveIndex] = useState(0);

    const routes = useMemo<SwipeableTabRoute[]>(
        () =>
            TICKET_TABS.map((key) => {
                const title = t(`tickets.filters.${key}`);
                return {
                    key,
                    title,
                    accessibilityLabel: t("tickets.showTabAccessibility", {
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
        (props: TabBarProps<SwipeableTabRoute>) => <SwipeableTabBar {...props} onTabPress={handleTabChange} />,
        [handleTabChange],
    );

    const screenOptions = useMemo(
        () => ({
            headerRight: () => (
                <AnimatedPressable
                    accessibilityRole="button"
                    accessibilityLabel={t("tickets.openHistoryAccessibility")}
                    disabled={isLocked}
                    haptic="selection"
                    onPress={() => {
                        runWithNavigationLock(() => {
                            router.push("/ticket-history");
                        });
                    }}
                    className="min-h-12 min-w-12 items-center justify-center"
                >
                    <History size={22} color={colors.foreground} />
                </AnimatedPressable>
            ),
        }),
        [colors.foreground, isLocked, router, runWithNavigationLock, t],
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
