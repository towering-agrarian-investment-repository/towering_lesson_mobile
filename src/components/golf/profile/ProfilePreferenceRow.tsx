import { PendingBottomSheet } from "@/design-system/components/PendingBottomSheet";
import { NativeText } from "@/design-system/components/NativeText";
import { InlineState, ListRow, useTheme } from "@/design-system";
import { cn } from "@/design-system/utils/cn";
import { getNativeButtonStyle, getNativeButtonTextStyle } from "@/design-system/utils/native-button-styles";
import { Button, Host, RNHostView, Text } from "@expo/ui";
import { defaultMinSize, fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { Check } from "lucide-react-native";
import { type ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, View, useWindowDimensions } from "react-native";

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
    leading,
    value,
    options,
    disabled,
    onChange,
}: {
    title: string;
    accessibilityLabel: string;
    sheetTitle?: string;
    description: string;
    leading?: ReactNode;
    value: T;
    options: ProfilePreferenceOption<T>[];
    disabled: boolean;
    onChange: (value: T) => void | Promise<void>;
}) {
    const { colors, resolvedScheme, fontScale } = useTheme();
    const { t } = useTranslation();
    const { height } = useWindowDimensions();
    const [isPresented, setIsPresented] = useState(false);
    const [pendingValue, setPendingValue] = useState<T | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const selectionLocked = useRef(false);
    const pending = pendingValue !== null;
    const close = () => { if (!selectionLocked.current) setIsPresented(false); };

    const select = async (nextValue: T) => {
        if (disabled || selectionLocked.current) return;
        selectionLocked.current = true;
        setSaveError(null);
        setPendingValue(nextValue);
        try {
            await onChange(nextValue);
            setIsPresented(false);
        } catch {
            setSaveError(t("common.refreshTryAgain"));
        } finally {
            selectionLocked.current = false;
            setPendingValue(null);
        }
    };

    return (
        <>
            <ListRow
                title={title}
                leading={leading}
                meta={<NativeText variant="meta" color="foreground" wrap={false} textStyle={{ fontWeight: "600" }}>
                    {options.find((option) => option.value === value)?.label ?? ""}
                </NativeText>}
                accessibilityLabel={accessibilityLabel}
                disabled={disabled || pending}
                className="border-0 bg-transparent px-0 py-3"
                onPress={() => {
                    if (selectionLocked.current) return;
                    setSaveError(null);
                    setIsPresented(true);
                }}
            />
            <PendingBottomSheet
                isPresented={isPresented}
                onDismiss={close}
                dismissDisabled={pending}

                containerColor={colors.card}
                contentColor={colors.foreground}
                contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
            >
                <RNHostView matchContents={{ vertical: true }}>
                    <View className="gap-4">
                        <View className="gap-1">
                            <NativeText variant="h3">
                                {sheetTitle}
                            </NativeText>
                            <NativeText variant="muted" color="mutedForeground">
                                {description}
                            </NativeText>
                        </View>
                        <ScrollView style={{ maxHeight: Math.max(96, height - 240) }} contentContainerStyle={{ gap: 12 }}>
                            {options.map((option) => (
                                <ListRow
                                    key={option.value}
                                    title={option.label}
                                    subtitle={option.description}
                                    titleStyle={{ fontWeight: "500" }}
                                    leading={<View className="h-11 w-11 items-center justify-center rounded-full bg-muted">{option.icon}</View>}
                                    trailing={option.value === pendingValue ? <ActivityIndicator color={colors.primary} /> : option.value === value ? <Check size={20} color={colors.primary} strokeWidth={2.5} /> : undefined}
                                    showChevron={false}
                                    className={cn("gap-3", option.value === value ? "border-primary bg-primary/10" : "border-border bg-surface")}
                                    accessibilityState={{ selected: option.value === value, disabled: disabled || pending, busy: option.value === pendingValue }}
                                    disabled={disabled || pending}
                                    onPress={() => { void select(option.value); }}
                                />
                            ))}
                        </ScrollView>
                        {saveError ? <InlineState title={saveError} tone="danger" /> : null}
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" colorScheme={resolvedScheme} style={{ width: "100%" }}>
                            <Button
                                variant="text"
                                disabled={pending}
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
            </PendingBottomSheet>
        </>
    );
}
