import { mapActivityDays } from "@/components/golf/activity-display-data";
import { MonthlyGolfShareCard } from "@/components/golf/MonthlyGolfShareCard";
import {
    getShareCardThemePalette,
    SHARE_CARD_CORNER_RADIUS,
    SHARE_CARD_THEMES,
    SHARE_CARD_WIDTH,
    type ShareCardTheme,
} from "@/components/golf/monthly-share-card-layout";
import { ShareMonthYearPicker } from "@/components/golf/ShareMonthYearPicker";
import { YearlyShareCard } from "@/components/golf/YearlyShareCard";
import {
    AnimatedPressable,
    AppText,
    cn,
    Screen,
    SegmentedControl,
    triggerImpactHaptic,
    triggerSelectionHaptic,
    useTheme,
} from "@/design-system";
import { NativeText } from "@/design-system/components/NativeText";
import type { ActivityHeatmapValue } from "@/design-system/components/charts/activity-chart-data";
import {
    ShareCardAction,
    useShareCardExport,
} from "@/hooks/useShareCardExport";
import { useShareMonth } from "@/hooks/useShareMonth";
import { useMemberActivity } from "@/lib/hook/useMemberActivity";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@expo/ui";
import { Stack } from "expo-router";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ComponentProps,
} from "react";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StatusBar,
    View,
} from "react-native";
import {
    GestureDetector,
    GestureHandlerRootView,
    usePanGesture,
} from "react-native-gesture-handler";
import Animated, {
    Extrapolation,
    interpolate,
    ReduceMotion,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

type ActivitySharePreviewProps = {
    isAvailable: boolean;
    cardProps: Pick<
        ComponentProps<typeof MonthlyGolfShareCard>,
        "memberName" | "memberImage"
    >;
    initialDailyValues: ActivityHeatmapValue[];
    availableYears: number[];
    selectedYear: number | "all";
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

const ACTIONS: ShareCardAction[] = ["share", "save"];
const SWIPE_COMMIT_THRESHOLD = 72;
const SWIPE_DRAG_LIMIT = 140;

function projectVelocity(velocity: number, decelerationRate = 0.998) {
    "worklet";
    return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

function rubberbandOffset(overshoot: number, dimension: number, constant = 0.35) {
    "worklet";
    return (
        (overshoot * dimension * constant) /
        (dimension + constant * Math.abs(overshoot))
    );
}

// Preview state stays here so opening, closing and saving do not rerender the
// activity screen and rebuild its chart ranges during the modal transition.
export function ActivitySharePreview({
    isAvailable,
    cardProps,
    initialDailyValues,
    availableYears,
    selectedYear,
    open,
    onOpenChange,
}: ActivitySharePreviewProps) {
    const { colors, resolvedScheme, primaryColorPreference } = useTheme();
    const { t, i18n } = useTranslation();
    const reducedMotion = useReducedMotion();

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

    const [cardPeriod, setCardPeriod] = useState<"month" | "year">("month");
    const [cardTheme, setCardTheme] = useState<ShareCardTheme>(() =>
        resolvedScheme === "dark" ? "midnight" : "daylight",
    );
    const [pickerSelection, setPickerSelection] = useState<{
        year: number;
        month: number;
    } | null>(null);
    const [cardWidth, setCardWidth] = useState(0);
    const [readyCardKey, setReadyCardKey] = useState<string | null>(null);
    const [failedCardKey, setFailedCardKey] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const captureReadyRef = useRef(false);
    const shareCardRef = useRef<React.ElementRef<typeof View>>(null);

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
    const shareActivityQuery = useMemberActivity(
        shareYear,
        showShareCard && isAvailable,
    );
    const {
        data: shareActivity,
        isLoading,
        isRefetching,
        isPlaceholderData,
        isError,
        refetch,
    } = shareActivityQuery;
    const shareDailyValues = useMemo(
        () => mapActivityDays(shareActivity?.daily ?? []),
        [shareActivity?.daily],
    );
    const monthlyActivity = shareActivity?.monthly ?? [];

    // Both cards use the selected year's response; the monthly card filters its days.
    const hoursOnCourse =
        monthlyActivity.find(
            (entry) => entry.year === shareYear && entry.month === shareMonth + 1,
        )?.totalReservationHours ?? 0;
    const annualReservations = shareActivity?.totalReservations ?? 0;
    const annualHours = shareActivity?.totalReservationHours ?? 0;

    const canPreview = Boolean(shareActivity) && !isError;
    const cardKey = [
        cardPeriod,
        cardTheme,
        shareYear,
        shareMonth,
        hoursOnCourse,
        annualReservations,
        annualHours,
        i18n.language,
        cardProps.memberImage ?? "",
        cardWidth,
        primaryColorPreference,
        retryCount,
    ].join("|");
    const assetKey = [
        cardTheme,
        cardProps.memberImage ?? "",
        retryCount,
    ].join("|");
    const canSave =
        canPreview &&
        !isPlaceholderData &&
        readyCardKey === cardKey &&
        failedCardKey !== cardKey;
    const loadingValues = !shareActivity || isPlaceholderData;

    const handleReadyChange = useCallback(
        (ready: boolean) => {
            captureReadyRef.current = ready;
            setReadyCardKey(ready ? cardKey : null);
        },
        [cardKey],
    );
    const handleAssetError = useCallback(
        () => setFailedCardKey(cardKey),
        [cardKey],
    );

    const {
        pendingAction,
        isBusy,
        exportCard,
        savedPreviewUri,
        dismissSavedPreview,
        openSavedPhoto,
    } = useShareCardExport({
        cardRef: shareCardRef,
        captureReadyRef,
        canExport: canSave,
        t,
    });

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
    const monthLabel = (year: number, month: number) =>
        monthFormatter.format(new Date(Date.UTC(year, month, 1)));
    const selectedMonthLabel = monthLabel(shareYear, shareMonth);
    const selectedPeriodLabel =
        cardPeriod === "year" ? String(shareYear) : selectedMonthLabel;
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
    const previousPeriodDisabled =
        isBusy || isLoading || previousPeriod === null;
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

    const handleSwipeCommit = useCallback(
        (direction: "next" | "prev") => {
            if (direction === "next" && nextPeriod) {
                triggerSelectionHaptic();
                select(nextPeriod.year, nextPeriod.month);
            } else if (direction === "prev" && previousPeriod) {
                triggerSelectionHaptic();
                select(previousPeriod.year, previousPeriod.month);
            }
        },
        [nextPeriod, previousPeriod, select],
    );

    const translateX = useSharedValue(0);
    const canSwipePrev = previousPeriod !== null;
    const canSwipeNext = nextPeriod !== null;
    const isReducedMotion = Boolean(reducedMotion);

    const stagePanGesture = usePanGesture({
        enabled: !isBusy && !isLoading,
        activeOffsetX: [-12, 12],
        failOffsetY: [-15, 15],
        onUpdate: (event) => {
            "worklet";
            const dx = event.translationX;
            const atBlockedEdge =
                (dx < 0 && !canSwipeNext) || (dx > 0 && !canSwipePrev);
            const nextOffset = atBlockedEdge
                ? rubberbandOffset(dx, SWIPE_DRAG_LIMIT, 0.25)
                : rubberbandOffset(dx, SWIPE_DRAG_LIMIT, 0.7);
            translateX.set(isReducedMotion ? 0 : nextOffset);
        },
        onDeactivate: (event) => {
            "worklet";
            const projected =
                event.translationX + projectVelocity(event.velocityX);
            if (!event.canceled) {
                if (projected < -SWIPE_COMMIT_THRESHOLD && canSwipeNext) {
                    scheduleOnRN(handleSwipeCommit, "next");
                } else if (projected > SWIPE_COMMIT_THRESHOLD && canSwipePrev) {
                    scheduleOnRN(handleSwipeCommit, "prev");
                }
            }
            translateX.set(
                withSpring(0, {
                    duration: 280,
                    dampingRatio: 0.85,
                    velocity: event.velocityX,
                    reduceMotion: ReduceMotion.System,
                }),
            );
        },
    });

    const stageCardAnimatedStyle = useAnimatedStyle(() => {
        const tx = translateX.get();
        const rotate = isReducedMotion
            ? 0
            : interpolate(
                  tx,
                  [-SWIPE_DRAG_LIMIT, SWIPE_DRAG_LIMIT],
                  [-2.5, 2.5],
                  Extrapolation.CLAMP,
              );
        return {
            transform: [{ translateX: tx }, { rotate: `${rotate}deg` }],
        };
    });

    const confirmMonth = (year: number, month: number) => {
        select(year, month);
        setPickerSelection(null);
    };

    const previewOptions = useMemo(
        () => ({
            headerRight: () => (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("shareCard.studioTitle")}
                    accessibilityState={{ disabled: !isAvailable }}
                    disabled={!isAvailable}
                    className="min-h-12 min-w-12 items-center justify-center"
                    onPress={() => {
                        triggerSelectionHaptic();
                        setShowShareCard(true);
                    }}
                >
                    <Ionicons
                        name={
                            process.env.EXPO_OS === "ios"
                                ? "share-outline"
                                : "share-social-outline"
                        }
                        size={22}
                        color={
                            isAvailable
                                ? colors.foreground
                                : colors.mutedForeground
                        }
                    />
                </Pressable>
            ),
        }),
        [
            colors.foreground,
            colors.mutedForeground,
            isAvailable,
            setShowShareCard,
            t,
        ],
    );

    const closePreview = () => {
        if (isBusy) return;
        dismissSavedPreview();
        setShowShareCard(false);
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
        <>
            <Stack.Screen options={previewOptions} />
            <Modal
                visible={showShareCard}
                animationType={reducedMotion ? "none" : "slide"}
                presentationStyle="fullScreen"
                onRequestClose={closePreview}
            >
                <StatusBar
                    barStyle={
                        resolvedScheme === "dark"
                            ? "light-content"
                            : "dark-content"
                    }
                />
                {/* Full-screen modal needs its own SafeAreaProvider and GestureHandlerRootView. */}
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <SafeAreaProvider>
                        <Screen
                            scroll
                            headerShown={false}
                            contentInsetAdjustmentBehavior="never"
                            contentClassName="gap-4"
                            bottomPadding={12}
                            footer={
                                <View
                                    className="flex-row gap-3"
                                    accessibilityState={{ busy: isBusy }}
                                >
                                    {ACTIONS.map((action) => {
                                        const filled = action === "share";
                                        const isActionPending =
                                            pendingAction === action;
                                        const contentColor = filled
                                            ? colors.primaryForeground
                                            : colors.foreground;
                                        return (
                                            <AnimatedPressable
                                                key={action}
                                                accessibilityRole="button"
                                                accessibilityState={{
                                                    disabled:
                                                        isBusy || !canSave,
                                                    busy: isActionPending,
                                                }}
                                                disabled={isBusy || !canSave}
                                                onPress={() => {
                                                    triggerImpactHaptic();
                                                    void exportCard(action);
                                                }}
                                                className={cn(
                                                    "min-h-12 min-w-0 flex-1 flex-row items-center justify-center gap-2.5 rounded-xl px-4 disabled:opacity-50",
                                                    filled
                                                        ? "bg-primary"
                                                        : "border border-border bg-card",
                                                )}
                                            >
                                                {isActionPending ? (
                                                    <ActivityIndicator
                                                        size="small"
                                                        color={contentColor}
                                                    />
                                                ) : (
                                                    <Ionicons
                                                        name={
                                                            filled
                                                                ? "share-outline"
                                                                : "download-outline"
                                                        }
                                                        size={20}
                                                        color={contentColor}
                                                    />
                                                )}
                                                <NativeText
                                                    variant="label"
                                                    color={
                                                        filled
                                                            ? "primaryForeground"
                                                            : "foreground"
                                                    }
                                                    wrap={false}
                                                >
                                                    {actionLabel(action)}
                                                </NativeText>
                                            </AnimatedPressable>
                                        );
                                    })}
                                </View>
                            }
                        >
                            <View className="w-full flex-row items-center justify-between pb-1">
                                <NativeText variant="h3" wrap={false}>
                                    {t("shareCard.studioTitle")}
                                </NativeText>
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
                                    <Ionicons
                                        name="close"
                                        size={24}
                                        color={colors.mutedForeground}
                                    />
                                </AnimatedPressable>
                            </View>

                            {savedPreviewUri ? (
                                <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={t(
                                            "activity.viewSavedPhoto",
                                        )}
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
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={18}
                                                    color={colors.primary}
                                                />
                                                <NativeText
                                                    variant="label"
                                                    wrap={false}
                                                    accessibilityLiveRegion="polite"
                                                >
                                                    {t("activity.savedTitle")}
                                                </NativeText>
                                            </View>
                                            <NativeText
                                                variant="subtext"
                                                color="mutedForeground"
                                            >
                                                {t("activity.savedMessage")}
                                            </NativeText>
                                        </View>
                                    </Pressable>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={t(
                                            "common.closeTitle",
                                            {
                                                title: t("activity.savedTitle"),
                                            },
                                        )}
                                        className="min-h-12 min-w-12 items-center justify-center rounded-full bg-muted"
                                        onPress={dismissSavedPreview}
                                    >
                                        <Ionicons
                                            name="close"
                                            size={20}
                                            color={colors.mutedForeground}
                                        />
                                    </Pressable>
                                </View>
                            ) : null}

                            <View className="w-full items-center gap-4">
                                <SegmentedControl
                                    options={[
                                        {
                                            value: "month" as const,
                                            label: t("shareCard.monthly"),
                                        },
                                        {
                                            value: "year" as const,
                                            label: t("shareCard.yearly"),
                                        },
                                    ]}
                                    value={cardPeriod}
                                    onChange={setCardPeriod}
                                    disabled={isBusy}
                                    className="w-full max-w-[280px]"
                                />

                                <GestureDetector gesture={stagePanGesture}>
                                    <View
                                        className="w-full items-center overflow-hidden rounded-3xl bg-surface px-4 py-5"
                                        onLayout={(event) =>
                                            setCardWidth(
                                                Math.min(
                                                    event.nativeEvent.layout
                                                        .width - 32,
                                                    340,
                                                ),
                                            )
                                        }
                                    >
                                        {(isAvailable || isLoading) &&
                                        (!isError || shareActivity) &&
                                        cardWidth > 0 ? (
                                            <Animated.View
                                                className="overflow-hidden border border-border/70"
                                                style={[
                                                    {
                                                        borderRadius:
                                                            (SHARE_CARD_CORNER_RADIUS *
                                                                cardWidth) /
                                                            SHARE_CARD_WIDTH,
                                                    },
                                                    stageCardAnimatedStyle,
                                                ]}
                                            >
                                                {cardPeriod === "month" ? (
                                                    <MonthlyGolfShareCard
                                                        key={assetKey}
                                                        ref={shareCardRef}
                                                        {...cardProps}
                                                        theme={cardTheme}
                                                        dailyValues={
                                                            shareDailyValues
                                                        }
                                                        year={shareYear}
                                                        month={shareMonth}
                                                        hoursOnCourse={
                                                            hoursOnCourse
                                                        }
                                                        loadingValues={
                                                            loadingValues
                                                        }
                                                        width={cardWidth}
                                                        onReadyChange={
                                                            handleReadyChange
                                                        }
                                                        onAssetError={
                                                            handleAssetError
                                                        }
                                                    />
                                                ) : (
                                                    <YearlyShareCard
                                                        key={assetKey}
                                                        ref={shareCardRef}
                                                        {...cardProps}
                                                        theme={cardTheme}
                                                        dailyValues={
                                                            shareDailyValues
                                                        }
                                                        year={shareYear}
                                                        totalReservations={
                                                            annualReservations
                                                        }
                                                        hoursPlayed={
                                                            annualHours
                                                        }
                                                        loadingValues={
                                                            loadingValues
                                                        }
                                                        width={cardWidth}
                                                        onReadyChange={
                                                            handleReadyChange
                                                        }
                                                        onAssetError={
                                                            handleAssetError
                                                        }
                                                    />
                                                )}
                                            </Animated.View>
                                        ) : (
                                            <View className="w-full items-center gap-3 py-12">
                                                <NativeText
                                                    variant="h3"
                                                    align="center"
                                                >
                                                    {t(
                                                        isError
                                                            ? "activity.couldNotLoad"
                                                            : "activity.emptyTitle",
                                                    )}
                                                </NativeText>
                                                <NativeText
                                                    variant="subtext"
                                                    color="mutedForeground"
                                                    align="center"
                                                >
                                                    {t(
                                                        isError
                                                            ? "common.pullToRefreshAndTryAgain"
                                                            : "activity.emptyMessage",
                                                    )}
                                                </NativeText>
                                                {isError ? (
                                                    <AnimatedPressable
                                                        accessibilityRole="button"
                                                        accessibilityState={{
                                                            disabled:
                                                                isRefetching,
                                                            busy: isRefetching,
                                                        }}
                                                        disabled={isRefetching}
                                                        className="min-h-12 items-center justify-center rounded-xl bg-primary px-5 disabled:opacity-60"
                                                        onPress={() => {
                                                            void refetch();
                                                        }}
                                                    >
                                                        <NativeText
                                                            variant="label"
                                                            color="primaryForeground"
                                                            wrap={false}
                                                        >
                                                            {t(
                                                                isRefetching
                                                                    ? "common.refreshing"
                                                                    : "common.refreshTryAgain",
                                                            )}
                                                        </NativeText>
                                                    </AnimatedPressable>
                                                ) : null}
                                            </View>
                                        )}
                                    </View>
                                </GestureDetector>

                                {failedCardKey === cardKey ? (
                                    <Pressable
                                        accessibilityRole="button"
                                        className="min-h-12 items-center justify-center"
                                        onPress={() =>
                                            setRetryCount((value) => value + 1)
                                        }
                                    >
                                        <NativeText
                                            variant="subtext"
                                            color="danger"
                                            align="center"
                                        >
                                            {t("common.refreshTryAgain")}
                                        </NativeText>
                                    </Pressable>
                                ) : null}

                                <View className="flex-row items-center justify-center gap-4">
                                    {SHARE_CARD_THEMES.map((themeOption) => {
                                        const isSelected =
                                            cardTheme === themeOption;
                                        const palette =
                                            getShareCardThemePalette(
                                                themeOption,
                                                colors,
                                            );
                                        const themeLabel = t(
                                            `shareCard.themes.${themeOption}`,
                                        );
                                        return (
                                            <AnimatedPressable
                                                key={themeOption}
                                                accessibilityRole="button"
                                                accessibilityLabel={themeLabel}
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
                                                    setCardTheme(themeOption);
                                                }}
                                                className="min-h-12 items-center gap-1.5 px-1.5 disabled:opacity-60"
                                            >
                                                <View
                                                    className={cn(
                                                        "h-9 w-9 items-center justify-center rounded-full border-2 p-0.5",
                                                        isSelected
                                                            ? "border-primary"
                                                            : "border-border",
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
                                                                backgroundColor:
                                                                    palette.swatchPrimary,
                                                            }}
                                                        />
                                                        <View
                                                            className="flex-1"
                                                            style={{
                                                                backgroundColor:
                                                                    palette.swatchAccent,
                                                            }}
                                                        />
                                                    </View>
                                                </View>
                                                <AppText
                                                    variant="badge"
                                                    color={
                                                        isSelected
                                                            ? "foreground"
                                                            : "mutedForeground"
                                                    }
                                                    wrap={false}
                                                    textStyle={{
                                                        fontWeight: isSelected
                                                            ? "700"
                                                            : "500",
                                                    }}
                                                >
                                                    {themeLabel}
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
                                                select(
                                                    previousPeriod.year,
                                                    previousPeriod.month,
                                                );
                                            }
                                        }}
                                    >
                                        <Ionicons
                                            name="chevron-back"
                                            size={20}
                                            color={colors.foreground}
                                        />
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
                                        <Ionicons
                                            name="calendar-outline"
                                            size={18}
                                            color={colors.foreground}
                                        />
                                        <NativeText variant="label" wrap={false}>
                                            {selectedPeriodLabel}
                                        </NativeText>
                                        <Ionicons
                                            name="chevron-down"
                                            size={16}
                                            color={colors.foreground}
                                        />
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
                                                select(
                                                    nextPeriod.year,
                                                    nextPeriod.month,
                                                );
                                            }
                                        }}
                                    >
                                        <Ionicons
                                            name="chevron-forward"
                                            size={20}
                                            color={colors.foreground}
                                        />
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
                                    setPickerSelection((current) =>
                                        current ? { year, month } : current,
                                    )
                                }
                                onConfirm={confirmMonth}
                            />
                        </BottomSheet>
                    </SafeAreaProvider>
                </GestureHandlerRootView>
            </Modal>
        </>
    );
}
