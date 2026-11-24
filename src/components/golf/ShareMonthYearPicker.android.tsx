import { formatShareCardMonth } from "@/components/golf/monthly-share-card-layout";
import type { ShareMonthYearPickerProps } from "@/components/golf/ShareMonthYearPicker";
import { ActionButton, triggerSelectionHaptic } from "@/design-system";
import { useThemeColors } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { RNHostView } from "@expo/ui";
import { Column, FilterChip, Row, Text } from "@expo/ui/jetpack-compose";
import {
    clip,
    defaultMinSize,
    fillMaxWidth,
    horizontalScroll,
    Shapes,
    verticalScroll,
    weight,
} from "@expo/ui/jetpack-compose/modifiers";
import { useTranslation } from "react-i18next";

const MONTH_ROWS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [9, 10, 11],
] as const;
const CHIP_TOUCH_TARGET = defaultMinSize({ minWidth: 48, minHeight: 48 });
const YEAR_CHIP_MODIFIERS = [CHIP_TOUCH_TARGET];
const MONTH_CHIP_MODIFIERS = [weight(1), CHIP_TOUCH_TARGET];
const SELECTED_YEAR_CHIP_MODIFIERS = [...YEAR_CHIP_MODIFIERS, clip(Shapes.Circle)];
const SELECTED_MONTH_CHIP_MODIFIERS = [...MONTH_CHIP_MODIFIERS, clip(Shapes.Circle)];

export function ShareMonthYearPicker({
    year,
    month,
    yearOnly = false,
    years,
    onChange,
    onConfirm,
}: ShareMonthYearPickerProps) {
    const { t, i18n } = useTranslation();
    const colors = useThemeColors();
    const monthFormatter = new Intl.DateTimeFormat(i18n.language, {
        month: "short",
        calendar: "gregory",
        timeZone: "UTC",
    });
    const chipColors = {
        containerColor: colors.surface,
        labelColor: colors.foreground,
        selectedContainerColor: colors.primary,
        selectedLabelColor: colors.primaryForeground,
    };

    const select = (nextYear: number, nextMonth: number) => {
        if (nextYear === year && nextMonth === month) return;
        triggerSelectionHaptic();
        onChange(nextYear, nextMonth);
    };

    return (
        <Column modifiers={[fillMaxWidth(), verticalScroll()]} verticalArrangement={{ spacedBy: 12 }}>
            <Text
                modifiers={[fillMaxWidth()]}
                color={colors.foreground}
                style={{ ...typography.h3, textAlign: "center" }}
            >
                {yearOnly ? String(year) : formatShareCardMonth(year, month, i18n.language)}
            </Text>
            <Row modifiers={[fillMaxWidth(), horizontalScroll()]} horizontalArrangement={{ spacedBy: 8 }}>
                {years.map((value) => (
                    <FilterChip
                        key={value}
                        selected={value === year}
                        colors={chipColors}
                        modifiers={value === year ? SELECTED_YEAR_CHIP_MODIFIERS : YEAR_CHIP_MODIFIERS}
                        onClick={() => select(value, month)}
                    >
                        <FilterChip.Label>
                            <Text>{String(value)}</Text>
                        </FilterChip.Label>
                    </FilterChip>
                ))}
            </Row>
            {yearOnly ? null : (
                <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[fillMaxWidth()]}>
                    {MONTH_ROWS.map((row) => (
                        <Row key={row[0]} modifiers={[fillMaxWidth()]} horizontalArrangement={{ spacedBy: 8 }}>
                            {row.map((value) => (
                                <FilterChip
                                    key={value}
                                    selected={value === month}
                                    colors={chipColors}
                                    modifiers={value === month ? SELECTED_MONTH_CHIP_MODIFIERS : MONTH_CHIP_MODIFIERS}
                                    onClick={() => select(year, value)}
                                >
                                    <FilterChip.Label>
                                        <Text modifiers={[fillMaxWidth()]} style={{ textAlign: "center" }}>
                                            {monthFormatter.format(new Date(Date.UTC(year, value, 1)))}
                                        </Text>
                                    </FilterChip.Label>
                                </FilterChip>
                            ))}
                        </Row>
                    ))}
                </Column>
            )}
            <RNHostView matchContents={{ vertical: true }} modifiers={[fillMaxWidth()]}>
                <ActionButton label={t("activity.ok")} onPress={() => onConfirm(year, month)} />
            </RNHostView>
        </Column>
    );
}
