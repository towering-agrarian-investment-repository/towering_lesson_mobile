import { AnimatedPressable, AppText } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react-native";
import { View } from "react-native";

type SharePeriodNavigatorProps = {
    previousLabel: string;
    nextLabel: string;
    centerLabel: string;
    previousDisabled: boolean;
    nextDisabled: boolean;
    centerDisabled: boolean;
    centerExpanded: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onOpenPicker: () => void;
};

export function SharePeriodNavigator({
    previousLabel,
    nextLabel,
    centerLabel,
    previousDisabled,
    nextDisabled,
    centerDisabled,
    centerExpanded,
    onPrevious,
    onNext,
    onOpenPicker,
}: SharePeriodNavigatorProps) {
    const { colors } = useTheme();

    return (
        <View className="w-full flex-row items-center justify-center gap-3">
            <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={previousLabel}
                accessibilityState={{
                    disabled: previousDisabled,
                }}
                disabled={previousDisabled}
                className="min-h-12 min-w-12 items-center justify-center rounded-full bg-surface disabled:opacity-40"
                onPress={onPrevious}
            >
                <ChevronLeft size={20} color={colors.foreground} />
            </AnimatedPressable>
            <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={centerLabel}
                accessibilityState={{
                    expanded: centerExpanded,
                    disabled: centerDisabled,
                }}
                disabled={centerDisabled}
                className="min-h-12 flex-row items-center justify-center gap-2 rounded-full bg-surface px-4"
                onPress={onOpenPicker}
            >
                <Calendar size={18} color={colors.foreground} />
                <AppText variant="label" wrap={false}>
                    {centerLabel}
                </AppText>
                <ChevronDown size={16} color={colors.foreground} />
            </AnimatedPressable>
            <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={nextLabel}
                accessibilityState={{
                    disabled: nextDisabled,
                }}
                disabled={nextDisabled}
                className="min-h-12 min-w-12 items-center justify-center rounded-full bg-surface disabled:opacity-40"
                onPress={onNext}
            >
                <ChevronRight size={20} color={colors.foreground} />
            </AnimatedPressable>
        </View>
    );
}
