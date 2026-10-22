import { formatShareCardMonth } from "@/components/golf/monthly-share-card-layout";
import { useTheme } from "@/design-system/utils/theme";
import { getNativeButtonStyle, getNativeButtonTextStyle } from "@/design-system/utils/native-button-styles";
import { Button, Column, Picker, Text } from "@expo/ui";
import { defaultMinSize, fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export type ShareMonthYearPickerProps = {
    year: number;
    month: number;
    years: number[];
    onChange: (year: number, month: number) => void;
    onConfirm: (year: number, month: number) => void;
};

export function ShareMonthYearPicker({ year, month, years, onChange, onConfirm }: ShareMonthYearPickerProps) {
    const { colors, fontScale } = useTheme();
    const { t, i18n } = useTranslation();
    const monthFormatter = useMemo(
        () => new Intl.DateTimeFormat(i18n.language, { month: "short", calendar: "gregory", timeZone: "UTC" }),
        [i18n.language],
    );
    const isIOS = process.env.EXPO_OS === "ios";

    return (
        <Column spacing={16}>
            <Text>{formatShareCardMonth(year, month, i18n.language)}</Text>
            <Picker selectedValue={year} onValueChange={value => onChange(value, month)}>
                {years.map(value => <Picker.Item key={value} label={String(value)} value={value} />)}
            </Picker>
            <Picker selectedValue={month} onValueChange={value => onChange(year, value)}>
                {Array.from({ length: 12 }, (_, value) => (
                    <Picker.Item key={value} label={monthFormatter.format(new Date(Date.UTC(2024, value, 1)))} value={value} />
                ))}
            </Picker>
            <Button
                variant="text"
                onPress={() => onConfirm(year, month)}
                style={getNativeButtonStyle(colors, "filled")}
                modifiers={isIOS ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })]}
            >
                <Text
                    textStyle={getNativeButtonTextStyle(colors, "filled", fontScale)}
                    modifiers={isIOS ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth()]}
                >
                    {t("activity.ok")}
                </Text>
            </Button>
        </Column>
    );
}