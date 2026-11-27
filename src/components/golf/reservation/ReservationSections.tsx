import { AppText } from "@/design-system/components/AppText";
import { Divider } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type ReservationPolicy = {
    title: string;
    description: string;
};

export function ReservationDetailField({
    label,
    value,
    description,
    leftElement,
    trailingElement,
    selectable = false,
}: {
    label: string;
    value: string;
    description?: string;
    leftElement?: ReactNode;
    trailingElement?: ReactNode;
    selectable?: boolean;
}) {
    const { colors: uiColors } = useTheme();
    return (
        <View className="flex-col gap-1.5">
            <ReservationFieldLabel>{label}</ReservationFieldLabel>

            <View className="flex-row items-center gap-3">
                {leftElement ? leftElement : null}

                <View className="min-w-0 flex-1 flex-col gap-1">
                    <AppText
                        variant="label"
                        selectable={selectable}
                        maxFontSizeMultiplier={process.env.EXPO_OS === "android" ? 0 : 1.5}
                        textStyle={{ includeFontPadding: false }}
                    >
                        {value}
                    </AppText>

                    {description ? (
                        <AppText variant="subtext" textStyle={{ color: uiColors.mutedForeground }}>
                            {description}
                        </AppText>
                    ) : null}
                </View>
                {trailingElement}
            </View>
        </View>
    );
}

function ReservationPoliciesSection({ title, policies }: { title?: string; policies: readonly ReservationPolicy[] }) {
    const { colors: uiColors } = useTheme();
    const { t } = useTranslation();
    const resolvedTitle = title ?? t("reservations.policiesTitle");

    return (
        <View className="flex-col gap-3">
            <AppText variant="h3">{resolvedTitle}</AppText>

            <View className="gap-3">
                {policies.map((policy) => (
                    <View key={policy.title} className="flex-col gap-1">
                        <AppText variant="label">{"- " + policy.title}</AppText>

                        <AppText variant="subtext" textStyle={{ color: uiColors.mutedForeground }}>
                            {policy.description}
                        </AppText>
                    </View>
                ))}
            </View>
        </View>
    );
}

export function ReservationFieldLabel({ children, className }: { children: string; className?: string }) {
    return (
        <View className={className}>
            <AppText variant="subtext" color="mutedForeground">
                {children}
            </AppText>
        </View>
    );
}

type ReservationContentProps = {
    children: React.ReactNode;
    disabledReason?: string | null;
    policies: readonly ReservationPolicy[];
};

export function ReservationContent({ children, disabledReason, policies }: ReservationContentProps) {
    return (
        <View className="grow gap-6">
            <View className="gap-4">{children}</View>
            <View className="gap-4">
                <Divider className="bg-border" />

                {disabledReason ? (
                    <View className="rounded-xl bg-warning/10 px-4 py-3">
                        <AppText variant="subtext" color="warning">
                            {disabledReason}
                        </AppText>
                    </View>
                ) : null}

                <ReservationPoliciesSection policies={policies} />
            </View>
        </View>
    );
}
