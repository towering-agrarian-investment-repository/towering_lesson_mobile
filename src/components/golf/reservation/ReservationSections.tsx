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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    return (
        <View className="flex-col gap-3">
            <ReservationFieldLabel>{label}</ReservationFieldLabel>

            <View className="flex-row items-center gap-3">
                {leftElement ? leftElement : null}

                <View className="min-w-0 flex-1 flex-col gap-3">
                    <ReservationFieldValue selectable={selectable}>{value}</ReservationFieldValue>

                    {description ? (
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                textStyle={{
                                    ...typography.subtext, lineHeight: typography.subtext.lineHeight * uiFontScale,
                                    color: uiColors.foreground + "bf",
                                    fontSize:
                                        typography.subtext.fontSize *
                                        uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                {description}
                            </Text>
                        </Host>
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const resolvedTitle = title ?? t("reservations.policiesTitle");

    return (
        <View className="flex-col gap-3">
            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                <Text
                    textStyle={{
                        ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale,
                        color: uiColors.foreground,
                        fontSize: typography.h3.fontSize * uiFontScale,
                    }}
                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                    {resolvedTitle}
                </Text>
            </Host>

            <View className="gap-3">
                {policies.map((policy) => (
                    <View key={policy.title} className="flex-col gap-3">
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                textStyle={{
                                    ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                    color: uiColors.foreground,
                                    fontSize:
                                        typography.label.fontSize * uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                {"- " + policy.title}
                            </Text>
                        </Host>

                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                textStyle={{
                                    ...typography.subtext, lineHeight: typography.subtext.lineHeight * uiFontScale,
                                    color: uiColors.foreground + "cc",
                                    fontSize:
                                        typography.subtext.fontSize *
                                        uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                {policy.description}
                            </Text>
                        </Host>
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    return (
        <View className={className}>
            <Host
                matchContents={{ vertical: true }}
                ignoreSafeArea="all"
                style={{ width: "100%" }}
            >
                <Text
                    textStyle={{
                        ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                        fontWeight: "500",
                        color: uiColors.foreground,
                        fontSize: typography.meta.fontSize * uiFontScale,
                    }}
                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                    {children}
                </Text>
            </Host>
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    return (
        <View className="grow">
            <AdaptivePanels
                primary={<View className="gap-4">{children}</View>}
                secondary={
                    <View className="gap-4">
                        <Divider className="bg-border" />

                        {disabledReason ? (
                            <View className="rounded-xl bg-warning/10 px-4 py-3">
                                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                    <Text
                                        textStyle={{
                                            ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                                            color: uiColors.warning,
                                            fontSize:
                                                typography.meta.fontSize *
                                                uiFontScale,
                                        }}
                                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                        {disabledReason}
                                    </Text>
                                </Host>
                            </View>
                        ) : null}

                        <ReservationPoliciesSection policies={policies} />
                    </View>
                }
            />
        </View>
    );
}
