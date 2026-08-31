import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { ActivityShareCharts } from "@/components/golf/ActivityShareCharts";
import { AppText, useTheme } from "@/design-system";
import type { ActivityHeatmapValue } from "@/design-system/components/charts/activity-heatmap";
import { forwardRef } from "react";
import { Image, View } from "react-native";
import { useTranslation } from "react-i18next";

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

export const ActivityShareCard = forwardRef<View, ActivityShareCardProps>(function ActivityShareCard({ label, totalReservations, totalDays, totalHours, dailyValues, heatmapStartDate, heatmapEndDate, numDays, showDayNumbers = true, memberName, memberImage }, ref) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    return (
        <View ref={ref} className="w-full overflow-hidden rounded-[28px] border border-border bg-card">
            <View className="bg-primary px-6 pb-5 pt-6">
                <AppText variant="caption" className="font-bold uppercase tracking-[0.16em] text-primary-foreground">
                    {t("activity.myGolfActivity", { period: label })}
                </AppText>
                <View className="mt-1 flex-row items-baseline gap-2">
                    <AppText variant="h1" className="text-6xl text-primary-foreground">{totalReservations}</AppText>
                    <AppText variant="h3" className="text-primary-foreground">{t("activity.reservations")}</AppText>
                </View>
                <View className="mt-3 flex-row gap-3">
                    <ShareMetric value={String(totalDays)} label={t("activity.daysPlayed")} />
                    <ShareMetric value={`${totalHours.toFixed(1)}h`} label={t("activity.hoursOnCourse")} divided />
                </View>
            </View>
            <View className="px-6 pb-3 pt-3">
                <ActivityShareCharts dailyValues={dailyValues} startDate={heatmapStartDate} endDate={heatmapEndDate} numDays={numDays} showDayNumbers={showDayNumbers} />
            </View>
            <View className="mx-6 flex-row items-center justify-between border-t border-border py-4">
                <View className="min-w-0 flex-1 flex-row items-center gap-2">
                    {memberImage ? (
                        <Image source={{ uri: memberImage }} className="h-8 w-8 rounded-full" />
                    ) : (
                        <View className="h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <AppText variant="caption" className="font-semibold">
                                {(memberName || "G").slice(0, 1).toUpperCase()}
                            </AppText>
                        </View>
                    )}
                    <AppText variant="body" className="min-w-0 flex-1 text-sm font-semibold" numberOfLines={2}>
                        {memberName || t("activity.golfer")}
                    </AppText>
                </View>
                <HappyGolfLogo width={82} height={20} primaryColor={colors.primary} accentColor={colors.warning} />
            </View>
        </View>
    );
});

function ShareMetric({ value, label, divided }: { value: string; label: string; divided?: boolean }) {
    return (
        <View className={`min-w-0 flex-1 px-2 ${divided ? "border-l border-primary-foreground/20 pl-4" : ""}`}>
            <AppText variant="h3" className="text-primary-foreground">{value}</AppText>
            <AppText variant="caption" className="text-primary-foreground">{label}</AppText>
        </View>
    );
}
