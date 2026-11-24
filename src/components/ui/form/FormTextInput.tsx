import { useTheme } from "@/design-system";
import { typography } from "@/design-system/utils/typography";
import { useState, type ComponentType } from "react";
import { useController, type FieldValues } from "react-hook-form";
import { TextInput, View } from "react-native";
import { FormFieldShell } from "./FormFieldShell";
import { FormInputBaseProps, resolveTextContentType } from "./types";

export function FormTextInput<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    labelComponent: Label,
    placeholder,
    helperText,
    rules,
    autoCapitalize = "sentences",
    autoComplete,
    textContentType,
    keyboardType = "default",
    returnKeyType,
    onSubmitEditing,
    multiline = false,
    numberOfLines,
    multilineMinHeight = 128,
    showCharacterCount = false,
    maxLength,
    editable = true,
    autoFocus,
}: FormInputBaseProps<TFieldValues> & {
    labelComponent?: ComponentType<{ children: string }>;
}) {
    const { colors, resolvedScheme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const {
        field: { value: fieldValue, onChange, onBlur, ref: inputRef },
        fieldState,
    } = useController({ control, name, rules });
    const value = String(fieldValue ?? "");

    return (
        <FormFieldShell
            label={Label ? <Label>{label}</Label> : label}
            errorMessage={fieldState.error?.message}
            helperText={
                helperText ?? (showCharacterCount && maxLength != null ? `${value.length}/${maxLength}` : undefined)
            }
        >
            <View
                className={
                    multiline ? "mt-3 min-h-32 overflow-hidden rounded-xl border bg-surface" : "mt-2 min-h-12 border-b"
                }
                style={{
                    borderColor: fieldState.error ? colors.danger : isFocused ? colors.primary : colors.border,
                }}
            >
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        setIsFocused(false);
                        onBlur();
                    }}
                    placeholder={placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize={autoCapitalize}
                    autoComplete={autoComplete}
                    textContentType={resolveTextContentType(autoComplete, textContentType)}
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
                    clearButtonMode="while-editing"
                    accessibilityLabel={label}
                    accessibilityState={{ disabled: !editable }}
                    textAlignVertical={multiline ? "top" : "center"}
                    style={{
                        minHeight: multiline ? multilineMinHeight : 48,
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
