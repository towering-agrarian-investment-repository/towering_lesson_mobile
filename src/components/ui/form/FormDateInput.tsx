import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Controller, FieldValues } from "react-hook-form";
import { AppText as Text, useThemeColors } from "@/design-system";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { FormFieldShell } from "./FormFieldShell";
import { FormInputBaseProps } from "./types";

type FormDateInputProps<TFieldValues extends FieldValues> = Omit<
    FormInputBaseProps<TFieldValues>,
    "keyboardType" | "multiline" | "numberOfLines"
> & {
    clearLabel?: string;
    minimumDate?: Date;
    maximumDate?: Date;
};

function parseDateOnly(value?: string | null) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date();
    }

    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatDateOnly(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string | null | undefined, locale: string) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return "";
    }

    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(parseDateOnly(value));
}

export function FormDateInput<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    placeholder,
    rules,
    editable = true,
    clearLabel,
    minimumDate,
    maximumDate,
}: FormDateInputProps<TFieldValues>) {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const colors = useThemeColors();
    const isIOS = process.env.EXPO_OS === "ios";
    const isAndroid = process.env.EXPO_OS === "android";
    const resolvedPlaceholder = placeholder ?? t("common.selectDate");
    const resolvedClearLabel = clearLabel ?? t("common.clearDate");

    return (
        <Controller
            control={control}
            name={name}
            rules={rules}
            render={({ field: { value, onChange }, fieldState }) => {
                const currentValue =
                    typeof value === "string" ? value : value == null ? "" : String(value);
                const pickerValue = parseDateOnly(currentValue);
                const displayValue = formatDisplayDate(currentValue, i18n.resolvedLanguage || i18n.language || "en");

                return (
                    <FormFieldShell
                        label={label}
                        errorMessage={fieldState.error?.message}
                    >
                        <View className="mt-2 gap-3">
                            <Pressable
                                onPress={() => {
                                    if (!editable) {
                                        return;
                                    }

                                    setIsOpen(true);
                                }}
                                disabled={!editable}
                                className={`flex-row items-center rounded-xl border px-5 py-4 ${fieldState.error
                                    ? "border-danger"
                                    : "border-border"
                                    } ${!editable ? "opacity-60" : "bg-card"}`}
                            >
                                <Text
                                    className={`flex-1 text-base ${displayValue ? "text-foreground" : "text-muted-foreground"
                                        }`}
                                >
                                    {displayValue || resolvedPlaceholder}
                                </Text>

                                {currentValue ? (
                                    <Pressable
                                        onPress={(event) => {
                                            event.stopPropagation();
                                            if (editable) {
                                                onChange("");
                                            }
                                        }}
                                        disabled={!editable}
                                        className="ml-3 rounded-full p-1 active:bg-muted"
                                        accessibilityRole="button"
                                        accessibilityLabel={resolvedClearLabel}
                                    >
                                        <MaterialIcons
                                            name="cancel"
                                            size={18}
                                            color={colors.mutedForeground}
                                        />
                                    </Pressable>
                                ) : null}
                            </Pressable>

                            {isOpen ? (
                                <DateTimePicker
                                    value={pickerValue}
                                    mode="date"
                                    display={isIOS ? "inline" : "default"}
                                    minimumDate={minimumDate}
                                    maximumDate={maximumDate}
                                    onChange={(event, nextDate) => {
                                        if (event.type === "dismissed" || !nextDate) {
                                            if (isAndroid) {
                                                setIsOpen(false);
                                            }

                                            return;
                                        }

                                        onChange(formatDateOnly(nextDate));

                                        if (isAndroid) {
                                            setIsOpen(false);
                                        }
                                    }}
                                />
                            ) : null}
                        </View>
                    </FormFieldShell>
                );
            }}
        />
    );
}
