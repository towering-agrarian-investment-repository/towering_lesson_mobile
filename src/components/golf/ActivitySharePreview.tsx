import { mapActivityDays } from "@/components/golf/activity-display-data";
import { MonthlyGolfShareCard } from "@/components/golf/MonthlyGolfShareCard";
import {
    SHARE_CARD_CORNER_RADIUS,
    SHARE_CARD_HEIGHT,
    SHARE_CARD_WIDTH,
} from "@/components/golf/monthly-share-card-layout";
import { ShareMonthYearPicker } from "@/components/golf/ShareMonthYearPicker";
import { YearlyShareCard } from "@/components/golf/YearlyShareCard";
import {
    AnimatedPressable,
    AppText,
    cn,
    getThemeColors,
    Screen,
    SwipeableTabBar,
    type SwipeableTabRoute,
    triggerImpactHaptic,
    triggerSelectionHaptic,
    useTheme,
} from "@/design-system";
import type { ActivityHeatmapValue } from "@/design-system/components/charts/activity-chart-data";
import { ShareCardAction, useShareCardExport } from "@/lib/hook/useShareCardExport";
import { useShareMonth } from "@/lib/hook/useShareMonth";
import { useMemberActivity } from "@/lib/hook/useMemberActivity";
import { BottomSheet } from "@expo/ui";
import { Stack } from "expo-router";
import {
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Share,
    Share2,
    X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Modal, View } from "react-native";
import Animated, { FadeIn, FadeOut, useReducedMotion } from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TabView, type TabBarProps } from "react-native-tab-view";

type ActivitySharePreviewProps = {
    isAvailable: boolean;
    cardProps: Pick<ComponentProps<typeof MonthlyGolfShareCard>, "memberName" | "memberImage">;
    initialDailyValues: ActivityHeatmapValue[];
    availableYears: number[];
    selectedYear: number | "all";
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

const ACTIONS: ShareCardAction[] = ["share", "save"];
const CARD_PERIODS = ["month", "year"] as const;
const POSTER_SCHEMES = ["light", "dark"] as const;

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

function ActivitySharePreviewModal({
    isAvailable,
    cardProps,
    initialDailyValues,
    availableYears,
    selectedYear,
    onClose,
}: Omit<ActivitySharePreviewProps, "open" | "onOpenChange"> & {
    onClose: () => void;
}) {
    const { colors, resolvedScheme, primaryColorPreference } = useTheme();
    const { t, i18n } = useTranslation();
    const reducedMotion = useReducedMotion();

    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const cardPeriod = CARD_PERIODS[activeTabIndex];
    const [posterScheme, setPosterScheme] = useState<"light" | "dark">(() => resolvedScheme);
    const [pickerSelection, setPickerSelection] = useState<{
        year: number;
        month: number;
    } | null>(null);
    const [stageWidth, setStageWidth] = useState(0);
    const [readyByPeriod, setReadyByPeriod] = useState<{
        month: string | null;
        year: string | null;
    }>({ month: null, year: null });
    const [failedByPeriod, setFailedByPeriod] = useState<{
        month: string | null;
        year: string | null;
    }>({ month: null, year: null });
    const captureReadyRef = useRef(false);
    const monthlyCardRef = useRef<React.ElementRef<typeof View>>(null);
    const yearlyCardRef = useRef<React.ElementRef<typeof View>>(null);
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
    const baseCardKey = [
        posterScheme,
        shareYear,
        shareMonth,
        hoursOnCourse,
        annualReservations,
        annualHours,
        i18n.language,
        cardProps.memberImage ?? "",
        cardWidth,
        primaryColorPreference,
    ].join("|");
    const monthCardKey = `month|${baseCardKey}`;
    const yearCardKey = `year|${baseCardKey}`;
    const cardKey = cardPeriod === "month" ? monthCardKey : yearCardKey;
    const assetKey = [posterScheme, cardProps.memberImage ?? ""].join("|");
    const isActiveCardReady = readyByPeriod[cardPeriod] === cardKey && failedByPeriod[cardPeriod] !== cardKey;
    const canSave = canPreview && !isPlaceholderData && isActiveCardReady;
    const loadingValues = !shareActivity || isPlaceholderData;

    useEffect(() => {
        captureReadyRef.current = isActiveCardReady;
    }, [isActiveCardReady]);

    const handleMonthlyReadyChange = useCallback(
        (ready: boolean) => {
            setReadyByPeriod((current) => ({
                ...current,
                month: ready ? monthCardKey : null,
            }));
        },
        [monthCardKey],
    );
    const handleYearlyReadyChange = useCallback(
        (ready: boolean) => {
            setReadyByPeriod((current) => ({
                ...current,
                year: ready ? yearCardKey : null,
            }));
        },
        [yearCardKey],
    );
    const handleMonthlyAssetError = useCallback(() => {
        setFailedByPeriod((current) => ({ ...current, month: monthCardKey }));
    }, [monthCardKey]);
    const handleYearlyAssetError = useCallback(() => {
        setFailedByPeriod((current) => ({ ...current, year: yearCardKey }));
    }, [yearCardKey]);

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

    const actionLabel = (action: ShareCardAction) => {
        const pending = pendingAction === action;
        if (action === "share") {
            return t(pending ? "shareCard.sharing" : "shareCard.share");
        }
        return t(pending ? "activity.saving" : "activity.save");
    };

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
                        <View className="flex-row gap-3" accessibilityState={{ busy: isBusy }}>
                            {ACTIONS.map((action) => {
                                const filled = action === "share";
                                const isActionPending = pendingAction === action;
                                const contentColor = filled ? colors.primaryForeground : colors.foreground;
                                return (
                                    <AnimatedPressable
                                        key={action}
                                        accessibilityRole="button"
                                        accessibilityState={{
                                            disabled: isBusy || !canSave,
                                            busy: isActionPending,
                                        }}
                                        disabled={isBusy || !canSave}
                                        onPress={() => {
                                            triggerImpactHaptic();
                                            void exportCard(action);
                                        }}
                                        className={cn(
                                            "min-h-12 min-w-0 flex-1 flex-row items-center justify-center gap-2.5 rounded-xl px-4 disabled:opacity-50",
                                            filled ? "bg-primary" : "border border-border bg-card",
                                        )}
                                    >
                                        {isActionPending ? (
                                            <ActivityIndicator size="small" color={contentColor} />
                                        ) : filled ? (
                                            <Share size={18} color={contentColor} />
                                        ) : (
                                            <Download size={18} color={contentColor} />
                                        )}
                                        <AppText
                                            variant="label"
                                            color={filled ? "primaryForeground" : "foreground"}
                                            wrap={false}
                                        >
                                            {actionLabel(action)}
                                        </AppText>
                                    </AnimatedPressable>
                                );
                            })}
                        </View>
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
                        <Animated.View
                            entering={reducedMotion ? undefined : FadeIn.duration(150)}
                            exiting={reducedMotion ? undefined : FadeOut.duration(120)}
                            className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3"
                        >
                            <AnimatedPressable
                                accessibilityRole="button"
                                accessibilityLabel={t("activity.viewSavedPhoto")}
                                haptic="selection"
                                className="min-h-12 min-w-0 flex-1 flex-row items-center gap-3"
                                onPress={() => void openSavedPhoto()}
                            >
                                <Image
                                    source={{ uri: savedPreviewUri }}
                                    contentFit="cover"
                                    cachePolicy="none"
                                    transition={reducedMotion ? 0 : 150}
                                    accessible={false}
                                    style={{
                                        width: 48,
                                        height: 60,
                                        borderRadius: 8,
                                        backgroundColor: colors.muted,
                                    }}
                                />
                                <View className="min-w-0 flex-1 gap-0.5">
                                    <View className="flex-row items-center gap-1.5">
                                        <CheckCircle2 size={18} color={colors.primary} />
                                        <AppText variant="label" wrap={false} accessibilityLiveRegion="polite">
                                            {t("activity.savedTitle")}
                                        </AppText>
                                    </View>
                                    <AppText variant="subtext" color="mutedForeground">
                                        {t("activity.savedMessage")}
                                    </AppText>
                                </View>
                            </AnimatedPressable>
                            <AnimatedPressable
                                accessibilityRole="button"
                                accessibilityLabel={t("common.closeTitle", {
                                    title: t("activity.savedTitle"),
                                })}
                                haptic="selection"
                                className="min-h-12 min-w-12 items-center justify-center rounded-full bg-muted"
                                onPress={dismissSavedPreview}
                            >
                                <X size={18} color={colors.mutedForeground} />
                            </AnimatedPressable>
                        </Animated.View>
                    ) : null}

                    <View
                        className="w-full items-center gap-4"
                        onLayout={(event) => setStageWidth(event.nativeEvent.layout.width)}
                    >
                        {stageWidth > 0 ? (
                            <TabView
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
                                renderScene={({ route }) => (
                                    <View
                                        className="w-full items-center justify-center overflow-hidden rounded-3xl bg-surface px-4 py-5"
                                        style={{ height: stageHeight }}
                                    >
                                        {(isAvailable || isLoading) && (!isError || shareActivity) && cardWidth > 0 ? (
                                            <View
                                                className="overflow-hidden border border-border/70"
                                                style={{
                                                    borderRadius:
                                                        (SHARE_CARD_CORNER_RADIUS * cardWidth) / SHARE_CARD_WIDTH,
                                                }}
                                            >
                                                {route.key === "month" ? (
                                                    <MonthlyGolfShareCard
                                                        key={assetKey}
                                                        ref={monthlyCardRef}
                                                        {...cardProps}
                                                        scheme={posterScheme}
                                                        dailyValues={shareDailyValues}
                                                        year={shareYear}
                                                        month={shareMonth}
                                                        hoursOnCourse={hoursOnCourse}
                                                        loadingValues={loadingValues}
                                                        width={cardWidth}
                                                        onReadyChange={handleMonthlyReadyChange}
                                                        onAssetError={handleMonthlyAssetError}
                                                    />
                                                ) : (
                                                    <YearlyShareCard
                                                        key={assetKey}
                                                        ref={yearlyCardRef}
                                                        {...cardProps}
                                                        scheme={posterScheme}
                                                        dailyValues={shareDailyValues}
                                                        year={shareYear}
                                                        totalReservations={annualReservations}
                                                        hoursPlayed={annualHours}
                                                        loadingValues={loadingValues}
                                                        width={cardWidth}
                                                        onReadyChange={handleYearlyReadyChange}
                                                        onAssetError={handleYearlyAssetError}
                                                    />
                                                )}
                                            </View>
                                        ) : (
                                            <View className="w-full items-center gap-3 py-12">
                                                <AppText variant="h3" align="center">
                                                    {t(isError ? "activity.couldNotLoad" : "activity.emptyTitle")}
                                                </AppText>
                                                <AppText variant="subtext" color="mutedForeground" align="center">
                                                    {t(
                                                        isError
                                                            ? "common.pullToRefreshAndTryAgain"
                                                            : "activity.emptyMessage",
                                                    )}
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
                                                        onPress={() => {
                                                            void refetch();
                                                        }}
                                                    >
                                                        <AppText variant="label" color="primaryForeground" wrap={false}>
                                                            {t(
                                                                isRefetching
                                                                    ? "common.refreshing"
                                                                    : "common.refreshTryAgain",
                                                            )}
                                                        </AppText>
                                                    </AnimatedPressable>
                                                ) : null}
                                            </View>
                                        )}
                                    </View>
                                )}
                            />
                        ) : (
                            <View style={{ height: stageHeight + 72 }} />
                        )}

                        <View className="flex-row items-center justify-center gap-5">
                            {POSTER_SCHEMES.map((schemeOption) => {
                                const isSelected = posterScheme === schemeOption;
                                const swatchColors = getThemeColors(schemeOption, primaryColorPreference);
                                const schemeLabel = t(`profile.${schemeOption}`);
                                return (
                                    <AnimatedPressable
                                        key={schemeOption}
                                        accessibilityRole="button"
                                        accessibilityLabel={schemeLabel}
                                        accessibilityState={{
                                            selected: isSelected,
                                            disabled: isBusy,
                                        }}
                                        disabled={isBusy}
                                        onPress={() => {
                                            if (isBusy || isSelected) {
                                                return;
                                            }
                                            triggerSelectionHaptic();
                                            setPosterScheme(schemeOption);
                                        }}
                                        className="min-h-12 items-center gap-1.5 px-2 disabled:opacity-60"
                                    >
                                        <View
                                            className={cn(
                                                "h-9 w-9 items-center justify-center rounded-full border-2 p-0.5",
                                                isSelected ? "border-primary" : "border-border",
                                            )}
                                        >
                                            <View
                                                className="h-full w-full flex-row overflow-hidden rounded-full"
                                                style={{
                                                    transform: [
                                                        {
                                                            rotate: "-35deg",
                                                        },
                                                    ],
                                                }}
                                            >
                                                <View
                                                    className="flex-1"
                                                    style={{
                                                        backgroundColor: swatchColors.card,
                                                    }}
                                                />
                                                <View
                                                    className="flex-1"
                                                    style={{
                                                        backgroundColor: swatchColors.primary,
                                                    }}
                                                />
                                            </View>
                                        </View>
                                        <AppText
                                            variant="badge"
                                            color={isSelected ? "foreground" : "mutedForeground"}
                                            wrap={false}
                                            textStyle={{
                                                fontWeight: isSelected ? "700" : "500",
                                            }}
                                        >
                                            {schemeLabel}
                                        </AppText>
                                    </AnimatedPressable>
                                );
                            })}
                        </View>

                        <View className="w-full flex-row items-center justify-center gap-3">
                            <AnimatedPressable
                                accessibilityRole="button"
                                accessibilityLabel={previousPeriodLabel}
                                accessibilityState={{
                                    disabled: previousPeriodDisabled,
                                }}
                                disabled={previousPeriodDisabled}
                                className="min-h-12 min-w-12 items-center justify-center rounded-full bg-surface disabled:opacity-40"
                                onPress={() => {
                                    if (previousPeriod) {
                                        triggerSelectionHaptic();
                                        select(previousPeriod.year, previousPeriod.month);
                                    }
                                }}
                            >
                                <ChevronLeft size={20} color={colors.foreground} />
                            </AnimatedPressable>
                            <AnimatedPressable
                                accessibilityRole="button"
                                accessibilityLabel={selectedPeriodLabel}
                                accessibilityState={{
                                    expanded: pickerSelection !== null,
                                    disabled: isBusy || isLoading,
                                }}
                                disabled={isBusy || isLoading}
                                className="min-h-12 flex-row items-center justify-center gap-2 rounded-full bg-surface px-4"
                                onPress={() => {
                                    triggerSelectionHaptic();
                                    setPickerSelection({
                                        year: shareYear,
                                        month: shareMonth,
                                    });
                                }}
                            >
                                <Calendar size={18} color={colors.foreground} />
                                <AppText variant="label" wrap={false}>
                                    {selectedPeriodLabel}
                                </AppText>
                                <ChevronDown size={16} color={colors.foreground} />
                            </AnimatedPressable>
                            <AnimatedPressable
                                accessibilityRole="button"
                                accessibilityLabel={nextPeriodLabel}
                                accessibilityState={{
                                    disabled: nextPeriodDisabled,
                                }}
                                disabled={nextPeriodDisabled}
                                className="min-h-12 min-w-12 items-center justify-center rounded-full bg-surface disabled:opacity-40"
                                onPress={() => {
                                    if (nextPeriod) {
                                        triggerSelectionHaptic();
                                        select(nextPeriod.year, nextPeriod.month);
                                    }
                                }}
                            >
                                <ChevronRight size={20} color={colors.foreground} />
                            </AnimatedPressable>
                        </View>
                    </View>
                </Screen>

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
            </SafeAreaProvider>
        </Modal>
    );
}
