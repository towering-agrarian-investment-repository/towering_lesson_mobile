import { NativeText } from "@/design-system/components/NativeText";
import { MonthlyGolfShareCard } from "@/components/golf/MonthlyGolfShareCard";
import { ShareMonthYearPicker } from "@/components/golf/ShareMonthYearPicker";
import { SHARE_CARD_CORNER_RADIUS, SHARE_CARD_WIDTH } from "@/components/golf/monthly-share-card-layout";
import { Screen, useTheme } from "@/design-system";

import type { MonthlyActivity } from "@/types/member-activity";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@expo/ui";
import { Stack } from "expo-router";
import { useCallback, useMemo, useRef, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, Pressable, StatusBar, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { ShareCardAction, useShareCardExport } from "@/hooks/useShareCardExport";
import { useShareMonth } from "@/hooks/useShareMonth";

type ActivitySharePreviewProps = {
    isAvailable: boolean;
    isLoading: boolean;
    isRefetching: boolean;
    isError: boolean;
    onRetry: () => void;
    cardProps: Pick<ComponentProps<typeof MonthlyGolfShareCard>, "dailyValues" | "memberName" | "memberImage">;
    monthlyActivity: MonthlyActivity[];
    availableYears: number[];
    selectedYear: number | "all";
};

const ACTIONS: ShareCardAction[] = ["share", "save"];

// Preview state stays here so opening, closing and saving do not rerender the
// activity screen and rebuild its chart ranges during the modal transition.
export function ActivitySharePreview({
    isAvailable,
    isLoading,
    isRefetching,
    isError,
    onRetry,
    cardProps,
    monthlyActivity,
    availableYears,
    selectedYear,
}: ActivitySharePreviewProps) {
    const { colors, resolvedScheme, primaryColorPreference } = useTheme();
    const { t, i18n } = useTranslation();
    const reducedMotion = useReducedMotion();

    const [showShareCard, setShowShareCard] = useState(false);
    const [pickerSelection, setPickerSelection] = useState<{ year: number; month: number } | null>(null);
    const [cardWidth, setCardWidth] = useState(0);
    const [readyCardKey, setReadyCardKey] = useState<string | null>(null);
    const [failedCardKey, setFailedCardKey] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const captureReadyRef = useRef(false);
    const shareCardRef = useRef<React.ElementRef<typeof View>>(null);

    const { year: shareYear, month: shareMonth, years, select, step } = useShareMonth({
        dailyValues: cardProps.dailyValues,
        availableYears,
        selectedYear,
    });

    // The card filters dailyValues to the selected month itself.
    const hoursOnCourse = monthlyActivity.find(
        (entry) => entry.year === shareYear && entry.month === shareMonth + 1,
    )?.totalReservationHours ?? 0;

    const canPreview = isAvailable && !isLoading && !isError;
    const cardKey = [shareYear, shareMonth, hoursOnCourse, i18n.language, cardProps.memberImage ?? "", cardWidth,
        resolvedScheme, primaryColorPreference, retryCount].join("|");
    const canSave = canPreview && !isRefetching && readyCardKey === cardKey && failedCardKey !== cardKey;
    const loadingValues = isLoading || isRefetching || (canPreview && readyCardKey !== cardKey && failedCardKey !== cardKey);

    const handleReadyChange = useCallback((ready: boolean) => {
        captureReadyRef.current = ready;
        setReadyCardKey(ready ? cardKey : null);
    }, [cardKey]);

    const { pendingAction, isBusy, exportCard } = useShareCardExport({
        cardRef: shareCardRef,
        captureReadyRef,
        canExport: canSave,
        t,
    });

    const monthFormatter = useMemo(
        () => new Intl.DateTimeFormat(i18n.language, { month: "long", year: "numeric", calendar: "gregory", timeZone: "UTC" }),
        [i18n.language],
    );
    const monthLabel = (year: number, month: number) => monthFormatter.format(new Date(Date.UTC(year, month, 1)));
    const selectedMonthLabel = monthLabel(shareYear, shareMonth);

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
                        <View
                            className="w-full items-center py-2"
                            onLayout={event => setCardWidth(Math.min(event.nativeEvent.layout.width - 8, 360))}
                        >
                            {(isAvailable || isLoading) && cardWidth > 0 ? (
                                <View style={{ borderRadius: SHARE_CARD_CORNER_RADIUS * cardWidth / SHARE_CARD_WIDTH,
                                    boxShadow: resolvedScheme === "dark"
                                        ? "0 12px 32px rgba(0, 0, 0, 0.55)" : "0 12px 32px rgba(11, 27, 56, 0.20)" }}>
                                    <MonthlyGolfShareCard
                                        key={cardKey}
                                        ref={shareCardRef}
                                        {...cardProps}
                                        year={shareYear}
                                        month={shareMonth}
                                        hoursOnCourse={hoursOnCourse}
                                        loadingValues={loadingValues}
                                        width={cardWidth}
                                        onReadyChange={handleReadyChange}
                                        onAssetError={() => setFailedCardKey(cardKey)}
                                    />
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
                                            onPress={onRetry}
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
                                accessibilityLabel={monthLabel(shareYear, shareMonth - 1)}
                                accessibilityState={{ disabled: isBusy || isLoading }}
                                disabled={isBusy || isLoading}
                                className="min-h-12 min-w-12 items-center justify-center rounded-full bg-muted"
                                onPress={() => step(-1)}
                            >
                                <Ionicons name="chevron-back" size={22} color={colors.foreground} />
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={selectedMonthLabel}
                                accessibilityState={{ expanded: pickerSelection !== null, disabled: isBusy || isLoading }}
                                disabled={isBusy || isLoading}
                                className="min-h-12 flex-row items-center justify-center gap-2 rounded-full bg-muted px-4"
                                onPress={() => setPickerSelection({ year: shareYear, month: shareMonth })}
                            >
                                <Ionicons name="calendar-outline" size={19} color={colors.foreground} />
                                <NativeText variant="label" wrap={false}>{selectedMonthLabel}</NativeText>
                                <Ionicons name="chevron-down" size={17} color={colors.foreground} />
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={monthLabel(shareYear, shareMonth + 1)}
                                accessibilityState={{ disabled: isBusy || isLoading }}
                                disabled={isBusy || isLoading}
                                className="min-h-12 min-w-12 items-center justify-center rounded-full bg-muted"
                                onPress={() => step(1)}
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
                        years={years}
                        onChange={(year, month) => setPickerSelection(current => current ? { year, month } : current)}
                        onConfirm={confirmMonth}
                    />
                </BottomSheet>
            </Modal>
        </>
    );
}
