import { Modal, Pressable, View } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";

type ConfirmSheetVariant = "default" | "danger";

type ConfirmSheetProps = {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    onClose: () => void;
    cancelLabel?: string;
    loading?: boolean;
    disabled?: boolean;
    variant?: ConfirmSheetVariant;
};

export function ConfirmSheet({
    visible,
    title,
    message,
    confirmLabel,
    onConfirm,
    onClose,
    cancelLabel = "Cancel",
    loading = false,
    disabled = false,
    variant = "default",
}: ConfirmSheetProps) {
    const isDisabled = disabled || loading;

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
                    disabled={loading}
                    onPress={onClose}
                />

                <View className="gap-5 rounded-t-3xl border border-border bg-card px-6 pb-8 pt-5">
                    <View className="gap-2">
                        <AppText
                            variant="h3"
                            className={variant === "danger" ? "text-danger" : undefined}
                        >
                            {title}
                        </AppText>
                        <AppText variant="muted">{message}</AppText>
                    </View>

                    <View className="gap-3">
                        <Button
                            title={confirmLabel}
                            variant={variant === "danger" ? "danger" : "primary"}
                            loading={loading}
                            disabled={isDisabled}
                            onPress={onConfirm}
                        />

                        <Button
                            title={cancelLabel}
                            variant="ghost"
                            disabled={loading}
                            onPress={onClose}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}
