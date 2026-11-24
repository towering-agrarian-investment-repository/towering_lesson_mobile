import { AnimatedPressable, useTheme } from "@/design-system";
import type { ActivityHeatmapValue } from "@/design-system/components/charts/activity-chart-data";
import { Stack } from "expo-router";
import { Share, Share2 } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivitySharePreviewModal, type ActivityShareCardProps } from "./share/ActivitySharePreviewModal";

type ActivitySharePreviewProps = {
    isAvailable: boolean;
    cardProps: ActivityShareCardProps;
    initialDailyValues: ActivityHeatmapValue[];
    availableYears: number[];
    selectedYear: number | "all";
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

// Split the header trigger from the heavy studio modal so hidden tabs do not
// instantiate capture, date-formatter, or activity hooks until opened.
export function ActivitySharePreview({
    isAvailable,
    cardProps,
    initialDailyValues,
    availableYears,
    selectedYear,
    open,
    onOpenChange,
}: ActivitySharePreviewProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    const [internalOpen, setInternalOpen] = useState(false);
    const showShareCard = open ?? internalOpen;
    const setShowShareCard = useCallback(
        (next: boolean) => {
            if (onOpenChange) {
                onOpenChange(next);
            } else {
                setInternalOpen(next);
            }
        },
        [onOpenChange],
    );

    const ShareHeaderIcon = process.env.EXPO_OS === "ios" ? Share : Share2;

    const previewOptions = useMemo(
        () => ({
            headerRight: () => (
                <AnimatedPressable
                    accessibilityRole="button"
                    accessibilityLabel={t("shareCard.studioTitle")}
                    accessibilityState={{ disabled: !isAvailable }}
                    disabled={!isAvailable}
                    haptic="selection"
                    className="min-h-12 min-w-12 items-center justify-center"
                    onPress={() => {
                        setShowShareCard(true);
                    }}
                >
                    <ShareHeaderIcon size={20} color={isAvailable ? colors.foreground : colors.mutedForeground} />
                </AnimatedPressable>
            ),
        }),
        [ShareHeaderIcon, colors.foreground, colors.mutedForeground, isAvailable, setShowShareCard, t],
    );

    return (
        <>
            <Stack.Screen options={previewOptions} />
            {showShareCard ? (
                <ActivitySharePreviewModal
                    isAvailable={isAvailable}
                    cardProps={cardProps}
                    initialDailyValues={initialDailyValues}
                    availableYears={availableYears}
                    selectedYear={selectedYear}
                    onClose={() => setShowShareCard(false)}
                />
            ) : null}
        </>
    );
}
