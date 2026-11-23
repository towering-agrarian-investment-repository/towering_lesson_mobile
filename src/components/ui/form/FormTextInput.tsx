import { useTheme } from "@/design-system";
import { typography } from "@/design-system/utils/typography";
import { useController, type FieldValues } from "react-hook-form";
import { TextInput, View } from "react-native";
import { FormFieldShell } from "./FormFieldShell";
import { FormInputBaseProps, resolveTextContentType } from "./types";

export function FormTextInput<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    placeholder,
    rules,
    autoCapitalize = "sentences",
    autoComplete,
    textContentType,
    keyboardType = "default",
    returnKeyType,
    onSubmitEditing,
    multiline = false,
    numberOfLines,
    maxLength,
    editable = true,
    autoFocus,
}: FormInputBaseProps<TFieldValues>) {
    const { colors, resolvedScheme } = useTheme();
    const {
        field: { value: fieldValue, onChange, onBlur, ref: inputRef },
        fieldState,
    } = useController({ control, name, rules });
    const value = String(fieldValue ?? "");

    return (
        <FormFieldShell label={label} errorMessage={fieldState.error?.message}>
            <View
                className={
                    multiline
                        ? "min-h-32 overflow-hidden rounded-xl border bg-surface"
                        : "min-h-12 border-b"
                }
                style={{
                    borderColor: fieldState.error ? colors.danger : colors.border,
                }}
            >
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize={autoCapitalize}
                    autoComplete={autoComplete}
                    textContentType={resolveTextContentType(
                        autoComplete,
                        textContentType,
                    )}
                    keyboardAppearance={resolvedScheme}
                    keyboardType={keyboardType}
                    returnKeyType={returnKeyType}
                    onSubmitEditing={onSubmitEditing}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    maxLength={maxLength}
                    editable={editable}
                    autoFocus={autoFocus}
                    cursorColor={colors.primary}
                    selectionColor={colors.primary}
                    accessibilityLabel={label}
                    accessibilityState={{ disabled: !editable }}
                    textAlignVertical={multiline ? "top" : "center"}
                    style={{
                        minHeight: multiline ? 128 : 48,
                        paddingVertical: 12,
                        paddingHorizontal: multiline ? 12 : 6,
                        fontSize: typography.body.fontSize,
                        lineHeight: typography.body.lineHeight,
                        color: colors.foreground,
                    }}
                />
            </View>
        </FormFieldShell>
    );
}
