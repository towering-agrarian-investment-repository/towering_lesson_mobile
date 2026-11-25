import { AppText } from "@/design-system/components/AppText";
import { formatTicketPausePeriod, type TicketPausePeriod } from "@/utils/ticket-pause";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export function TicketPausePeriods({ periods }: { periods: readonly TicketPausePeriod[] }) {
    const { t } = useTranslation();

    if (periods.length === 0) return null;

    return (
        <View className="gap-1 rounded-lg bg-warning/10 px-3 py-2">
            {periods.map((period) => (
                <AppText key={period.id} variant="caption" color="warningText">
                    {formatTicketPausePeriod(period, t)}
                </AppText>
            ))}
        </View>
    );
}
