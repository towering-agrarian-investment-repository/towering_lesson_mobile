import {
    RESERVATION_TAB_LABELS,
    RESERVATION_TABS,
    ReservationTabScene,
} from "@/components/golf/reservation/ReservationTabScene";
import { AppText, Screen } from "@/design-system";
import { cn } from "@/design-system";
import { MemberReservationType } from "@/service/reservation.service";
import { useState } from "react";
import { Pressable, ScrollView } from "react-native";

export default function ReservationScreen() {
    const [activeTab, setActiveTab] = useState<MemberReservationType>(
        RESERVATION_TABS[0],
    );

    return (
        <Screen
            scroll={false}
            horizontalPadding={false}
            contentClassName="px-6"
        >
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0 }}
                contentContainerStyle={{
                    gap: 12,
                    paddingBottom: 8,
                }}
            >
                {RESERVATION_TABS.map((tab) => {
                    const isActive = tab === activeTab;

                    return (
                        <Pressable
                            key={tab}
                            accessibilityRole="button"
                            accessibilityLabel={`Show ${RESERVATION_TAB_LABELS[tab]} reservations`}
                            accessibilityState={{ selected: isActive }}
                            className={cn(
                                "h-9 items-center justify-center rounded-full border px-4 active:opacity-80",
                                isActive
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-card",
                            )}
                            onPress={() => {
                                if (!isActive) {
                                    setActiveTab(tab);
                                }
                            }}
                        >
                            <AppText
                                className={cn(
                                    "text-sm font-medium",
                                    isActive ? "text-primary" : "text-foreground",
                                )}
                            >
                                {RESERVATION_TAB_LABELS[tab]}
                            </AppText>
                        </Pressable>
                    );
                })}
            </ScrollView>
            <ReservationTabScene key={activeTab} type={activeTab} />
        </Screen>
    );
}
