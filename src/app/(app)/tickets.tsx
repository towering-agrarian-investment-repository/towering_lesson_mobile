import {
    TICKET_TABS,
    TicketTabScene,
} from "@/components/golf/TicketTabScene";
import { AppText, cn, getPressedScaleStyle, Screen } from "@/design-system";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { TabView } from "react-native-tab-view";

export default function TicketsScreen() {
    const { t } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const routes = useMemo(
        () =>
            TICKET_TABS.map((key) => ({
                key,
                title: t(`tickets.filters.${key}`),
            })),
        [t],
    );

    const renderScene = useCallback(
        ({ route }: { route: { key: string } }) => (
            <TicketTabScene type={route.key as (typeof TICKET_TABS)[number]} />
        ),
        [],
    );

    return (
        <Screen
            scroll={false}
            horizontalPadding={false}
            contentClassName="px-6"
        >
            <View className="rounded-2xl bg-surface p-1">
                <View className="flex-row gap-1">
                    {TICKET_TABS.map((tab) => {
                        const tabIndex = TICKET_TABS.indexOf(tab);
                        const isActive = tabIndex === activeIndex;

                        return (
                            <Pressable
                                key={tab}
                                accessibilityRole="button"
                                accessibilityLabel={t(
                                    "tickets.showTabAccessibility",
                                    { label: t(`tickets.filters.${tab}`) },
                                )}
                                accessibilityState={{ selected: isActive }}
                                className={cn(
                                    "min-h-11 flex-1 items-center justify-center rounded-2xl px-1",
                                    isActive ? "bg-card" : "bg-transparent",
                                )}
                                style={({ pressed }) =>
                                    getPressedScaleStyle(pressed, false, 0.992)
                                }
                                onPress={() => {
                                    if (!isActive) {
                                        setActiveIndex(tabIndex);
                                    }
                                }}
                            >
                                <AppText
                                    className={cn(
                                        "text-xs font-semibold",
                                        isActive
                                            ? "text-primary"
                                            : "text-foreground/75",
                                    )}
                                >
                                    {t(`tickets.filters.${tab}`)}
                                </AppText>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <TabView
                navigationState={{ index: activeIndex, routes }}
                onIndexChange={setActiveIndex}
                renderScene={renderScene}
                renderTabBar={() => null}
                lazy
                style={{ flex: 1 }}
            />
        </Screen>
    );
}
