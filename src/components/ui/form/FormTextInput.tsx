import { Controller, FieldValues } from "react-hook-form";
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
                        autoCapitalize={autoCapitalize}
                        keyboardType={keyboardType}
                        multiline={multiline}
                        numberOfLines={numberOfLines}
                        editable={editable}
                        textAlignVertical={multiline ? "top" : "center"}
                        className={`mt-2 border-b px-0 pb-3 pt-2 ${fieldState.error
                            ? "border-red-500"
                            : "border-gray-400"
                            }`}
                    />
                </FormFieldShell>
            )}
        />
    );
}
