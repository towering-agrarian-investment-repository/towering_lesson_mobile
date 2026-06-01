import type { ReactNode } from "react";
import { Text, View } from "react-native";

export type ReservationPolicy = {
    title: string;
    description: string;
};

export function ReservationDetailField({
    label,
    value,
    description,
    leftElement,
}: {
    label: string;
    value: string;
    description?: string;
    leftElement?: ReactNode;
}) {
    return (
        <View>
            <ReservationFieldLabel>{label}</ReservationFieldLabel>

            <View className="mt-2 flex-row items-center gap-3">
                {leftElement ? leftElement : null}

                <View className="flex-1">
                    <ReservationFieldValue>{value}</ReservationFieldValue>

                    {description ? (
                        <Text className="mt-2 text-base leading-7 text-gray-500">
                            {description}
                        </Text>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

export function ReservationPoliciesSection({
    title = "Policies",
    policies,
}: {
    title?: string;
    policies: readonly ReservationPolicy[];
}) {
    return (
        <View>
            <Text className="text-base font-bold leading-4 text-gray-950">
                {title}
            </Text>

            <View className="mt-4 gap-4">
                {policies.map((policy) => (
                    <View key={policy.title}>
                        <Text className="text-base leading-4 text-gray-950">
                            - {policy.title}
                        </Text>

                        <Text className="mt-2 text-base leading-7 text-gray-950">
                            {policy.description}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

export function ReservationFieldLabel({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <Text className="text-lg font-bold leading-4 text-gray-950">
            {children}
        </Text>
    );
}

export function ReservationFieldValue({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <Text className="text-xl font-semibold leading-7 text-gray-950">
            {children}
        </Text>
    );
}
