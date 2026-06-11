import { Check } from "lucide-react-native";
import { type ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";

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
};

export function ActionSheet({
    visible,
    title,
    description,
    options,
    onClose,
    cancelLabel = "Cancel",
    closeDelayMs = 0,
}: ActionSheetProps) {
    const colors = useThemeColors();

    const handleSelect = (option: ActionSheetOption) => {
        if (option.disabled) {
            return;
        }

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
            <View className="flex-1 justify-end bg-black/40">
                <Pressable
                    className="flex-1"
                    accessibilityRole="button"
                    accessibilityLabel={`Close ${title}`}
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
                                    "flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80 disabled:opacity-50",
                                    option.selected
                                        ? "border-primary bg-primary/10"
                                        : "border-border bg-surface",
                                )}
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

                    <Button title={cancelLabel} variant="ghost" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
}
