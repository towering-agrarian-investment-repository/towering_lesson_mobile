import {
    RESERVATION_TABS,
    ReservationTabScene,
} from "@/components/golf/reservation/ReservationTabScene";
import { AppText, cn, getPressedScaleStyle, Screen } from "@/design-system";
import { MemberReservationType } from "@/service/reservation.service";
import { useCallback, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { TabView } from "react-native-tab-view";
import { useTranslation } from "react-i18next";

export default function ReservationScreen() {
    const { t } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const routes = useMemo(
        () => RESERVATION_TABS.map((key) => ({
            key,
            title: t(`reservations.tabs.${key}`),
        })),
        [t],
    );
    const renderScene = useCallback(
        ({ route }: { route: { key: string } }) => (
            <ReservationTabScene
                type={route.key as MemberReservationType}
            />
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
                    {RESERVATION_TABS.map((tab) => {
                                const tabIndex = RESERVATION_TABS.indexOf(tab);
                                const isActive = tabIndex === activeIndex;

                        return (
                            <Pressable
                                key={tab}
                                accessibilityRole="button"
                                accessibilityLabel={t("reservations.showTabAccessibility", {
                                    label: t(`reservations.tabs.${tab}`),
                                })}
                                accessibilityState={{ selected: isActive }}
                                className={cn(
                                    "min-h-11 flex-1 items-center justify-center rounded-2xl px-1",
                                    isActive
                                        ? "bg-card"
                                        : "bg-transparent",
                                )}
                                style={({ pressed }) => getPressedScaleStyle(pressed, false, 0.992)}
                                onPress={() => {
                                    if (!isActive) {
                                        setActiveIndex(tabIndex);
                                    }
                                }}
                            >
                                <AppText
                                    className={cn(
                                        "text-xs font-semibold",
                                        isActive ? "text-primary" : "text-foreground/75",
                                    )}
                                >
                                    {t(`reservations.tabs.${tab}`)}
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
