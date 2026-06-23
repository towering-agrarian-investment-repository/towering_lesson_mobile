import type { ComponentProps, ReactNode } from "react";
import { AppText } from "@/design-system";
import { cn } from "@/design-system";
import { useTranslation } from "react-i18next";
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
        <View className="flex-col gap-3">
            <ReservationFieldLabel>{label}</ReservationFieldLabel>

            <View className="flex-row items-center gap-3">
                {leftElement ? leftElement : null}

                <View className="flex-1 flex-col gap-3">
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
    title,
    policies,
}: {
    title?: string;
    policies: readonly ReservationPolicy[];
}) {
    const { t } = useTranslation();
    const resolvedTitle = title ?? t("reservations.policiesTitle");

    return (
        <View className="flex-col gap-3">
            <AppText variant="h3" className="text-foreground">
                {resolvedTitle}
            </AppText>

            <View className="gap-3">
                {policies.map((policy) => (
                    <View key={policy.title} className="flex-col gap-3">
                        <AppText variant="label" className="text-foreground">
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
            variant="meta"
            className={cn("font-medium text-foreground", className)}
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
            variant="body"
            className={cn("font-medium text-foreground", className)}
            {...props}
        >
            {children}
        </AppText>
    );
}
