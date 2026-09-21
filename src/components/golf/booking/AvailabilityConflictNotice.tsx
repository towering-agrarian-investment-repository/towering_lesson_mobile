import { AppText } from "@/design-system";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type AvailabilityConflictNoticeProps = {
    message: string;
};

export function AvailabilityConflictNotice({
    message,
}: AvailabilityConflictNoticeProps) {
    const { t } = useTranslation();

    return (
        <View
            accessibilityRole="alert"
            className="gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-4"
        >
            <AppText variant="label" className="text-warning">
                {t("booking.timeNoLongerAvailableTitle")}
            </AppText>
            <AppText selectable className="text-foreground">
                {message}
            </AppText>
            <AppText variant="caption" className="text-muted-foreground">
                {t("booking.availabilityRefreshedMessage")}
            </AppText>
        </View>
    );
}
