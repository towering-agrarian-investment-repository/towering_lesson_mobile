import { mapActivityDays } from "@/components/golf/activity-display-data";
import { MonthlyGolfShareCard } from "@/components/golf/MonthlyGolfShareCard";
import { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from "@/components/golf/monthly-share-card-layout";
import { ShareMonthYearPicker } from "@/components/golf/ShareMonthYearPicker";
import {
    AnimatedPressable,
    AppText,
    Screen,
    SwipeableTabBar,
    type SwipeableTabRoute,
    triggerImpactHaptic,
    triggerSelectionHaptic,
    useTheme,
} from "@/design-system";
import type { ActivityHeatmapValue } from "@/design-system/components/charts/activity-chart-data";
import { useMemberActivity } from "@/lib/hook/useMemberActivity";
import type { ShareCardAction } from "@/lib/hook/useShareCardExport";
import { useShareCardExport } from "@/lib/hook/useShareCardExport";
import { useShareMonth } from "@/lib/hook/useShareMonth";
import { BottomSheet } from "@expo/ui";
import { StatusBar } from "expo-status-bar";
import X from "lucide-react-native/icons/x";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ElementRef } from "react";
import { useTranslation } from "react-i18next";
import { Modal, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TabView, type TabBarProps } from "react-native-tab-view";
import { ShareActionBar } from "./ShareActionBar";
import { ShareCardScene } from "./ShareCardScene";
import { ShareCardSchemePicker } from "./ShareCardSchemePicker";
import { SharePeriodNavigator } from "./SharePeriodNavigator";
import { ShareSavedPreviewBanner } from "./ShareSavedPreviewBanner";

export type ActivityShareCardProps = Pick<ComponentProps<typeof MonthlyGolfShareCard>, "memberName" | "memberImage">;

type ActivitySharePreviewModalProps = {
    isAvailable: boolean;
    cardProps: ActivityShareCardProps;
    initialDailyValues: ActivityHeatmapValue[];
    availableYears: number[];
    selectedYear: number | "all";
    onClose: () => void;
};

const CARD_PERIODS = ["month", "year"] as const;

export function ActivitySharePreviewModal({
    isAvailable,
    cardProps,
    initialDailyValues,
    availableYears,
    selectedYear,
    onClose,
}: ActivitySharePreviewModalProps) {
    const { colors, resolvedScheme, primaryColorPreference } = useTheme();
    const { t, i18n } = useTranslation();
    const reducedMotion = useReducedMotion();

    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const cardPeriod = CARD_PERIODS[activeTabIndex];
    const [posterScheme, setPosterScheme] = useState<"light" | "dark">(() => resolvedScheme);
    const [hasOpenedPicker, setHasOpenedPicker] = useState(false);
    const [pickerSelection, setPickerSelection] = useState<{
        year: number;
        month: number;
    } | null>(null);
    const [stageWidth, setStageWidth] = useState(0);
    const [readyByPeriod, setReadyByPeriod] = useState<{
        month: boolean;
        year: boolean;
    }>({ month: false, year: false });
    const [failedByPeriod, setFailedByPeriod] = useState<{
        month: string | null;
        year: string | null;
    }>({ month: null, year: null });
    const captureReadyRef = useRef(false);
    const monthlyCardRef = useRef<ElementRef<typeof View>>(null);
    const yearlyCardRef = useRef<ElementRef<typeof View>>(null);
    const activeCardRef = cardPeriod === "month" ? monthlyCardRef : yearlyCardRef;
    const cardWidth = stageWidth > 0 ? Math.min(stageWidth - 32, 340) : 0;
    const cardHeight = cardWidth > 0 ? Math.ceil((SHARE_CARD_HEIGHT * cardWidth) / SHARE_CARD_WIDTH) : 0;
    const stageHeight = cardHeight > 0 ? cardHeight + 44 : 260;

    const {
        year: shareYear,
        month: shareMonth,
        years,
        previousYear,
        nextYear,
        previousMonth,
        nextMonth,
        select,
    } = useShareMonth({
        dailyValues: initialDailyValues,
        availableYears,
        selectedYear,
    });
    const shareActivityQuery = useMemberActivity(shareYear, isAvailable);
    const { data: shareActivity, isLoading, isRefetching, isPlaceholderData, isError, refetch } = shareActivityQuery;
    const shareDailyValues = useMemo(() => mapActivityDays(shareActivity?.daily ?? []), [shareActivity?.daily]);
    const monthlyActivity = shareActivity?.monthly ?? [];

    // Both cards use the selected year's response; the monthly card filters its days.
    const hoursOnCourse =
        monthlyActivity.find((entry) => entry.year === shareYear && entry.month === shareMonth + 1)
            ?.totalReservationHours ?? 0;
    const annualReservations = shareActivity?.totalReservations ?? 0;
    const annualHours = shareActivity?.totalReservationHours ?? 0;

    const canPreview = Boolean(shareActivity) && !isError;
    const sharedCardKey = [
        posterScheme,
        shareYear,
        i18n.language,
        cardProps.memberImage ?? "",
        cardWidth,
        primaryColorPreference,
    ].join("|");
    const monthCardKey = `month|${sharedCardKey}|${shareMonth}|${hoursOnCourse}`;
    const yearCardKey = `year|${sharedCardKey}|${annualReservations}|${annualHours}`;
    const cardKey = cardPeriod === "month" ? monthCardKey : yearCardKey;
    const assetKey = [posterScheme, cardProps.memberImage ?? ""].join("|");
    const isActiveCardReady = readyByPeriod[cardPeriod] && failedByPeriod[cardPeriod] !== assetKey;
    const canSave = canPreview && !isPlaceholderData && isActiveCardReady;
    const loadingValues = !shareActivity || isPlaceholderData;

    useEffect(() => {
        captureReadyRef.current = isActiveCardReady;
    }, [isActiveCardReady]);

    const handleMonthlyReadyChange = useCallback((ready: boolean) => {
        setReadyByPeriod((current) => (current.month === ready ? current : { ...current, month: ready }));
    }, []);
    const handleYearlyReadyChange = useCallback((ready: boolean) => {
        setReadyByPeriod((current) => (current.year === ready ? current : { ...current, year: ready }));
    }, []);
    const handleMonthlyAssetError = useCallback(() => {
        setFailedByPeriod((current) => ({ ...current, month: assetKey }));
    }, [assetKey]);
    const handleYearlyAssetError = useCallback(() => {
        setFailedByPeriod((current) => ({ ...current, year: assetKey }));
    }, [assetKey]);
    const handleRefetch = useCallback(() => {
        void refetch();
    }, [refetch]);

    const { pendingAction, isBusy, exportCard, savedPreviewUri, dismissSavedPreview, openSavedPhoto } =
        useShareCardExport({
            cardRef: activeCardRef,
            captureReadyRef,
            canExport: canSave,
            t,
        });

    const routes = useMemo<SwipeableTabRoute[]>(
        () => [
            { key: "month", title: t("shareCard.monthly") },
            { key: "year", title: t("shareCard.yearly") },
        ],
        [t],
    );

    const handleTabChange = useCallback(
        (nextIndex: number) => {
            if (isBusy || nextIndex === activeTabIndex) {
                return;
            }
            triggerSelectionHaptic();
            setActiveTabIndex(nextIndex);
        },
        [activeTabIndex, isBusy],
    );

    const renderTabBar = useCallback(
        (props: TabBarProps<SwipeableTabRoute>) => (
            <View className="mb-4 w-full max-w-[280px] self-center">
                <SwipeableTabBar {...props} onTabPress={handleTabChange} />
            </View>
        ),
        [handleTabChange],
    );

    useEffect(() => {
        dismissSavedPreview();
    }, [cardKey, dismissSavedPreview]);

    const monthFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(i18n.language, {
                month: "long",
                year: "numeric",
                calendar: "gregory",
                timeZone: "UTC",
            }),
        [i18n.language],
    );
    const monthLabel = (year: number, month: number) => monthFormatter.format(new Date(Date.UTC(year, month, 1)));
    const selectedMonthLabel = monthLabel(shareYear, shareMonth);
    const selectedPeriodLabel = cardPeriod === "year" ? String(shareYear) : selectedMonthLabel;
    const previousPeriod = useMemo(
        () =>
            cardPeriod === "year" && previousYear !== null
                ? { year: previousYear, month: shareMonth }
                : cardPeriod === "month"
                  ? previousMonth
                  : null,
        [cardPeriod, previousMonth, previousYear, shareMonth],
    );
    const nextPeriod = useMemo(
        () =>
            cardPeriod === "year" && nextYear !== null
                ? { year: nextYear, month: shareMonth }
                : cardPeriod === "month"
                  ? nextMonth
                  : null,
        [cardPeriod, nextMonth, nextYear, shareMonth],
    );
    const previousPeriodDisabled = isBusy || isLoading || previousPeriod === null;
    const nextPeriodDisabled = isBusy || isLoading || nextPeriod === null;
    const previousPeriodLabel =
        previousPeriod === null
            ? selectedPeriodLabel
            : cardPeriod === "year"
              ? t("activity.showYear", { year: previousPeriod.year })
              : monthLabel(previousPeriod.year, previousPeriod.month);
    const nextPeriodLabel =
        nextPeriod === null
            ? selectedPeriodLabel
            : cardPeriod === "year"
              ? t("activity.showYear", { year: nextPeriod.year })
              : monthLabel(nextPeriod.year, nextPeriod.month);

    const confirmMonth = (year: number, month: number) => {
        select(year, month);
        setPickerSelection(null);
    };

    const closePreview = () => {
        if (isBusy) return;
        dismissSavedPreview();
        onClose();
        setPickerSelection(null);
    };

    const handleExport = useCallback(
        (action: ShareCardAction) => {
            triggerImpactHaptic();
            void exportCard(action);
        },
        [exportCard],
    );

    const showCard = (isAvailable || isLoading) && (!isError || Boolean(shareActivity)) && cardWidth > 0;

    return (
        <Modal
            visible
            animationType={reducedMotion ? "none" : "slide"}
            presentationStyle="fullScreen"
            onRequestClose={closePreview}
        >
            <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
            {/* Full-screen modal needs its own SafeAreaProvider. */}
            <SafeAreaProvider>
                <Screen
                    scroll
                    headerShown={false}
                    contentInsetAdjustmentBehavior="never"
                    contentClassName="gap-4"
                    bottomPadding={12}
                    footer={
                        <ShareActionBar
                            isBusy={isBusy}
                            canSave={canSave}
                            pendingAction={pendingAction}
                            onAction={handleExport}
                        />
                    }
                >
                    <View className="w-full flex-row items-center justify-between pb-1">
                        <AppText variant="h3" wrap={false}>
                            {t("shareCard.studioTitle")}
                        </AppText>
                        <AnimatedPressable
                            accessibilityRole="button"
                            accessibilityLabel={t("common.closeTitle", {
                                title: t("shareCard.studioTitle"),
                            })}
                            accessibilityState={{ disabled: isBusy }}
                            hitSlop={10}
                            className="min-h-12 min-w-12 items-center justify-center rounded-full bg-muted"
                            disabled={isBusy}
                            onPress={closePreview}
                        >
                            <X size={22} color={colors.mutedForeground} />
                        </AnimatedPressable>
                    </View>

                    {savedPreviewUri ? (
                        <ShareSavedPreviewBanner
                            previewUri={savedPreviewUri}
                            reducedMotion={reducedMotion}
                            onOpenPhoto={() => void openSavedPhoto()}
                            onDismiss={dismissSavedPreview}
                        />
                    ) : null}

                    <View
                        className="w-full items-center gap-4"
                        onLayout={(event) => setStageWidth(event.nativeEvent.layout.width)}
                    >
                        {stageWidth > 0 ? (
                            <TabView
                                lazy
                                renderLazyPlaceholder={() => <View className="flex-1 bg-muted/30" />}
                                animationEnabled={!reducedMotion}
                                swipeEnabled={!isBusy}
                                navigationState={{
                                    index: activeTabIndex,
                                    routes,
                                }}
                                onIndexChange={handleTabChange}
                                renderTabBar={renderTabBar}
                                style={{
                                    width: "100%",
                                    height: stageHeight + 72,
                                }}
                                renderScene={({ route }) => {
                                    const isMonthScene = route.key === "month";
                                    return (
                                        <ShareCardScene
                                            period={isMonthScene ? "month" : "year"}
                                            stageHeight={stageHeight}
                                            showCard={showCard}
                                            cardWidth={cardWidth}
                                            scheme={posterScheme}
                                            cardProps={cardProps}
                                            dailyValues={shareDailyValues}
                                            year={shareYear}
                                            month={shareMonth}
                                            hoursOnCourse={hoursOnCourse}
                                            annualReservations={annualReservations}
                                            annualHours={annualHours}
                                            loadingValues={loadingValues}
                                            isError={isError}
                                            isRefetching={isRefetching}
                                            onRefetch={handleRefetch}
                                            cardRef={isMonthScene ? monthlyCardRef : yearlyCardRef}
                                            onReadyChange={
                                                isMonthScene ? handleMonthlyReadyChange : handleYearlyReadyChange
                                            }
                                            onAssetError={
                                                isMonthScene ? handleMonthlyAssetError : handleYearlyAssetError
                                            }
                                        />
                                    );
                                }}
                            />
                        ) : (
                            <View style={{ height: stageHeight + 72 }} />
                        )}

                        <ShareCardSchemePicker
                            posterScheme={posterScheme}
                            isBusy={isBusy}
                            primaryColorPreference={primaryColorPreference}
                            onSelect={setPosterScheme}
                        />

                        <SharePeriodNavigator
                            previousLabel={previousPeriodLabel}
                            nextLabel={nextPeriodLabel}
                            centerLabel={selectedPeriodLabel}
                            previousDisabled={previousPeriodDisabled}
                            nextDisabled={nextPeriodDisabled}
                            centerDisabled={isBusy || isLoading}
                            centerExpanded={pickerSelection !== null}
                            onPrevious={() => {
                                if (previousPeriod) {
                                    triggerSelectionHaptic();
                                    select(previousPeriod.year, previousPeriod.month);
                                }
                            }}
                            onNext={() => {
                                if (nextPeriod) {
                                    triggerSelectionHaptic();
                                    select(nextPeriod.year, nextPeriod.month);
                                }
                            }}
                            onOpenPicker={() => {
                                triggerSelectionHaptic();
                                setHasOpenedPicker(true);
                                setPickerSelection({
                                    year: shareYear,
                                    month: shareMonth,
                                });
                            }}
                        />
                    </View>
                </Screen>

                {hasOpenedPicker ? (
                    <BottomSheet
                        isPresented={pickerSelection !== null}
                        onDismiss={() => setPickerSelection(null)}
                        containerColor={colors.card}
                        contentColor={colors.foreground}
                        contentPadding={{
                            top: 20,
                            bottom: 24,
                            left: 20,
                            right: 20,
                        }}
                    >
                        <ShareMonthYearPicker
                            year={pickerSelection?.year ?? shareYear}
                            month={pickerSelection?.month ?? shareMonth}
                            yearOnly={cardPeriod === "year"}
                            years={years}
                            onChange={(year, month) =>
                                setPickerSelection((current) => (current ? { year, month } : current))
                            }
                            onConfirm={confirmMonth}
                        />
                    </BottomSheet>
                ) : null}
            </SafeAreaProvider>
        </Modal>
    );
}
