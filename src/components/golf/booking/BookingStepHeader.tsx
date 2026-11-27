import { AppText } from "@/design-system/components/AppText";
import { useTheme } from "@/design-system/utils/theme";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import Clock3 from "lucide-react-native/icons/clock-3";
import MapPin from "lucide-react-native/icons/map-pin";
import Ticket from "lucide-react-native/icons/ticket";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type BookingStepHeaderProps = {
    step: number;
    totalSteps: number;
    context: string;
    selectionTrail?: string[];
};

export function BookingStepHeader({ step, totalSteps, context, selectionTrail }: BookingStepHeaderProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const trail = selectionTrail?.filter(Boolean) ?? [context];
    const activeTrailIndex = Math.min(step, trail.length - 1);
    const stepIcons = [Ticket, CalendarDays, Clock3, MapPin];

    return (
        <View>
            <View className="flex-col gap-3">
                <AppText variant="badge" color="primary">
                    {t("booking.stepProgress", {
                        step,
                        total: totalSteps,
                    }).toUpperCase()}
                </AppText>

                <View className="flex-row flex-wrap items-center gap-x-1 gap-y-1">
                    {trail.map((label, index) => {
                        const StepIcon = stepIcons[index] ?? Ticket;
                        const isActive = index === activeTrailIndex;

                        return (
                            <View key={label} className="max-w-full flex-row items-center gap-1">
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
                                    numberOfLines={1}
                                    style={{ flexShrink: 1 }}
                                    textStyle={{
                                        ...(index === activeTrailIndex
                                            ? {
                                                  fontWeight: "700" as const,
                                                  color: colors.primary,
                                              }
                                            : index < activeTrailIndex
                                              ? {
                                                    fontWeight: "600" as const,
                                                    color: colors.foreground,
                                                }
                                              : {
                                                    color: colors.mutedForeground,
                                                }),
                                    }}
                                >
                                    {label}
                                </AppText>

                                {index < trail.length - 1 ? (
                                    <ChevronRight size={13} color={colors.mutedForeground} strokeWidth={2} />
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}
