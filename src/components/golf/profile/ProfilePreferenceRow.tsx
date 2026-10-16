import { ListRow, useTheme } from "@/design-system";
import { cn } from "@/design-system/utils/cn";
import { getNativeButtonStyle, getNativeButtonTextStyle } from "@/design-system/utils/native-button-styles";
import { typography } from "@/design-system/utils/typography";
import { BottomSheet, Button, Host, RNHostView, Text } from "@expo/ui";
import { defaultMinSize, fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { Check } from "lucide-react-native";
import { type ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View, useWindowDimensions } from "react-native";

type ProfilePreferenceOption<T extends string> = {
    value: T;
    label: string;
    description: string;
    icon: ReactNode;
};

/** Profile settings keep their existing row and choice-card design; Expo owns sheet presentation. */
export function ProfilePreferenceRow<T extends string>({
    title,
    accessibilityLabel,
    sheetTitle = title,
    description,
    value,
    options,
    disabled,
    onChange,
}: {
    title: string;
    accessibilityLabel: string;
    sheetTitle?: string;
    description: string;
    value: T;
    options: ProfilePreferenceOption<T>[];
    disabled: boolean;
    onChange: (value: T) => void | Promise<void>;
}) {
    const { colors, resolvedScheme, fontScale } = useTheme();
    const { t } = useTranslation();
    const { height } = useWindowDimensions();
    const [isPresented, setIsPresented] = useState(false);
    const selectionLocked = useRef(false);
    const close = () => setIsPresented(false);

    return (
        <>
            <ListRow
                title={title}
                meta={options.find((option) => option.value === value)?.label}
                accessibilityLabel={accessibilityLabel}
                disabled={disabled}
                className="border-0 bg-transparent px-0 py-3"
                onPress={() => {
                    selectionLocked.current = false;
                    setIsPresented(true);
                }}
            />
            <BottomSheet
                isPresented={isPresented}
                onDismiss={close}
                containerColor={colors.card}
                contentColor={colors.foreground}
                contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
            >
                <RNHostView matchContents={{ vertical: true }}>
                    <View className="gap-4">
                        <View className="gap-1">
                            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                <Text textStyle={{ ...typography.h3, lineHeight: typography.h3.lineHeight * fontScale, color: colors.foreground, fontSize: typography.h3.fontSize * fontScale }} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                    {sheetTitle}
                                </Text>
                            </Host>
                            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                <Text textStyle={{ ...typography.muted, lineHeight: typography.muted.lineHeight * fontScale, color: colors.mutedForeground, fontSize: typography.muted.fontSize * fontScale }} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                    {description}
                                </Text>
                            </Host>
                        </View>
                        <ScrollView style={{ maxHeight: Math.max(96, height - 240) }} contentContainerStyle={{ gap: 12 }}>
                            {options.map((option) => (
                                <ListRow
                                    key={option.value}
                                    title={option.label}
                                    subtitle={option.description}
                                    titleStyle={{ fontWeight: "500" }}
                                    leading={<View className="h-11 w-11 items-center justify-center rounded-full bg-muted">{option.icon}</View>}
                                    trailing={option.value === value ? <Check size={20} color={colors.primary} strokeWidth={2.5} /> : undefined}
                                    showChevron={false}
                                    className={cn("gap-3", option.value === value ? "border-primary bg-primary/10" : "border-border bg-surface")}
                                    accessibilityState={{ selected: option.value === value, disabled }}
                                    disabled={disabled}
                                    onPress={() => {
                                        if (disabled || selectionLocked.current) return;
                                        selectionLocked.current = true;
                                        close();
                                        void onChange(option.value);
                                    }}
                                />
                            ))}
                        </ScrollView>
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" colorScheme={resolvedScheme} style={{ width: "100%" }}>
                            <Button
                                variant="text"
                                onPress={close}
                                style={getNativeButtonStyle(colors, "text")}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })]}
                            >
                                <Text
                                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth()]}
                                    textStyle={getNativeButtonTextStyle(colors, "text", fontScale)}
                                >
                                    {t("common.cancel")}
                                </Text>
                            </Button>
                        </Host>
                    </View>
                </RNHostView>
            </BottomSheet>
        </>
    );
}
