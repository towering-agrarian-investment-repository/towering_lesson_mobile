import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Controller, FieldValues } from "react-hook-form";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
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
                                    fieldState.error ? "border-red-500" : "border-gray-400"
                                } ${editable ? "" : "opacity-60"}`}
                                accessibilityRole="button"
                                accessibilityLabel={label ?? "Select an option"}
                            >
                                <Text
                                    className={`flex-1 text-base ${
                                        selectedValue ? "text-gray-950" : "text-gray-400"
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
                                            color="#6b7280"
                                        />
                                    </Pressable>
                                ) : null}

                                <MaterialIcons
                                    name="keyboard-arrow-down"
                                    size={20}
                                    color="#6b7280"
                                />
                            </Pressable>

                            <Modal
                                visible={isOpen}
                                transparent
                                animationType="fade"
                                onRequestClose={() => setIsOpen(false)}
                            >
                                <Pressable
                                    className="flex-1 justify-end bg-black/35"
                                    onPress={() => setIsOpen(false)}
                                >
                                    <Pressable
                                        className="rounded-t-3xl bg-white px-6 pb-8 pt-5"
                                        onPress={() => undefined}
                                    >
                                        <View className="mb-4 flex-row items-center justify-between">
                                            <Text className="text-lg font-semibold text-gray-950">
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
                                                    color="#111827"
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
                                                className={`mb-2 rounded-2xl border px-4 py-4 ${
                                                    !selectedValue
                                                        ? "border-green-500 bg-green-50"
                                                        : "border-gray-200 bg-white"
                                                }`}
                                            >
                                                <Text
                                                    className={`text-base ${
                                                        !selectedValue
                                                            ? "font-semibold text-green-700"
                                                            : "text-gray-700"
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
                                                        className={`mb-2 flex-row items-center rounded-2xl border px-4 py-4 ${
                                                            isSelected
                                                                ? "border-green-500 bg-green-50"
                                                                : "border-gray-200 bg-white"
                                                        }`}
                                                    >
                                                        <Text
                                                            className={`flex-1 text-base ${
                                                                isSelected
                                                                    ? "font-semibold text-green-700"
                                                                    : "text-gray-900"
                                                            }`}
                                                        >
                                                            {option.label}
                                                        </Text>

                                                        {isSelected ? (
                                                            <MaterialIcons
                                                                name="check"
                                                                size={18}
                                                                color="#15803d"
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
