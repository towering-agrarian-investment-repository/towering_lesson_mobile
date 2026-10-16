import { typography } from "@/design-system/utils/typography";
import { useTheme } from "@/design-system";
import { Host, TextInput, useNativeState } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame, textFieldStyle } from "@expo/ui/swift-ui/modifiers";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useController, type FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { FormFieldShell } from "./FormFieldShell";
import { FormInputBaseProps } from "./types";

export function FormPasswordInput<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    placeholder,
    rules,
    autoComplete,
    editable = true,
}: FormInputBaseProps<TFieldValues>) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const { colors, resolvedScheme, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const {
        field: { value: fieldValue, onChange, onBlur, ref: inputRef },
        fieldState,
    } = useController({ control, name, rules });
    const value = String(fieldValue ?? "");
    const nativeValue = useNativeState(value);

    useEffect(() => {
        if (nativeValue.get() !== value) nativeValue.set(value);
    }, [nativeValue, value]);

    return (
        <FormFieldShell label={label} errorMessage={fieldState.error?.message}>
            <View
                className="mt-2 min-h-12 flex-row items-center border-b"
                style={{
                    borderBottomColor: fieldState.error
                        ? colors.danger
                        : colors.border,
                    borderBottomWidth: 1,
                }}
            >
                <Host
                    matchContents={{ vertical: true }}
                    ignoreSafeArea="all"
                    colorScheme={resolvedScheme}
                    seedColor={colors.primary}
                    style={{ flex: 1, minWidth: 0 }}
                    accessibilityLabel={label}
                    accessibilityState={{ disabled: !editable }}
                >
                    <TextInput
                        modifiers={
                            process.env.EXPO_OS === "ios"
                                ? [textFieldStyle("plain"), frame({ maxWidth: Infinity, minHeight: 48 })]
                                : [
                                    fillMaxWidth(),
                                    defaultMinSize({ minHeight: 48 }),
                                ]
                        }
                        value={nativeValue}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        ref={inputRef}
                        placeholder={placeholder}
                        placeholderTextColor={colors.mutedForeground}
                        autoCapitalize="none"
                        autoComplete={autoComplete}
                        secureTextEntry={!isPasswordVisible}
                        editable={editable}
                        cursorColor={colors.primary}
                        textStyle={{
                            fontSize: typography.body.fontSize * uiFontScale,
                            lineHeight: typography.body.lineHeight * uiFontScale,
                            color: colors.foreground,
                        }}
                        style={{ paddingVertical: 12, paddingHorizontal: 6, backgroundColor: "transparent" }}
                    />
                </Host>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                        isPasswordVisible
                            ? t("common.hidePassword")
                            : t("common.showPassword")
                    }
                    accessibilityState={{ disabled: !editable }}
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
                </Pressable>
            </View>
        </FormFieldShell>
    );
}
