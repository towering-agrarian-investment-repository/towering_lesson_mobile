import { AppText, useThemeColors } from "@/design-system";
import { CalendarDays, Clock3, MapPin, Ticket, ChevronRight } from "lucide-react-native";
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
    const { t } = useTranslation();
    const colors = useThemeColors();
    const trail = selectionTrail?.filter(Boolean) ?? [context];
    const activeTrailIndex = Math.min(step, trail.length - 1);
    const stepIcons = [Ticket, CalendarDays, Clock3, MapPin];

    return (
        <View>
            <View className="flex-col gap-3">
                    <AppText
                        variant="eyebrow"
                        className="text-primary"
                    >
                        {t("booking.stepProgress", {
                            step,
                            total: totalSteps,
                        })}
                    </AppText>

                    <View className="flex-row flex-wrap items-center gap-x-1 gap-y-1">
                        {trail.map((label, index) => {
                            const StepIcon = stepIcons[index] ?? Ticket;
                            const isActive = index === activeTrailIndex;

                            return (
                                <View key={label} className="flex-row items-center gap-1">
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
                                <AppText
                                    variant="caption"
                                    className={
                                        index === activeTrailIndex
                                            ? "font-bold text-primary"
                                            : index < activeTrailIndex
                                                ? "font-semibold text-foreground/80"
                                                : "text-muted-foreground"
                                    }
                                >
                                    {label}
                                </AppText>

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
