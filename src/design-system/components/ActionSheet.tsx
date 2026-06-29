import { BlurView } from "expo-blur";
import { Check } from "lucide-react-native";
import { type ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { cn } from "../utils/cn";
import { triggerSelectionHaptic } from "../utils/haptics";
import { getPressedScaleStyle } from "../utils/pressable";
import { useTheme, useThemeColors } from "../utils/theme";

export type ActionSheetOption = {
    key: string;
    title: string;
    description?: string;
    icon?: ReactNode;
    selected?: boolean;
    disabled?: boolean;
    onPress: () => void;
};

type ActionSheetProps = {
    visible: boolean;
    title: string;
    description?: string;
    options: ActionSheetOption[];
    onClose: () => void;
    cancelLabel?: string;
    closeDelayMs?: number;
    blurEnabled?: boolean;
    blurIntensity?: number;
};

export function ActionSheet({
    visible,
    title,
    description,
    options,
    onClose,
    cancelLabel,
    closeDelayMs = 0,
    blurEnabled = true,
    blurIntensity = 60,
}: ActionSheetProps) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const { resolvedScheme } = useTheme();
    const resolvedCancelLabel = cancelLabel ?? t("common.cancel");

    const handleSelect = (option: ActionSheetOption) => {
        if (option.disabled) {
            return;
        }

        triggerSelectionHaptic();
        onClose();
        setTimeout(option.onPress, closeDelayMs);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                {blurEnabled ? (
                    <BlurView
                        tint={resolvedScheme === "dark" ? "dark" : "light"}
                        intensity={blurIntensity}
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                        }}
                    />
                ) : null}
                <View
                    className={blurEnabled ? "absolute inset-0 bg-black/18" : "absolute inset-0 bg-black/35"}
                />

                <Pressable
                    className="flex-1"
                    accessibilityRole="button"
                    accessibilityLabel={t("common.closeTitle", { title })}
                    onPress={onClose}
                />

                <View className="gap-4 rounded-t-3xl border border-border bg-card px-6 pb-8 pt-5">
                    <View className="gap-1">
                        <AppText variant="h3">{title}</AppText>
                        {description ? (
                            <AppText variant="muted">{description}</AppText>
                        ) : null}
                    </View>

                    <View className="gap-3">
                        {options.map((option) => (
                            <Pressable
                                key={option.key}
                                accessibilityRole="button"
                                accessibilityLabel={option.title}
                                accessibilityState={{
                                    disabled: option.disabled,
                                    selected: option.selected,
                                }}
                                disabled={option.disabled}
                                className={cn(
                                    "flex-row items-center gap-3 rounded-2xl border p-4 disabled:opacity-50",
                                    option.selected
                                        ? "border-primary bg-primary/10"
                                        : "border-border bg-surface",
                                )}
                                style={({ pressed }) =>
                                    getPressedScaleStyle(pressed, option.disabled, 0.992)
                                }
                                onPress={() => {
                                    handleSelect(option);
                                }}
                            >
                                {option.icon ? (
                                    <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
                                        {option.icon}
                                    </View>
                                ) : null}

                                <View className="flex-1 gap-0.5">
                                    <AppText variant="label" className="text-base">
                                        {option.title}
                                    </AppText>
                                    {option.description ? (
                                        <AppText variant="caption">
                                            {option.description}
                                        </AppText>
                                    ) : null}
                                </View>

                                {option.selected ? (
                                    <Check
                                        size={20}
                                        color={colors.primary}
                                        strokeWidth={2.5}
                                    />
                                ) : null}
                            </Pressable>
                        ))}
                    </View>

                    <Button title={resolvedCancelLabel} variant="ghost" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
}
