import { ReactNode } from "react";
import { Text, View } from "react-native";

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
                <Text className="text-gray-600">{label}</Text>
            ) : null}

            {children}

            {errorMessage ? (
                <Text className="mt-1 text-sm text-red-500">
                    {errorMessage}
                </Text>
            ) : null}
        </View>
    );
}
