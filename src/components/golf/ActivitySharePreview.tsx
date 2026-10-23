import { NativeText } from "@/design-system/components/NativeText";
import { mapActivityDays } from "@/components/golf/activity-display-data";
import { MonthlyGolfShareCard } from "@/components/golf/MonthlyGolfShareCard";
import { YearlyShareCard } from "@/components/golf/YearlyShareCard";
import { ShareMonthYearPicker } from "@/components/golf/ShareMonthYearPicker";
import { SHARE_CARD_CORNER_RADIUS, SHARE_CARD_WIDTH } from "@/components/golf/monthly-share-card-layout";
import { Screen, useTheme } from "@/design-system";

import type { ActivityHeatmapValue } from "@/design-system/components/charts/activity-chart-data";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@expo/ui";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, Modal, Pressable, StatusBar, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { ShareCardAction, useShareCardExport } from "@/hooks/useShareCardExport";
import { useShareMonth } from "@/hooks/useShareMonth";
import { useMemberActivity } from "@/lib/hook/useMemberActivity";

type ActivitySharePreviewProps = {
    isAvailable: boolean;
    cardProps: Pick<ComponentProps<typeof MonthlyGolfShareCard>, "memberName" | "memberImage">;
    initialDailyValues: ActivityHeatmapValue[];
    availableYears: number[];
    selectedYear: number | "all";
};

const ACTIONS: ShareCardAction[] = ["share", "save"];

// Preview state stays here so opening, closing and saving do not rerender the
// activity screen and rebuild its chart ranges during the modal transition.
export function ActivitySharePreview({
    isAvailable,
    cardProps,
    initialDailyValues,
    availableYears,
    selectedYear,
}: ActivitySharePreviewProps) {
    const { colors, resolvedScheme, primaryColorPreference } = useTheme();
    const { t, i18n } = useTranslation();
    const reducedMotion = useReducedMotion();

    const [showShareCard, setShowShareCard] = useState(false);
    const [cardPeriod, setCardPeriod] = useState<"month" | "year">("month");
    const [pickerSelection, setPickerSelection] = useState<{ year: number; month: number } | null>(null);
    const [cardWidth, setCardWidth] = useState(0);
    const [readyCardKey, setReadyCardKey] = useState<string | null>(null);
    const [failedCardKey, setFailedCardKey] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const captureReadyRef = useRef(false);
    const shareCardRef = useRef<React.ElementRef<typeof View>>(null);

    const { year: shareYear, month: shareMonth, years, previousYear, nextYear, previousMonth, nextMonth, select } = useShareMonth({
        dailyValues: initialDailyValues,
        availableYears,
        selectedYear,
    });
    const shareActivityQuery = useMemberActivity(shareYear, showShareCard && isAvailable);
    const { data: shareActivity, isLoading, isRefetching, isError, refetch } = shareActivityQuery;
    const shareDailyValues = useMemo(
        () => mapActivityDays(shareActivity?.daily ?? []),
        [shareActivity?.daily],
    );
    const monthlyActivity = shareActivity?.monthly ?? [];

    // Both cards use the selected year's response; the monthly card filters its days.
    const hoursOnCourse = monthlyActivity.find(
        (entry) => entry.year === shareYear && entry.month === shareMonth + 1,
    )?.totalReservationHours ?? 0;
    const annualReservations = shareActivity?.totalReservations ?? 0;
    const annualHours = shareActivity?.totalReservationHours ?? 0;

    const canPreview = Boolean(shareActivity) && !isError;
    const cardKey = [cardPeriod, shareYear, shareMonth, hoursOnCourse, annualReservations, annualHours,
        i18n.language, cardProps.memberImage ?? "", cardWidth,
        resolvedScheme, primaryColorPreference, retryCount].join("|");
    const assetKey = [cardProps.memberImage ?? "", resolvedScheme, retryCount].join("|");
    const canSave = canPreview && !isRefetching && readyCardKey === cardKey && failedCardKey !== cardKey;
    const loadingValues = !shareActivity || isRefetching;

    const handleReadyChange = useCallback((ready: boolean) => {
        captureReadyRef.current = ready;
        setReadyCardKey(ready ? cardKey : null);
    }, [cardKey]);
    const handleAssetError = useCallback(() => setFailedCardKey(cardKey), [cardKey]);

    const { pendingAction, isBusy, exportCard, savedPreviewUri, dismissSavedPreview, openSavedPhoto } = useShareCardExport({
        cardRef: shareCardRef,
        captureReadyRef,
        canExport: canSave,
        t,
    });

    useEffect(() => {
        dismissSavedPreview();
    }, [cardKey, dismissSavedPreview]);

    const monthFormatter = useMemo(
        () => new Intl.DateTimeFormat(i18n.language, { month: "long", year: "numeric", calendar: "gregory", timeZone: "UTC" }),
        [i18n.language],
    );
    const monthLabel = (year: number, month: number) => monthFormatter.format(new Date(Date.UTC(year, month, 1)));
    const selectedMonthLabel = monthLabel(shareYear, shareMonth);
    const selectedPeriodLabel = cardPeriod === "year" ? String(shareYear) : selectedMonthLabel;
    const previousPeriod = cardPeriod === "year" && previousYear !== null
        ? { year: previousYear, month: shareMonth } : cardPeriod === "month" ? previousMonth : null;
    const nextPeriod = cardPeriod === "year" && nextYear !== null
        ? { year: nextYear, month: shareMonth } : cardPeriod === "month" ? nextMonth : null;
    const previousPeriodDisabled = isBusy || isLoading || previousPeriod === null;
    const nextPeriodDisabled = isBusy || isLoading || nextPeriod === null;
    const previousPeriodLabel = previousPeriod === null ? selectedPeriodLabel : cardPeriod === "year"
        ? t("activity.showYear", { year: previousPeriod.year })
        : monthLabel(previousPeriod.year, previousPeriod.month);
    const nextPeriodLabel = nextPeriod === null ? selectedPeriodLabel : cardPeriod === "year"
        ? t("activity.showYear", { year: nextPeriod.year })
        : monthLabel(nextPeriod.year, nextPeriod.month);

    const confirmMonth = (year: number, month: number) => {
        select(year, month);
        setPickerSelection(null);
    };

    const previewOptions = useMemo(() => ({
        headerRight: () => (
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("activity.preview")}
                accessibilityState={{ disabled: !isAvailable }}
                disabled={!isAvailable}
                className="min-h-12 min-w-12 items-center justify-center"
                onPress={() => setShowShareCard(true)}
            >
                <Ionicons
                    name={process.env.EXPO_OS === "ios" ? "share-outline" : "share-social-outline"}
                    size={22}
                    color={colors.mutedForeground}
                />
            </Pressable>
        ),
    }), [colors.mutedForeground, isAvailable, t]);

    const closePreview = () => {
        if (isBusy) return;
        dismissSavedPreview();
        setShowShareCard(false);
        setPickerSelection(null);
    };

    const actionLabel = (action: ShareCardAction) => {
        const pending = pendingAction === action;
        if (action === "share") return t(pending ? "shareCard.sharing" : "shareCard.share");
        return t(pending ? "activity.saving" : "activity.save");
    };

    return (
        <>
            <Stack.Screen options={previewOptions} />
            <Modal
                visible={showShareCard}
                animationType={reducedMotion ? "none" : "slide"}
                presentationStyle="fullScreen"
                onRequestClose={closePreview}
            >
                <StatusBar
                    barStyle={resolvedScheme === "dark" ? "light-content" : "dark-content"}
                />
                <Screen
                    scroll
                    headerShown={false}
                    contentClassName="gap-4"
                    bottomPadding={12}
                    footer={
                        <View className="gap-3 pb-3 pt-3" accessibilityState={{ busy: isBusy }}>
                            {savedPreviewUri ? (
                                <View className="absolute inset-x-0 z-10 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3"
                                    style={{ bottom: "100%", marginBottom: 12,
                                        boxShadow: resolvedScheme === "dark"
                                            ? "0 8px 24px rgba(0, 0, 0, 0.45)" : "0 8px 24px rgba(11, 27, 56, 0.18)" }}>
                                    <Pressable accessibilityRole="button" accessibilityLabel={t("activity.viewSavedPhoto")}
                                        className="min-w-0 min-h-12 flex-1 flex-row items-center gap-3"
                                        onPress={() => void openSavedPhoto()}>
                                        <Image source={{ uri: savedPreviewUri }} resizeMode="cover" accessible={false}
                                            style={{ width: 56, height: 70, borderRadius: 8, backgroundColor: colors.muted }} />
                                        <View className="min-w-0 flex-1 gap-1">
                                            <View className="flex-row items-center gap-1.5">
                                                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                                <NativeText variant="label" wrap={false} accessibilityLiveRegion="polite">
                                                    {t("activity.savedTitle")}
                                                </NativeText>
                                            </View>
                                            <NativeText variant="subtext" color="mutedForeground">
                                                {t("activity.savedMessage")}
                                            </NativeText>
                                        </View>
                                    </Pressable>
                                    <Pressable accessibilityRole="button"
                                        accessibilityLabel={t("common.closeTitle", { title: t("activity.savedTitle") })}
                                        className="min-h-12 min-w-12 items-center justify-center rounded-full bg-muted"
                                        onPress={dismissSavedPreview}>
                                        <Ionicons name="close" size={20} color={colors.mutedForeground} />
                                    </Pressable>
                                </View>
                            ) : null}
                            {isBusy ? (
                                <ActivityIndicator
                                    color={colors.primary}
                                    accessibilityLabel={t(pendingAction === "share" ? "shareCard.sharing" : pendingAction === "save" ? "activity.saving" : "activity.loading")}
                                />
                            ) : null}
                            <View className="flex-row gap-3">
                                {ACTIONS.map(action => {
                                    const filled = action === "share";
                                    return (
                                        <Pressable
                                            key={action}
                                            accessibilityRole="button"
                                            accessibilityState={{ disabled: isBusy || !canSave, busy: pendingAction === action }}
                                            disabled={isBusy || !canSave}
                                            onPress={() => void exportCard(action)}
                                            className={`min-h-12 min-w-0 flex-1 flex-row items-center justify-center gap-3 rounded-xl px-4 disabled:opacity-50 ${filled ? "bg-primary" : "bg-muted"}`}
                                        >
                                            <Ionicons
                                                name={filled ? "share-outline" : "download-outline"}
                                                size={21}
                                                color={filled ? colors.primaryForeground : colors.foreground}
                                            />
                                            <NativeText variant="label" color={filled ? "primaryForeground" : "foreground"} wrap={false}>
                                                {actionLabel(action)}
                                            </NativeText>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    }
                >
                    <View className="w-full flex-row items-center justify-between pb-1">
                        <NativeText variant="h3" wrap={false}>
                            {t("activity.preview")}
                        </NativeText>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t("common.closeTitle", { title: t("activity.preview") })}
                            accessibilityState={{ disabled: isBusy }}
                            hitSlop={10}
                            className="min-h-12 min-w-12 items-center justify-center rounded-full bg-muted"
                            disabled={isBusy}
                            onPress={closePreview}
                        >
                            <Ionicons name="close" size={24} color={colors.mutedForeground} />
                        </Pressable>
                    </View>

                    <View className="w-full grow items-center justify-center gap-4 py-4">
                        <View className="flex-row rounded-full bg-muted p-1" accessibilityRole="tablist">
                            {(["month", "year"] as const).map(period => (
                                <Pressable key={period} accessibilityRole="tab"
                                    accessibilityState={{ selected: cardPeriod === period, disabled: isBusy }}
                                    disabled={isBusy} onPress={() => setCardPeriod(period)}
                                    className={`min-h-12 min-w-28 items-center justify-center rounded-full px-5 ${cardPeriod === period ? "bg-primary" : ""}`}>
                                    <NativeText variant="label" color={cardPeriod === period ? "primaryForeground" : "foreground"} wrap={false}>
                                        {t(period === "month" ? "shareCard.monthly" : "shareCard.yearly")}
                                    </NativeText>
                                </Pressable>
                            ))}
                        </View>
                        <View
                            className="w-full items-center py-2"
                            onLayout={event => setCardWidth(Math.min(event.nativeEvent.layout.width - 8, 360))}
                        >
                            {(isAvailable || isLoading) && (!isError || shareActivity) && cardWidth > 0 ? (
                                <View style={{ borderRadius: SHARE_CARD_CORNER_RADIUS * cardWidth / SHARE_CARD_WIDTH,
                                    boxShadow: resolvedScheme === "dark"
                                        ? "0 12px 32px rgba(0, 0, 0, 0.55)" : "0 12px 32px rgba(11, 27, 56, 0.20)" }}>
                                    {cardPeriod === "month" ? (
                                        <MonthlyGolfShareCard key={assetKey} ref={shareCardRef} {...cardProps}
                                            dailyValues={shareDailyValues}
                                            year={shareYear} month={shareMonth} hoursOnCourse={hoursOnCourse}
                                            loadingValues={loadingValues} width={cardWidth}
                                            onReadyChange={handleReadyChange} onAssetError={handleAssetError} />
                                    ) : (
                                        <YearlyShareCard key={assetKey} ref={shareCardRef} {...cardProps}
                                            dailyValues={shareDailyValues}
                                            year={shareYear} totalReservations={annualReservations}
                                            hoursPlayed={annualHours} loadingValues={loadingValues} width={cardWidth}
                                            onReadyChange={handleReadyChange} onAssetError={handleAssetError} />
                                    )}
                                </View>
                            ) : (
                                <View className="w-full items-center gap-3 py-12">
                                    <NativeText variant="h3" align="center">
                                        {t(isError ? "activity.couldNotLoad" : "activity.emptyTitle")}
                                    </NativeText>
                                    <NativeText variant="subtext" color="mutedForeground" align="center">
                                        {t(isError ? "common.pullToRefreshAndTryAgain" : "activity.emptyMessage")}
                                    </NativeText>
                                    {isError ? (
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityState={{ disabled: isRefetching, busy: isRefetching }}
                                            disabled={isRefetching}
                                            className="min-h-12 items-center justify-center rounded-xl bg-primary px-5 disabled:opacity-60"
                                            onPress={() => { void refetch(); }}
                                        >
                                            <NativeText variant="label" color="primaryForeground" wrap={false}>
                                                {t(isRefetching ? "common.refreshing" : "common.refreshTryAgain")}
                                            </NativeText>
                                        </Pressable>
                                    ) : null}
                                </View>
                            )}
                        </View>

                        {failedCardKey === cardKey ? (
                            <Pressable
                                accessibilityRole="button"
                                className="min-h-12 items-center justify-center"
                                onPress={() => setRetryCount(value => value + 1)}
                            >
                                <NativeText variant="subtext" color="danger" align="center">
                                    {t("common.refreshTryAgain")}
                                </NativeText>
                            </Pressable>
                        ) : null}

                        <View className="w-full flex-row items-center justify-center gap-4 pt-1">
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={previousPeriodLabel}
                                accessibilityState={{ disabled: previousPeriodDisabled }}
                                disabled={previousPeriodDisabled}
                                className="min-h-12 min-w-12 items-center justify-center rounded-full bg-muted disabled:opacity-40"
                                onPress={() => { if (previousPeriod) select(previousPeriod.year, previousPeriod.month); }}
                            >
                                <Ionicons name="chevron-back" size={22} color={colors.foreground} />
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={selectedPeriodLabel}
                                accessibilityState={{ expanded: pickerSelection !== null, disabled: isBusy || isLoading }}
                                disabled={isBusy || isLoading}
                                className="min-h-12 flex-row items-center justify-center gap-2 rounded-full bg-muted px-4"
                                onPress={() => setPickerSelection({ year: shareYear, month: shareMonth })}
                            >
                                <Ionicons name="calendar-outline" size={19} color={colors.foreground} />
                                <NativeText variant="label" wrap={false}>{selectedPeriodLabel}</NativeText>
                                <Ionicons name="chevron-down" size={17} color={colors.foreground} />
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={nextPeriodLabel}
                                accessibilityState={{ disabled: nextPeriodDisabled }}
                                disabled={nextPeriodDisabled}
                                className="min-h-12 min-w-12 items-center justify-center rounded-full bg-muted disabled:opacity-40"
                                onPress={() => { if (nextPeriod) select(nextPeriod.year, nextPeriod.month); }}
                            >
                                <Ionicons name="chevron-forward" size={22} color={colors.foreground} />
                            </Pressable>
                        </View>
                    </View>
                </Screen>

                <BottomSheet
                    isPresented={pickerSelection !== null}
                    onDismiss={() => setPickerSelection(null)}
                    containerColor={colors.card}
                    contentColor={colors.foreground}
                    contentPadding={{ top: 20, bottom: 24, left: 20, right: 20 }}
                >
                    <ShareMonthYearPicker
                        year={pickerSelection?.year ?? shareYear}
                        month={pickerSelection?.month ?? shareMonth}
                        yearOnly={cardPeriod === "year"}
                        years={years}
                        onChange={(year, month) => setPickerSelection(current => current ? { year, month } : current)}
                        onConfirm={confirmMonth}
                    />
                </BottomSheet>
            </Modal>
        </>
    );
}
