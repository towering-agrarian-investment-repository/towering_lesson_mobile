import { AppText } from "@/design-system/components/AppText";
import { useTranslation } from "react-i18next";
import Animated, { FadeIn, FadeOut, useReducedMotion } from "react-native-reanimated";

type AvailabilityConflictNoticeProps = {
    message: string;
};

export function AvailabilityConflictNotice({
    message,
}: AvailabilityConflictNoticeProps) {
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();

    return (
        <Animated.View
            entering={reducedMotion ? undefined : FadeIn.duration(150)}
            exiting={reducedMotion ? undefined : FadeOut.duration(120)}
            accessibilityRole="alert"
            className="gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-4"
        >
            <AppText variant="label" color="warning">
                {t("booking.timeNoLongerAvailableTitle")}
            </AppText>
            <AppText variant="body">
                {message}
            </AppText>
            <AppText variant="caption" color="mutedForeground">
                {t("booking.availabilityRefreshedMessage")}
            </AppText>
        </Animated.View>
    );
}
