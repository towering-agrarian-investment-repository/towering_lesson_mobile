import { NativeText } from "@/design-system/components/NativeText";
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
            <NativeText variant="label" color="warning">
                {t("booking.timeNoLongerAvailableTitle")}
            </NativeText>
            <NativeText variant="body">
                {message}
            </NativeText>
            <NativeText variant="caption" color="mutedForeground">
                {t("booking.availabilityRefreshedMessage")}
            </NativeText>
        </View>
    );
}
