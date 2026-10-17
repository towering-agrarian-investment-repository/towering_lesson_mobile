import { useTheme } from "@/design-system";
import { Host, Switch } from "@expo/ui";
import { labelsHidden, tint } from "@expo/ui/swift-ui/modifiers";

export function DayNumbersToggle({ value, onValueChange, label, disabled }: {
    value: boolean;
    onValueChange: (value: boolean) => void;
    label: string;
    disabled?: boolean;
}) {
    const { colors, resolvedScheme } = useTheme();
    return (
        <Host matchContents ignoreSafeArea="all" colorScheme={resolvedScheme} accessibilityLabel={label}>
            <Switch value={value} onValueChange={onValueChange} disabled={disabled} modifiers={process.env.EXPO_OS === "ios" ? [labelsHidden(), tint(colors.primary)] : undefined} />
        </Host>
    );
}
