import { AnimatedPressable, useTheme } from "@/design-system";
import { typography } from "@/design-system/utils/typography";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useController, type FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";
import { FormFieldShell } from "./FormFieldShell";
import { FormInputBaseProps, resolveTextContentType } from "./types";

export function FormPasswordInput<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    placeholder,
    rules,
    autoComplete = "password",
    textContentType,
    returnKeyType,
    onSubmitEditing,
    maxLength,
    editable = true,
    autoFocus,
}: Omit<
    FormInputBaseProps<TFieldValues>,
    "autoCapitalize" | "keyboardType" | "multiline" | "numberOfLines"
>) {
    const { colors, resolvedScheme } = useTheme();
    const { t } = useTranslation();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const {
        field: { value: fieldValue, onChange, onBlur, ref: inputRef },
        fieldState,
    } = useController({ control, name, rules });
    const value = String(fieldValue ?? "");

    return (
        <FormFieldShell label={label} errorMessage={fieldState.error?.message}>
            <View
                className="min-h-12 flex-row items-center border-b"
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
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete={autoComplete}
                    textContentType={resolveTextContentType(
                        autoComplete,
                        textContentType,
                    )}
                    keyboardAppearance={resolvedScheme}
                    returnKeyType={returnKeyType}
                    onSubmitEditing={onSubmitEditing}
                    maxLength={maxLength}
                    editable={editable}
                    autoFocus={autoFocus}
                    secureTextEntry={!isPasswordVisible}
                    cursorColor={colors.primary}
                    selectionColor={colors.primary}
                    accessibilityLabel={label}
                    accessibilityState={{ disabled: !editable }}
                    style={{
                        flex: 1,
                        minHeight: 48,
                        paddingVertical: 12,
                        paddingHorizontal: 6,
                        fontSize: typography.body.fontSize,
                        lineHeight: typography.body.lineHeight,
                        color: colors.foreground,
                    }}
                />

                <AnimatedPressable
                    accessibilityRole="button"
                    accessibilityLabel={
                        isPasswordVisible
                            ? t("common.hidePassword")
                            : t("common.showPassword")
                    }
                    accessibilityState={{ disabled: !editable }}
                    haptic="selection"
                    onPress={() => {
                        setIsPasswordVisible((current) => !current);
                    }}
                    disabled={!editable}
                    className="h-12 w-12 items-center justify-center"
                    hitSlop={8}
                >
                    <Ionicons
                        name={
                            isPasswordVisible
                                ? "eye-off-outline"
                                : "eye-outline"
                        }
                        size={20}
                        color={
                            editable ? colors.mutedForeground : colors.border
                        }
                    />
                </AnimatedPressable>
            </View>
        </FormFieldShell>
    );
}
