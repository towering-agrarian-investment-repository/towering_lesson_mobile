import { AppText as Text } from "@/design-system";
import { ReactNode } from "react";
import { View } from "react-native";

export function FormFieldShell({
    label,
    errorMessage,
    children,
}: {
    label?: string;
    errorMessage?: string;
    children: ReactNode;
}) {
    return (
        <View>
            {label ? (
                <Text variant="label" className="text-foreground/75">{label}</Text>
            ) : null}

            {children}

            {errorMessage ? (
                <Text variant="meta" className="mt-1 text-danger">
                    {errorMessage}
                </Text>
            ) : null}
        </View>
    );
}
