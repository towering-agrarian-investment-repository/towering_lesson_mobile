import { useTheme } from "@/design-system";
import { Host, Switch } from "@expo/ui";
import { labelsHidden, tint } from "@expo/ui/swift-ui/modifiers";

export function DayNumbersToggle({ value, onValueChange, label }: {
    value: boolean;
    onValueChange: (value: boolean) => void;
    label: string;
}) {
    const { colors, resolvedScheme } = useTheme();
    return (
        <Host matchContents ignoreSafeArea="all" colorScheme={resolvedScheme} accessibilityLabel={label}>
            <Switch value={value} onValueChange={onValueChange} modifiers={process.env.EXPO_OS === "ios" ? [labelsHidden(), tint(colors.primary)] : undefined} />
        </Host>
    );
}
