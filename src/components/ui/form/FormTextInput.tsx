import { Controller, FieldValues } from "react-hook-form";
import { useThemeColors } from "@/design-system";
import { TextInput } from "react-native";
import { FormFieldShell } from "./FormFieldShell";
import { FormInputBaseProps } from "./types";

export function FormTextInput<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    placeholder,
    rules,
    autoCapitalize = "sentences",
    keyboardType = "default",
    multiline = false,
    numberOfLines,
    editable = true,
}: FormInputBaseProps<TFieldValues>) {
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
                    <TextInput
                        value={typeof value === "string" ? value : value == null ? "" : String(value)}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        placeholderTextColor={colors.mutedForeground}
                        autoCapitalize={autoCapitalize}
                        keyboardType={keyboardType}
                        multiline={multiline}
                        numberOfLines={numberOfLines}
                        editable={editable}
                        accessibilityLabel={label}
                        accessibilityState={{ disabled: !editable }}
                        textAlignVertical={multiline ? "top" : "center"}
                        className="mt-2 border-b pl-1.5 pr-0 pb-3 pt-2 text-base text-foreground"
                        style={{
                            borderBottomColor: fieldState.error
                                ? colors.danger
                                : colors.border,
                            borderBottomWidth: 1,
                        }}
                    />
                </FormFieldShell>
            )}
        />
    );
}
