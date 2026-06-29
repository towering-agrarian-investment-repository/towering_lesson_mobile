import {
    RESERVATION_TABS,
    ReservationTabScene,
} from "@/components/golf/reservation/ReservationTabScene";
import { AppText, cn, getPressedScaleStyle, Screen } from "@/design-system";
import { MemberReservationType } from "@/service/reservation.service";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function ReservationScreen() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<MemberReservationType>(
        RESERVATION_TABS[0],
    );

    return (
        <Screen
            scroll={false}
            horizontalPadding={false}
            contentClassName="px-6"
        >
            <View className="rounded-2xl bg-surface p-1">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={{
                        gap: 8,
                    }}
                >
                    {RESERVATION_TABS.map((tab) => {
                        const isActive = tab === activeTab;

                        return (
                            <Pressable
                                key={tab}
                                accessibilityRole="button"
                                accessibilityLabel={t("reservations.showTabAccessibility", {
                                    label: t(`reservations.tabs.${tab}`),
                                })}
                                accessibilityState={{ selected: isActive }}
                                className={cn(
                                    "min-h-11 items-center justify-center rounded-2xl px-4",
                                    isActive
                                        ? "bg-card"
                                        : "bg-transparent",
                                )}
                                style={({ pressed }) => getPressedScaleStyle(pressed, false, 0.992)}
                                onPress={() => {
                                    if (!isActive) {
                                        setActiveTab(tab);
                                    }
                                }}
                            >
                                <AppText
                                    className={cn(
                                        "text-sm font-semibold",
                                        isActive ? "text-primary" : "text-foreground/75",
                                    )}
                                >
                                    {t(`reservations.tabs.${tab}`)}
                                </AppText>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>
            <ReservationTabScene key={activeTab} type={activeTab} />
        </Screen>
    );
}
