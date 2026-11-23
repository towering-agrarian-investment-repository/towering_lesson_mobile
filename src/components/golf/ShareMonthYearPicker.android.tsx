import { formatShareCardMonth } from "@/components/golf/monthly-share-card-layout";
import type { ShareMonthYearPickerProps } from "@/components/golf/ShareMonthYearPicker";
import { ActionButton, triggerSelectionHaptic } from "@/design-system";
import { NativeText } from "@/design-system/components/NativeText";
import { RNHostView } from "@expo/ui";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

const ROW_HEIGHT = 52;

function Wheel({ values, selected, onSelect }: {
    values: { value: number; label: string }[];
    selected: number;
    onSelect: (value: number) => void;
}) {
    const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
    const reducedMotion = useReducedMotion();
    const initialized = useRef(false);
    const selectedIndex = Math.max(0, values.findIndex(item => item.value === selected));
    const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.max(0, Math.min(values.length - 1, Math.round(event.nativeEvent.contentOffset.y / ROW_HEIGHT)));
        if (values[index].value !== selected) {
            triggerSelectionHaptic();
            onSelect(values[index].value);
        }
    };

    return (
        <View className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-surface" style={{ height: ROW_HEIGHT * 3 }}>
            <View pointerEvents="none" className="absolute inset-x-1 top-[52px] rounded-xl bg-primary/10"
                style={{ height: ROW_HEIGHT }} />
            <ScrollView ref={scrollRef} nestedScrollEnabled showsVerticalScrollIndicator={false}
                snapToInterval={ROW_HEIGHT} decelerationRate="fast" overScrollMode="never"
                onContentSizeChange={() => {
                    if (!initialized.current) {
                        scrollRef.current?.scrollTo({ y: selectedIndex * ROW_HEIGHT, animated: false });
                        initialized.current = true;
                    }
                }}
                onMomentumScrollEnd={settle} onScrollEndDrag={settle}
                contentContainerStyle={{ paddingVertical: ROW_HEIGHT }}>
                {values.map((item, index) => {
                    const active = item.value === selected;
                    return (
                        <Pressable key={item.value} accessibilityRole="button"
                            accessibilityLabel={item.label} accessibilityState={{ selected: active }}
                            className="items-center justify-center active:opacity-70" style={{ height: ROW_HEIGHT }}
                            onPress={() => {
                                triggerSelectionHaptic();
                                onSelect(item.value);
                                scrollRef.current?.scrollTo({ y: index * ROW_HEIGHT, animated: !reducedMotion });
                            }}>
                            <NativeText variant="label" wrap={false} color={active ? "foreground" : "mutedForeground"}
                                textStyle={{ fontWeight: active ? "700" : "500", fontSize: active ? 17 : 15 }}>
                                {item.label}
                            </NativeText>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

export function ShareMonthYearPicker({ year, month, yearOnly = false, years, onChange, onConfirm }: ShareMonthYearPickerProps) {
    const { t, i18n } = useTranslation();
    const monthFormatter = new Intl.DateTimeFormat(i18n.language, { month: "long", calendar: "gregory", timeZone: "UTC" });
    const months = Array.from({ length: 12 }, (_, value) => ({
        value, label: monthFormatter.format(new Date(Date.UTC(2024, value, 1))),
    }));
    const yearOptions = years.map(value => ({ value, label: String(value) }));

    return (
        <RNHostView matchContents={{ vertical: true }}>
            <View className="gap-5 pb-2">
                <View className="items-center gap-1">
                    <NativeText variant="h3" wrap={false}>
                        {yearOnly ? String(year) : formatShareCardMonth(year, month, i18n.language)}
                    </NativeText>
                </View>
                <View className="flex-row gap-3">
                    {!yearOnly && <Wheel values={months} selected={month} onSelect={value => onChange(year, value)} />}
                    <Wheel values={yearOptions} selected={year} onSelect={value => onChange(value, month)} />
                </View>
                <ActionButton
                    label={t("activity.ok")}
                    onPress={() => onConfirm(year, month)}
                />
            </View>
        </RNHostView>
    );
}
