import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Controller, FieldValues } from "react-hook-form";
import { AppText as Text, useThemeColors } from "@/design-system";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { FormFieldShell } from "./FormFieldShell";
import { FormInputBaseProps } from "./types";

type SelectOption<TValue extends string> = {
    label: string;
    value: TValue;
};

type FormSelectProps<
    TFieldValues extends FieldValues,
    TValue extends string,
> = Omit<FormInputBaseProps<TFieldValues>, "placeholder" | "keyboardType" | "multiline" | "numberOfLines"> & {
    options: SelectOption<TValue>[];
    clearLabel?: string;
    emptyValue?: TValue | "";
};

export function FormSelect<
    TFieldValues extends FieldValues,
    TValue extends string,
>({
    control,
    name,
    label,
    rules,
    options,
    clearLabel = "Clear selection",
    emptyValue = "",
    editable = true,
}: FormSelectProps<TFieldValues, TValue>) {
    const [isOpen, setIsOpen] = useState(false);
    const colors = useThemeColors();

    return (
        <Controller
            control={control}
            name={name}
            rules={rules}
            render={({ field: { value, onChange }, fieldState }) => {
                const selectedValue =
                    typeof value === "string" && value.length > 0 ? value : null;
                const selectedLabel =
                    options.find((option) => option.value === selectedValue)?.label ??
                    "Select an option";

                return (
                    <FormFieldShell
                        label={label}
                        errorMessage={fieldState.error?.message}
                    >
                        <View className="mt-2">
                            <Pressable
                                onPress={() => editable && setIsOpen(true)}
                                disabled={!editable}
                                className={`flex-row items-center border-b px-0 pb-3 pt-2 ${
                                    fieldState.error ? "border-danger" : "border-border"
                                } ${editable ? "" : "opacity-60"}`}
                                accessibilityRole="button"
                                accessibilityLabel={label ?? "Select an option"}
                            >
                                <Text
                                    className={`flex-1 text-base ${
                                        selectedValue ? "text-foreground" : "text-muted-foreground"
                                    }`}
                                >
                                    {selectedLabel}
                                </Text>

                                {selectedValue ? (
                                    <Pressable
                                        onPress={() => editable && onChange(emptyValue)}
                                        disabled={!editable}
                                        className="mr-2 rounded-full p-1"
                                        accessibilityRole="button"
                                        accessibilityLabel={clearLabel}
                                        hitSlop={8}
                                    >
                                        <MaterialIcons
                                            name="cancel"
                                            size={18}
                                            color={colors.mutedForeground}
                                        />
                                    </Pressable>
                                ) : null}

                                <MaterialIcons
                                    name="keyboard-arrow-down"
                                    size={20}
                                    color={colors.mutedForeground}
                                />
                            </Pressable>

                            <Modal
                                visible={isOpen}
                                transparent
                                animationType="fade"
                                onRequestClose={() => setIsOpen(false)}
                            >
                                <Pressable
                                    className="flex-1 justify-end bg-foreground/35"
                                    onPress={() => setIsOpen(false)}
                                >
                                    <Pressable
                                        className="rounded-t-xl bg-card px-6 pb-8 pt-5"
                                        onPress={() => undefined}
                                    >
                                        <View className="mb-4 flex-row items-center justify-between">
                                            <Text className="text-lg font-semibold text-foreground">
                                                {label ?? "Select an option"}
                                            </Text>

                                            <Pressable
                                                onPress={() => setIsOpen(false)}
                                                className="rounded-full p-1"
                                                accessibilityRole="button"
                                                accessibilityLabel="Close options"
                                            >
                                                <MaterialIcons
                                                    name="close"
                                                    size={22}
                                                    color={colors.foreground}
                                                />
                                            </Pressable>
                                        </View>

                                        <ScrollView
                                            showsVerticalScrollIndicator={false}
                                            contentContainerStyle={{ paddingBottom: 8 }}
                                        >
                                            <Pressable
                                                onPress={() => {
                                                    onChange(emptyValue);
                                                    setIsOpen(false);
                                                }}
                                                className={`mb-3 rounded-xl border px-5 py-4 ${
                                                    !selectedValue
                                                        ? "border-success bg-success/10"
                                                        : "border-border bg-card"
                                                }`}
                                            >
                                                <Text
                                                    className={`text-base ${
                                                        !selectedValue
                                                            ? "font-semibold text-success"
                                                            : "text-foreground"
                                                    }`}
                                                >
                                                    Select an option
                                                </Text>
                                            </Pressable>

                                            {options.map((option) => {
                                                const isSelected =
                                                    option.value === selectedValue;

                                                return (
                                                    <Pressable
                                                        key={option.value}
                                                        onPress={() => {
                                                            onChange(option.value);
                                                            setIsOpen(false);
                                                        }}
                                                        className={`mb-3 flex-row items-center rounded-xl border px-5 py-4 ${
                                                            isSelected
                                                                ? "border-success bg-success/10"
                                                                : "border-border bg-card"
                                                        }`}
                                                    >
                                                        <Text
                                                            className={`flex-1 text-base ${
                                                                isSelected
                                                                    ? "font-semibold text-success"
                                                                    : "text-foreground"
                                                            }`}
                                                        >
                                                            {option.label}
                                                        </Text>

                                                        {isSelected ? (
                                                            <MaterialIcons
                                                                name="check"
                                                                size={18}
                                                                color={colors.success}
                                                            />
                                                        ) : null}
                                                    </Pressable>
                                                );
                                            })}
                                        </ScrollView>
                                    </Pressable>
                                </Pressable>
                            </Modal>
                        </View>
                    </FormFieldShell>
                );
            }}
        />
    );
}
