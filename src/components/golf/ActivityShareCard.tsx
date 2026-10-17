import { NativeText } from "@/design-system/components/NativeText";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { ActivityShareCharts } from "@/components/golf/ActivityShareCharts";
import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { useTheme } from "@/design-system";
import type { ActivityHeatmapValue } from "@/design-system/components/charts/activity-heatmap";
import { typography } from "@/design-system/utils/typography";
import { Host, Row, Text } from "@expo/ui";
import { forwardRef, memo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";

type ActivityShareCardProps = {
    label: string;
    totalReservations: number;
    totalDays: number;
    totalHours: number;
    dailyValues: ActivityHeatmapValue[];
    heatmapStartDate: Date;
    heatmapEndDate: Date;
    numDays: number;
    showDayNumbers?: boolean;
    memberName?: string;
    memberImage?: string | null;
};

export const ActivityShareCard = memo(forwardRef<
    React.ElementRef<typeof View>,
    ActivityShareCardProps
>(function ActivityShareCard(
    {
        label,
        totalReservations,
        totalDays,
        totalHours,
        dailyValues,
        heatmapStartDate,
        heatmapEndDate,
        numDays,
        showDayNumbers = true,
        memberName,
        memberImage,
    },
    ref,
) {
    const { colors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();

    return (
        <View
            ref={ref}
            className="w-full overflow-hidden rounded-[28px] border border-border bg-card"
        >
            <View className="bg-primary px-6 pb-5 pt-6">
                <NativeText
                    variant="caption"
                    color="primaryForeground"
                    textStyle={{ fontWeight: "700" as const, letterSpacing: typography.caption.fontSize * 0.16 }}
                >
                    {t("activity.myGolfActivity", { period: label }).toUpperCase()}
                </NativeText>
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%", marginTop: 4 }}>
                    <Row
                        alignment="center"
                        spacing={8}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}
                    >
                        <Text
                            textStyle={{
                                ...typography.h1, lineHeight: typography.display.lineHeight * uiFontScale,
                                fontSize: typography.display.fontSize * uiFontScale,
                                color: colors.primaryForeground,
                            }}
                        >
                            {String(totalReservations ?? "")}
                        </Text>
                        <Text
                            textStyle={{
                                ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale,
                                color: colors.primaryForeground,
                                fontSize: typography.h3.fontSize * uiFontScale,
                            }}
                        >
                            {t("activity.reservations")}
                        </Text>
                    </Row>
                </Host>
                <View className="mt-3 flex-row gap-3">
                    <ShareMetric
                        value={String(totalDays)}
                        label={t("activity.daysPlayed")}
                    />
                    <ShareMetric
                        value={t("activity.hoursValue", {
                            value: totalHours.toFixed(1),
                        })}
                        label={t("activity.hoursOnCourse")}
                        divided
                    />
                </View>
            </View>
            <View className="px-6 pb-3 pt-3">
                <ActivityShareCharts
                    dailyValues={dailyValues}
                    startDate={heatmapStartDate}
                    endDate={heatmapEndDate}
                    numDays={numDays}
                    showDayNumbers={showDayNumbers}
                />
            </View>
            <View className="mx-6 flex-row items-center justify-between border-t border-border py-4">
                <View className="min-w-0 flex-1 flex-row items-center gap-2">
                    {memberImage ? (
                        <Image
                            source={{ uri: memberImage }}
                            className="h-8 w-8 rounded-full"
                        />
                    ) : (
                        <View className="h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <NativeText variant="caption" color="mutedForeground" wrap={false} textStyle={{ fontWeight: "600" as const }}>
                                    {(memberName || "G")
                                        .slice(0, 1)
                                        .toUpperCase()}
                                </NativeText>
                        </View>
                    )}
                    <NativeText
                        variant="body"
                        numberOfLines={2}
                        style={{ flex: 1, minWidth: 0 }}
                        textStyle={{ lineHeight: typography.subtext.lineHeight, fontSize: typography.subtext.fontSize, fontWeight: "600" as const }}
                    >
                        {memberName || t("activity.golfer")}
                    </NativeText>
                </View>
                <HappyGolfLogo
                    width={82}
                    height={20}
                    primaryColor={colors.primary}
                    accentColor={colors.warning}
                />
            </View>
        </View>
    );
}));

function ShareMetric({
    value,
    label,
    divided,
}: {
    value: string;
    label: string;
    divided?: boolean;
}) {

    return (
        <View
            className={`min-w-0 flex-1 px-2 ${divided ? "border-l border-primary-foreground/20 pl-4" : ""}`}
        >
            <NativeText variant="h3" color="primaryForeground">
                {value}
            </NativeText>
            <NativeText variant="caption" color="primaryForeground">
                {label}
            </NativeText>
        </View>
    );
}
