import { useTheme } from "@/design-system";
import { Host } from "@expo/ui";
import { Switch } from "@expo/ui/jetpack-compose";

// Universal Switch doesn't expose track/thumb colors in SDK 58.
export function DayNumbersToggle({ value, onValueChange, label }: {
    value: boolean;
    onValueChange: (value: boolean) => void;
    label: string;
}) {
    const { colors, resolvedScheme } = useTheme();
    return (
        <Host matchContents ignoreSafeArea="all" colorScheme={resolvedScheme} accessibilityLabel={label}>
            <Switch value={value} onCheckedChange={onValueChange} colors={{
                checkedTrackColor: colors.primary,
                uncheckedTrackColor: colors.muted,
                checkedThumbColor: colors.card,
                uncheckedThumbColor: colors.card,
                checkedBorderColor: "transparent",
                uncheckedBorderColor: "transparent",
            }} />
        </Host>
    );
}
