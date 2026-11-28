import { MonthlyGolfShareCard } from "@/components/golf/MonthlyGolfShareCard";
import { SHARE_CARD_CORNER_RADIUS, SHARE_CARD_WIDTH } from "@/components/golf/monthly-share-card-layout";
import { YearlyShareCard } from "@/components/golf/YearlyShareCard";
import { AnimatedPressable, AppText } from "@/design-system";
import type { ActivityHeatmapValue } from "@/design-system/components/charts/activity-chart-data";
import { useTranslation } from "react-i18next";
import type { ComponentProps, ElementRef, Ref } from "react";
import { View } from "react-native";

type ShareCardProps = Pick<ComponentProps<typeof MonthlyGolfShareCard>, "memberName" | "memberImage">;

type ShareCardSceneProps = {
    period: "month" | "year";
    stageHeight: number;
    showCard: boolean;
    cardWidth: number;
    scheme: "light" | "dark";
    cardProps: ShareCardProps;
    dailyValues: ActivityHeatmapValue[];
    year: number;
    month: number;
    hoursOnCourse: number;
    annualReservations: number;
    annualHours: number;
    loadingValues: boolean;
    isError: boolean;
    isRefetching: boolean;
    onRefetch: () => void;
    cardRef: Ref<ElementRef<typeof View>>;
    onReadyChange: (ready: boolean) => void;
    onAssetError: () => void;
};

export function ShareCardScene({
    period,
    stageHeight,
    showCard,
    cardWidth,
    scheme,
    cardProps,
    dailyValues,
    year,
    month,
    hoursOnCourse,
    annualReservations,
    annualHours,
    loadingValues,
    isError,
    isRefetching,
    onRefetch,
    cardRef,
    onReadyChange,
    onAssetError,
}: ShareCardSceneProps) {
    const { t } = useTranslation();

    return (
        <View
            className="w-full items-center justify-center overflow-hidden rounded-3xl bg-surface px-4 py-5"
            style={{ height: stageHeight }}
        >
            {showCard ? (
                <View
                    className="overflow-hidden border border-border/70"
                    style={{
                        borderRadius: (SHARE_CARD_CORNER_RADIUS * cardWidth) / SHARE_CARD_WIDTH,
                    }}
                >
                    {period === "month" ? (
                        <MonthlyGolfShareCard
                            ref={cardRef}
                            {...cardProps}
                            scheme={scheme}
                            dailyValues={dailyValues}
                            year={year}
                            month={month}
                            hoursOnCourse={hoursOnCourse}
                            loadingValues={loadingValues}
                            width={cardWidth}
                            onReadyChange={onReadyChange}
                            onAssetError={onAssetError}
                        />
                    ) : (
                        <YearlyShareCard
                            ref={cardRef}
                            {...cardProps}
                            scheme={scheme}
                            dailyValues={dailyValues}
                            year={year}
                            totalReservations={annualReservations}
                            hoursPlayed={annualHours}
                            loadingValues={loadingValues}
                            width={cardWidth}
                            onReadyChange={onReadyChange}
                            onAssetError={onAssetError}
                        />
                    )}
                </View>
            ) : (
                <View className="w-full items-center gap-3 py-12">
                    <AppText variant="h3" align="center">
                        {t(isError ? "activity.couldNotLoad" : "activity.emptyTitle")}
                    </AppText>
                    <AppText variant="subtext" color="mutedForeground" align="center">
                        {t(isError ? "common.pullToRefreshAndTryAgain" : "activity.emptyMessage")}
                    </AppText>
                    {isError ? (
                        <AnimatedPressable
                            accessibilityRole="button"
                            accessibilityState={{
                                disabled: isRefetching,
                                busy: isRefetching,
                            }}
                            disabled={isRefetching}
                            className="min-h-12 items-center justify-center rounded-xl bg-primary px-5 disabled:opacity-60"
                            onPress={onRefetch}
                        >
                            <AppText variant="label" color="primaryForeground" wrap={false}>
                                {t(isRefetching ? "common.refreshing" : "common.refreshTryAgain")}
                            </AppText>
                        </AnimatedPressable>
                    ) : null}
                </View>
            )}
        </View>
    );
}
