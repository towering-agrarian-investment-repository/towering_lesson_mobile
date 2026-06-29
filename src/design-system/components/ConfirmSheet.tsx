import { BlurView } from "expo-blur";
import { Modal, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { useTheme } from "../utils/theme";

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
    blurEnabled?: boolean;
    blurIntensity?: number;
};

export function ConfirmSheet({
    visible,
    title,
    message,
    confirmLabel,
    onConfirm,
    onClose,
    cancelLabel,
    loading = false,
    disabled = false,
    variant = "default",
    blurEnabled = true,
    blurIntensity = 60,
}: ConfirmSheetProps) {
    const { t } = useTranslation();
    const isDisabled = disabled || loading;
    const { resolvedScheme } = useTheme();
    const resolvedCancelLabel = cancelLabel ?? t("common.cancel");

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
                            title={resolvedCancelLabel}
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
