import type { ComponentProps, ReactNode } from "react";
import { AppText } from "@/design-system";
import { cn } from "@/design-system";
import { View } from "react-native";

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
        <View className="flex-col gap-2">
            <ReservationFieldLabel>{label}</ReservationFieldLabel>

            <View className="flex-row items-center gap-3">
                {leftElement ? leftElement : null}

                <View className="flex-1 flex-col gap-2">
                    <ReservationFieldValue>{value}</ReservationFieldValue>

                    {description ? (
                        <AppText variant="subtext" className="text-foreground/75">
                            {description}
                        </AppText>
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
        <View className="flex-col gap-4">
            <AppText variant="value" className="text-foreground">
                {title}
            </AppText>

            <View className="gap-4">
                {policies.map((policy) => (
                    <View key={policy.title} className="flex-col gap-2">
                        <AppText variant="body" className="text-foreground">
                            - {policy.title}
                        </AppText>

                        <AppText variant="subtext" className="text-foreground/80">
                            {policy.description}
                        </AppText>
                    </View>
                ))}
            </View>
        </View>
    );
}

export function ReservationFieldLabel({
    children,
    className,
    ...props
}: {
    children: ReactNode;
} & ComponentProps<typeof AppText>) {
    return (
        <AppText
            variant="value"
            className={cn("text-foreground", className)}
            {...props}
        >
            {children}
        </AppText>
    );
}

export function ReservationFieldValue({
    children,
    className,
    ...props
}: {
    children: ReactNode;
} & ComponentProps<typeof AppText>) {
    return (
        <AppText
            variant="h3"
            className={cn("text-foreground", className)}
            {...props}
        >
            {children}
        </AppText>
    );
}
