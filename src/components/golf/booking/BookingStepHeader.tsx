import { NativeText } from "@/design-system/components/NativeText";
import { useTheme } from "@/design-system/utils/theme";
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
    const { colors } = useTheme();
    const { t } = useTranslation();
    const trail = selectionTrail?.filter(Boolean) ?? [context];
    const activeTrailIndex = Math.min(step, trail.length - 1);
    const stepIcons = [Ticket, CalendarDays, Clock3, MapPin];

    return (
        <View>
            <View className="flex-col gap-3">
                <NativeText variant="eyebrow" color="primary">
                    {t("booking.stepProgress", {
                        step,
                        total: totalSteps,
                    }).toUpperCase()}
                </NativeText>

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
                                <NativeText
                                    variant="caption"
                                    wrap={false}
                                    textStyle={{
                                        ...(index === activeTrailIndex
                                            ? {
                                                fontWeight:
                                                    "700" as const,
                                                color: colors.primary,
                                            }
                                            : index < activeTrailIndex
                                                ? {
                                                    fontWeight:
                                                        "600" as const,
                                                    color:
                                                        colors.foreground +
                                                        "cc",
                                                }
                                                : {
                                                    color: colors.mutedForeground,
                                                })
                                    }}
                                >
                                    {label}
                                </NativeText>

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
