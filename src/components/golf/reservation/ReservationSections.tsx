import { AppText } from "@/design-system/components/AppText";
import { Divider } from "@/design-system";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame, textSelection } from "@expo/ui/swift-ui/modifiers";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Host, Text } from "@expo/ui";
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
                    <ReservationFieldValue selectable={selectable}>{value}</ReservationFieldValue>

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

function ReservationFieldValue({
    children,
    className,
    selectable = false,
}: {
    children: string;
    className?: string;
    selectable?: boolean;
}) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    return (
        <View className={className}>
            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                <Text
                    modifiers={
                        process.env.EXPO_OS === "ios"
                            ? [
                                  frame({ maxWidth: Infinity, alignment: "leading" }),
                                  ...(selectable ? [textSelection(true)] : []),
                              ]
                            : [fillMaxWidth()]
                    }
                    textStyle={{
                        ...typography.body,
                        lineHeight: typography.body.lineHeight * uiFontScale,
                        fontWeight: "600",
                        color: uiColors.foreground,
                        fontSize: typography.body.fontSize * uiFontScale,
                    }}
                >
                    {children}
                </Text>
            </Host>
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
