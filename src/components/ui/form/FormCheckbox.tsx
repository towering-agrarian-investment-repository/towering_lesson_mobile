import { Controller, FieldValues } from "react-hook-form";
import { Switch, Text, View } from "react-native";
import { FormFieldShell } from "./FormFieldShell";
import { FormInputBaseProps } from "./types";

type FormCheckboxProps<TFieldValues extends FieldValues> = Omit<
    FormInputBaseProps<TFieldValues>,
    "placeholder" | "autoCapitalize" | "keyboardType" | "multiline" | "numberOfLines"
> & {
    description?: string;
};

export function FormCheckbox<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    rules,
    editable = true,
    description,
}: FormCheckboxProps<TFieldValues>) {
    return (
        <Controller
            control={control}
            name={name}
            rules={rules}
            render={({ field: { value, onChange }, fieldState }) => {
                const checked = Boolean(value);

                return (
                    <FormFieldShell
                        label={undefined}
                        errorMessage={fieldState.error?.message}
                    >
                        <View
                            className={`mt-2 flex-row items-center gap-3 py-1 ${!editable ? "opacity-60" : ""
                                }`}
                        >
                            <View className="flex-1">
                                <Text className="font-medium text-gray-900">
                                    {label}
                                </Text>

                                {description ? (
                                    <Text className="mt-1 text-sm leading-5 text-gray-500">
                                        {description}
                                    </Text>
                                ) : null}
                            </View>

                            <Switch
                                value={checked}
                                onValueChange={(nextValue) => {
                                    if (!editable) {
                                        return;
                                    }

                                    onChange(nextValue);
                                }}
                                disabled={!editable}
                                trackColor={{
                                    false: "#d1d5db",
                                    true: "#86efac",
                                }}
                                thumbColor={checked ? "#16a34a" : "#f9fafb"}
                                ios_backgroundColor="#d1d5db"
                            />
                        </View>
                    </FormFieldShell>
                );
            }}
        />
    );
}
