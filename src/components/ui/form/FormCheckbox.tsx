import { Controller, FieldValues } from "react-hook-form";
import { AppText as Text } from "@/design-system";
import { useThemeColors } from "@/design-system/utils/theme";
import { Switch, View } from "react-native";
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
    const colors = useThemeColors();

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
                                <Text className="font-medium text-foreground">
                                    {label}
                                </Text>

                                {description ? (
                                    <Text className="mt-1 text-sm leading-5 text-muted-foreground">
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
                                    false: colors.border,
                                    true: `${colors.success}66`,
                                }}
                                thumbColor={checked ? colors.success : colors.card}
                                ios_backgroundColor={colors.border}
                            />
                        </View>
                    </FormFieldShell>
                );
            }}
        />
    );
}
