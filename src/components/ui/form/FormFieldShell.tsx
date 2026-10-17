import { NativeText } from "@/design-system/components/NativeText";
import { useTheme } from "@/design-system/utils/theme";
import { ReactNode } from "react";
import { View } from "react-native";

export function FormFieldShell({
    label,
    errorMessage,
    helperText,
    children,
}: {
    label?: string;
    errorMessage?: string;
    helperText?: string;
    children: ReactNode;
}) {
    const { colors: uiColors } = useTheme();
    return (
        <View>
            {label ? (
                <NativeText variant="label" textStyle={{ color: uiColors.foreground + "d9" }}>
                    {label}
                </NativeText>
            ) : null}

            {children}

            {errorMessage ? (
                <NativeText variant="meta" color="danger" style={{ marginTop: 4 }}>
                    {errorMessage}
                </NativeText>
            ) : helperText ? (
                    <NativeText variant="caption" color="mutedForeground">
                        {helperText}
                    </NativeText>
            ) : null}
        </View>
    );
}
