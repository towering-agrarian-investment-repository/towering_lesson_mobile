import { AppText, Card, MotionView } from "@/design-system";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type BookingStepHeaderProps = {
    step: number;
    totalSteps: number;
    title?: string;
    context: string;
};

export function BookingStepHeader({
    step,
    totalSteps,
    title,
    context,
}: BookingStepHeaderProps) {
    const { t } = useTranslation();

    return (
        <MotionView delayMs={40}>
            <Card className="gap-2.5 rounded-3xl px-4 py-4">
                <View className="flex-row items-center justify-between gap-3">
                    <AppText
                        variant="eyebrow"
                        className="flex-1 text-primary"
                    >
                        {t("booking.stepProgress", {
                            step,
                            total: totalSteps,
                        })}
                    </AppText>

                    <View className="max-w-[58%] rounded-full bg-primary/10 px-3 py-1">
                        <AppText
                            variant="caption"
                            className="font-semibold text-primary"
                            numberOfLines={1}
                        >
                            {context}
                        </AppText>
                    </View>
                </View>

                {title ? <AppText variant="h3">{title}</AppText> : null}
            </Card>
        </MotionView>
    );
}
