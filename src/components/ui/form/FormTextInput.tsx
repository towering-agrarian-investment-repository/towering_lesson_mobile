import { typography } from "@/design-system/utils/typography";
import { useTheme } from "@/design-system";
import { Host, TextInput, useNativeState } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame, textFieldStyle } from "@expo/ui/swift-ui/modifiers";
import { useEffect } from "react";
import { View } from "react-native";
import { useController, type FieldValues } from "react-hook-form";
import { FormFieldShell } from "./FormFieldShell";
import { FormInputBaseProps } from "./types";

export function FormTextInput<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    placeholder,
    rules,
    autoCapitalize = "sentences",
    autoComplete,
    keyboardType = "default",
    multiline = false,
    numberOfLines,
    editable = true,
}: FormInputBaseProps<TFieldValues>) {
    const { colors, resolvedScheme, fontScale: uiFontScale } = useTheme();
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
                className={multiline ? "mt-3 min-h-32 overflow-hidden rounded-xl border bg-surface" : "mt-2 min-h-12 border-b"}
                style={{
                    borderColor: fieldState.error ? colors.danger : colors.border,
                }}
            >
                <Host
                    matchContents={{ vertical: true }}
                    ignoreSafeArea="all"
                    colorScheme={resolvedScheme}
                    seedColor={colors.primary}
                    accessibilityLabel={label}
                    accessibilityState={{ disabled: !editable }}
                    style={{ width: "100%" }}
                >
                    <TextInput
                        modifiers={
                            process.env.EXPO_OS === "ios"
                                ? [textFieldStyle("plain"), frame({ maxWidth: Infinity, minHeight: multiline ? 128 : 48, alignment: multiline ? "topLeading" : "leading" })]
                                : [
                                    fillMaxWidth(),
                                    defaultMinSize({ minHeight: multiline ? 128 : 48 }),
                                ]
                        }
                        value={nativeValue}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        ref={inputRef}
                        placeholder={placeholder}
                        placeholderTextColor={colors.mutedForeground}
                        autoCapitalize={autoCapitalize}
                        autoComplete={autoComplete}
                        keyboardType={keyboardType}
                        multiline={multiline}
                        numberOfLines={numberOfLines}
                        editable={editable}
                        cursorColor={colors.primary}
                        textStyle={{
                            fontSize: typography.body.fontSize * uiFontScale,
                            lineHeight: typography.body.lineHeight * uiFontScale,
                            color: colors.foreground,
                        }}
                        style={{ paddingVertical: 12, paddingHorizontal: multiline ? 8 : 6, backgroundColor: "transparent" }}
                    />
                </Host>
            </View>
        </FormFieldShell>
    );
}
