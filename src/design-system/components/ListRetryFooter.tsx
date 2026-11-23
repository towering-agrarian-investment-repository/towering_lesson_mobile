import { useTranslation } from "react-i18next";
import { AnimatedPressable } from "./AnimatedPressable";
import { AppText } from "./AppText";

type ListRetryFooterProps = {
    onRetry: () => void;
    disabled?: boolean;
    busy?: boolean;
    label?: string;
    className?: string;
};

export function ListRetryFooter({
    onRetry,
    disabled = false,
    busy = false,
    label,
    className,
}: ListRetryFooterProps) {
    const { t } = useTranslation();

    return (
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityState={{ disabled, busy }}
            disabled={disabled}
            haptic="selection"
            onPress={onRetry}
            className={`items-center justify-center px-6 disabled:opacity-60 ${className ?? ""}`}
            style={{ minHeight: 48 }}
        >
            <AppText variant="label" color="primary">
                {label ?? t("common.refreshTryAgain")}
            </AppText>
        </AnimatedPressable>
    );
}
