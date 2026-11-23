import { Button, Host, RNHostView, Row, Spacer, Text } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { contentShape, frame, shapes } from "@expo/ui/swift-ui/modifiers";
import { ActivityIndicator } from "react-native";
import {
    triggerImpactHaptic,
    triggerSelectionHaptic,
    triggerSuccessHaptic,
} from "../utils/haptics";
import {
    getNativeButtonStyle,
    getNativeButtonTextStyle,
} from "../utils/native-button-styles";
import { useTheme } from "../utils/theme";

const isIOS = process.env.EXPO_OS === "ios";
const BUTTON_OUTER_MODIFIERS = isIOS
    ? [frame({ maxWidth: Infinity, minHeight: 48 })]
    : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })];
const BUTTON_INNER_MODIFIERS = isIOS
    ? [frame({ maxWidth: Infinity, minHeight: 48 }), contentShape(shapes.rectangle())]
    : [fillMaxWidth()];

type ActionButtonAppearance = "filled" | "outlined" | "text";
type ActionButtonTone = "primary" | "danger";

type ActionButtonProps = {
    label: string;
    onPress: () => void;
    appearance?: ActionButtonAppearance;
    tone?: ActionButtonTone;
    disabled?: boolean;
    loading?: boolean;
    haptic?: "selection" | "impact" | "success" | false;
    accessibilityLabel?: string;
    accessibilityHint?: string;
};

export function ActionButton({
    label,
    onPress,
    appearance = "filled",
    tone = "primary",
    disabled = false,
    loading = false,
    haptic = "selection",
    accessibilityLabel,
    accessibilityHint,
}: ActionButtonProps) {
    const { colors, resolvedScheme, fontScale } = useTheme();
    const accent = tone === "danger" ? colors.danger : colors.primary;
    const isDisabled = disabled || loading;

    const handlePress = () => {
        if (isDisabled) return;
        if (haptic === "selection") {
            triggerSelectionHaptic();
        } else if (haptic === "impact") {
            triggerImpactHaptic();
        } else if (haptic === "success") {
            triggerSuccessHaptic();
        }
        onPress();
    };

    const textStyle = getNativeButtonTextStyle(
        colors,
        appearance,
        fontScale,
        accent,
    );

    return (
        <Host
            matchContents={{ vertical: true }}
            ignoreSafeArea="all"
            colorScheme={resolvedScheme}
            seedColor={accent}
            style={{ width: "100%" }}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled: isDisabled, busy: loading }}
        >
            <Button
                variant="text"
                disabled={isDisabled}
                modifiers={BUTTON_OUTER_MODIFIERS}
                style={getNativeButtonStyle(colors, appearance, isDisabled, accent)}
                onPress={handlePress}
            >
                {loading ? (
                    <Row
                        alignment="center"
                        spacing={8}
                        modifiers={BUTTON_INNER_MODIFIERS}
                    >
                        <Spacer flexible />
                        <RNHostView matchContents>
                            <ActivityIndicator
                                size="small"
                                color={
                                    appearance === "filled"
                                        ? colors.primaryForeground
                                        : accent
                                }
                            />
                        </RNHostView>
                        <Text textStyle={textStyle}>{label}</Text>
                        <Spacer flexible />
                    </Row>
                ) : (
                    <Text
                        textStyle={textStyle}
                        modifiers={BUTTON_INNER_MODIFIERS}
                    >
                        {label}
                    </Text>
                )}
            </Button>
        </Host>
    );
}
