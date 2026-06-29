import { AppText as Text } from "@/design-system";
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
    return (
        <View>
            {label ? (
                <Text variant="label" className="text-foreground/85">{label}</Text>
            ) : null}

            {children}

            {errorMessage ? (
                <Text variant="meta" className="mt-1 text-danger">
                    {errorMessage}
                </Text>
            ) : helperText ? (
                <Text variant="caption" className="text-muted-foreground">
                    {helperText}
                </Text>
            ) : null}
        </View>
    );
}
