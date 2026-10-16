import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { useThemeColors } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Host, Text } from "@expo/ui";
import {
    CalendarDays,
    ChevronRight,
    Clock3,
    MapPin,
    Ticket,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type BookingStepHeaderProps = {
    step: number;
    totalSteps: number;
    context: string;
    selectionTrail?: string[];
};

export function BookingStepHeader({
    step,
    totalSteps,
    context,
    selectionTrail,
}: BookingStepHeaderProps) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const colors = useThemeColors();
    const trail = selectionTrail?.filter(Boolean) ?? [context];
    const activeTrailIndex = Math.min(step, trail.length - 1);
    const stepIcons = [Ticket, CalendarDays, Clock3, MapPin];

    return (
        <View>
            <View className="flex-col gap-3">
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.eyebrow, lineHeight: typography.eyebrow.lineHeight * uiFontScale,
                            color: uiColors.primary,
                            fontSize: typography.eyebrow.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {t("booking.stepProgress", {
                            step,
                            total: totalSteps,
                        }).toUpperCase()}
                    </Text>
                </Host>

                <View className="flex-row flex-wrap items-center gap-x-1 gap-y-1">
                    {trail.map((label, index) => {
                        const StepIcon = stepIcons[index] ?? Ticket;
                        const isActive = index === activeTrailIndex;

                        return (
                            <View
                                key={label}
                                className="flex-row items-center gap-1"
                            >
                                <StepIcon
                                    size={13}
                                    color={
                                        isActive
                                            ? colors.primary
                                            : index < activeTrailIndex
                                                ? colors.foreground
                                                : colors.mutedForeground
                                    }
                                    strokeWidth={2.2}
                                />
                                <Host matchContents ignoreSafeArea="all">
                                    <Text
                                        textStyle={{
                                            ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                            ...(index === activeTrailIndex
                                                ? {
                                                    fontWeight:
                                                        "700" as const,
                                                    color: uiColors.primary,
                                                }
                                                : index < activeTrailIndex
                                                    ? {
                                                        fontWeight:
                                                            "600" as const,
                                                        color:
                                                            uiColors.foreground +
                                                            "cc",
                                                    }
                                                    : {
                                                        color: uiColors.mutedForeground,
                                                    }),
                                            fontSize:
                                                typography.caption.fontSize *
                                                uiFontScale,
                                        }}
                                    >
                                        {label}
                                    </Text>
                                </Host>

                                {index < trail.length - 1 ? (
                                    <ChevronRight
                                        size={13}
                                        color={colors.mutedForeground}
                                        strokeWidth={2}
                                    />
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}
