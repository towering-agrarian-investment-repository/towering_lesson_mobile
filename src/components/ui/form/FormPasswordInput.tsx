import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Controller, FieldValues } from "react-hook-form";
import { useThemeColors } from "@/design-system/utils/theme";
import { Pressable, TextInput, View } from "react-native";
import { FormFieldShell } from "./FormFieldShell";
import { FormInputBaseProps } from "./types";

export function FormPasswordInput<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    placeholder,
    rules,
    editable = true,
}: FormInputBaseProps<TFieldValues>) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const colors = useThemeColors();

    return (
        <Controller
            control={control}
            name={name}
            rules={rules}
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
                <FormFieldShell
                    label={label}
                    errorMessage={fieldState.error?.message}
                >
                    <View
                        className={`mt-2 flex-row items-center border-b pb-3 pt-2 ${fieldState.error
                            ? "border-danger"
                            : "border-border"
                            }`}
                    >
                        <TextInput
                            value={typeof value === "string" ? value : value == null ? "" : String(value)}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            placeholder={placeholder}
                            placeholderTextColor={colors.mutedForeground}
                            autoCapitalize="none"
                            secureTextEntry={!isPasswordVisible}
                            editable={editable}
                            className="flex-1 px-0 text-base text-foreground"
                        />

                        <Pressable
                            onPress={() => {
                                setIsPasswordVisible((current) => !current);
                            }}
                            disabled={!editable}
                            className="ml-3"
                            hitSlop={8}
                        >
                            <Ionicons
                                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color={editable ? colors.mutedForeground : colors.border}
                            />
                        </Pressable>
                    </View>
                </FormFieldShell>
            )}
        />
    );
}
