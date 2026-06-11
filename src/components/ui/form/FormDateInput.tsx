import { MaterialIcons } from "@expo/vector-icons";
import ExpoDateTimePicker from "@expo/ui/community/datetime-picker";
import { useState } from "react";
import { Controller, FieldValues } from "react-hook-form";
import { AppText as Text, useThemeColors } from "@/design-system";
import { Platform, Pressable, View } from "react-native";
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

function formatDisplayDate(value?: string | null) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return "";
    }

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(parseDateOnly(value));
}

export function FormDateInput<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    placeholder = "Select a date",
    rules,
    editable = true,
    clearLabel = "Clear date",
    minimumDate,
    maximumDate,
}: FormDateInputProps<TFieldValues>) {
    const [isOpen, setIsOpen] = useState(false);
    const colors = useThemeColors();

    return (
        <Controller
            control={control}
            name={name}
            rules={rules}
            render={({ field: { value, onChange }, fieldState }) => {
                const currentValue =
                    typeof value === "string" ? value : value == null ? "" : String(value);
                const pickerValue = parseDateOnly(currentValue);
                const displayValue = formatDisplayDate(currentValue);

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
                                    {displayValue || placeholder}
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
                                        accessibilityLabel={clearLabel}
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
                                <ExpoDateTimePicker
                                    value={pickerValue}
                                    mode="date"
                                    display={Platform.OS === "ios" ? "inline" : "default"}
                                    presentation={Platform.OS === "android" ? "dialog" : undefined}
                                    minimumDate={minimumDate}
                                    maximumDate={maximumDate}
                                    onValueChange={(_event, nextDate) => {
                                        onChange(formatDateOnly(nextDate));

                                        if (Platform.OS === "android") {
                                            setIsOpen(false);
                                        }
                                    }}
                                    onDismiss={() => {
                                        setIsOpen(false);
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
