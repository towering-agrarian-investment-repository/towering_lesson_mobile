import { ReservationDetailField } from "@/components/golf/reservation/ReservationSections";
import { AnimatedPressable, useThemeColors } from "@/design-system";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import type { ReactNode } from "react";

type ReservationDetailRowProps = {
    label: string;
    value: string;
    disabled?: boolean;
    leftElement?: ReactNode;
    onPress?: () => void;
};

export function ReservationDetailRow({
    label,
    value,
    disabled = false,
    leftElement,
    onPress,
}: ReservationDetailRowProps) {
    const colors = useThemeColors();

    const content = (
        <ReservationDetailField
            label={label}
            value={value}
            selectable
            leftElement={leftElement}
            trailingElement={
                onPress ? <ChevronRight size={18} color={colors.mutedForeground} strokeWidth={2.25} /> : undefined
            }
        />
    );

    if (!onPress) {
        return content;
    }

    return (
        <AnimatedPressable accessibilityRole="button" disabled={disabled} haptic="selection" onPress={onPress}>
            {content}
        </AnimatedPressable>
    );
}
