import { NativeText } from "@/design-system/components/NativeText";
import { Divider } from "@/design-system";
import { AdaptivePanels } from "@/design-system/layout/AdaptivePanels";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame, textSelection } from "@expo/ui/swift-ui/modifiers";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Host, Text } from "@expo/ui";
import type { ReactNode } from "react";
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
        <View className="flex-col gap-3">
            <ReservationFieldLabel>{label}</ReservationFieldLabel>

            <View className="flex-row items-center gap-3">
                {leftElement ? leftElement : null}

                <View className="min-w-0 flex-1 flex-col gap-3">
                    <ReservationFieldValue selectable={selectable}>{value}</ReservationFieldValue>

                    {description ? (
                        <NativeText variant="subtext" textStyle={{ color: uiColors.foreground + "bf" }}>
                            {description}
                        </NativeText>
                    ) : null}
                </View>
                {trailingElement}
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
    const { colors: uiColors } = useTheme();
    const { t } = useTranslation();
    const resolvedTitle = title ?? t("reservations.policiesTitle");

    return (
        <View className="flex-col gap-3">
            <NativeText variant="h3">
                {resolvedTitle}
            </NativeText>

            <View className="gap-3">
                {policies.map((policy) => (
                    <View key={policy.title} className="flex-col gap-3">
                        <NativeText variant="label">
                            {"- " + policy.title}
                        </NativeText>

                        <NativeText variant="subtext" textStyle={{ color: uiColors.foreground + "cc" }}>
                            {policy.description}
                        </NativeText>
                    </View>
                ))}
            </View>
        </View>
    );
}

export function ReservationFieldLabel({
    children,
    className,
}: {
    children: string;
    className?: string;
}) {

    return (
        <View className={className}>
            <NativeText variant="meta" textStyle={{ fontWeight: "500" }}>
                {children}
            </NativeText>
        </View>
    );
}

export function ReservationFieldValue({
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
            <Host
                matchContents={{ vertical: true }}
                ignoreSafeArea="all"
                style={{ width: "100%" }}
            >
                <Text
                    modifiers={process.env.EXPO_OS === "ios"
                        ? [frame({ maxWidth: Infinity, alignment: "leading" }), ...(selectable ? [textSelection(true)] : [])]
                        : [fillMaxWidth()]}
                    textStyle={{
                        ...typography.body, lineHeight: typography.body.lineHeight * uiFontScale,
                        fontWeight: "500",
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

export function ReservationContent({
    children,
    disabledReason,
    policies,
}: ReservationContentProps) {

    return (
        <View className="grow">
            <AdaptivePanels
                primary={<View className="gap-4">{children}</View>}
                secondary={
                    <View className="gap-4">
                        <Divider className="bg-border" />

                        {disabledReason ? (
                            <View className="rounded-xl bg-warning/10 px-4 py-3">
                                <NativeText variant="meta" color="warning">
                                    {disabledReason}
                                </NativeText>
                            </View>
                        ) : null}

                        <ReservationPoliciesSection policies={policies} />
                    </View>
                }
            />
        </View>
    );
}
