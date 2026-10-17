import { NativeText } from "@/design-system/components/NativeText";
import { DayNumbersToggle } from "@/components/golf/activity/DayNumbersToggle";
import { ActivityShareCard } from "@/components/golf/ActivityShareCard";
import { Screen, useTheme } from "@/design-system";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { Stack } from "expo-router";
import { useMemo, useRef, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Modal, Pressable, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";

type ActivitySharePreviewProps = {
    isAvailable: boolean;
    cardProps: Omit<ComponentProps<typeof ActivityShareCard>, "ref" | "showDayNumbers">;
    availableYears: number[];
    selectedYear: number | "all";
    setSelectedYear: (year: number | "all") => void;
};

// Preview state stays here so opening, closing and saving do not rerender the
// activity screen and rebuild its chart ranges during the modal transition.
export function ActivitySharePreview({
    isAvailable,
    cardProps,
    availableYears,
    selectedYear,
    setSelectedYear,
}: ActivitySharePreviewProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const [showShareCard, setShowShareCard] = useState(false);
    const [showDayNumbers, setShowDayNumbers] = useState(true);
    const [isSavingShareCard, setIsSavingShareCard] = useState(false);
    const savingRef = useRef(false);
    const shareCardRef = useRef<React.ElementRef<typeof View>>(null);
    const previewOptions = useMemo(() => ({
        headerRight: () => (
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("activity.preview")}
                accessibilityState={{ disabled: !isAvailable }}
                disabled={!isAvailable}
                hitSlop={10}
                onPress={() => setShowShareCard(true)}
            >
                <Ionicons name="camera-outline" size={22} color={colors.mutedForeground} />
            </Pressable>
        ),
    }), [colors.mutedForeground, isAvailable, t]);
    const closePreview = () => {
        if (!savingRef.current) setShowShareCard(false);
    };

    const handleSaveShareCard = async () => {
        if (savingRef.current || !shareCardRef.current) return;

        savingRef.current = true;

        setIsSavingShareCard(true);
        try {
            // Saving a generated card only needs add/write access. Requesting full
            // library access can be denied even though the platform permits saves.
            const permission = await MediaLibrary.requestPermissionsAsync(true);
            if (!permission.granted) {
                const actions = permission.canAskAgain
                    ? [{ text: t("activity.ok") }]
                    : [
                        {
                            text: t("common.cancel"),
                            style: "cancel" as const,
                        },
                        {
                            text: t("activity.openSettings"),
                            onPress: () => void Linking.openSettings(),
                        },
                    ];

                Alert.alert(
                    t("activity.permissionTitle"),
                    t("activity.permissionMessage"),
                    actions,
                );
                return;
            }

            const uri = await captureRef(shareCardRef.current, {
                format: "png",
                quality: 1,
            });
            await MediaLibrary.Asset.create(uri);
            Alert.alert(t("activity.savedTitle"), t("activity.savedMessage"));
        } catch (error) {
            if (__DEV__) {
                console.error("Failed to save activity card", error);
            }
            Alert.alert(
                t("activity.couldNotSaveTitle"),
                t("activity.couldNotSaveMessage"),
            );
        } finally {
            savingRef.current = false;
            setIsSavingShareCard(false);
        }
    };

    return (
        <>
            <Stack.Screen options={previewOptions} />
            <Modal
                visible={showShareCard && isAvailable}
                animationType={reducedMotion ? "none" : "slide"}
                presentationStyle="fullScreen"
                onRequestClose={closePreview}
            >
                <Screen
                    scroll
                    headerShown={false}
                    contentClassName="gap-5"
                    footer={
                        <View className="pb-3 pt-3">
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={t("activity.save")}
                                accessibilityState={{
                                    busy: isSavingShareCard,
                                    disabled: isSavingShareCard,
                                }}
                                disabled={isSavingShareCard}
                                className="h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary active:opacity-80 disabled:opacity-60"
                                onPress={() => void handleSaveShareCard()}
                            >
                                <Ionicons
                                    name="download-outline"
                                    size={20}
                                    color={colors.primaryForeground}
                                />
                                <NativeText variant="body" color="primaryForeground" wrap={false} textStyle={{ fontWeight: "600" as const }}>
                                    {isSavingShareCard
                                        ? t("activity.saving")
                                        : t("activity.save")}
                                </NativeText>
                            </Pressable>
                        </View>
                    }
                >
                    <View className="mb-4 w-full flex-row items-center justify-between">
                        <NativeText variant="h3" wrap={false}>
                            {t("activity.preview")}
                        </NativeText>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t("common.closeTitle", {
                                title: t("activity.preview"),
                            })}
                            accessibilityState={{ disabled: isSavingShareCard }}
                            hitSlop={10}
                            disabled={isSavingShareCard}
                            onPress={closePreview}
                        >
                            <Ionicons
                                name="close"
                                size={24}
                                color={colors.mutedForeground}
                            />
                        </Pressable>
                    </View>
                    <View className="w-full flex-1 items-center justify-center">
                        <ActivityShareCard
                            ref={shareCardRef}
                            {...cardProps}
                            showDayNumbers={showDayNumbers}
                        />
                    </View>
                    <View className="gap-3">
                        <View className="flex-row flex-wrap gap-2">
                            {availableYears.map((year) => (
                                <Pressable
                                    key={year}
                                    accessibilityRole="button"
                                    accessibilityState={{
                                        selected: selectedYear === year,
                                        disabled: isSavingShareCard,
                                    }}
                                    disabled={isSavingShareCard}
                                    className={`rounded-full px-3 py-2 ${selectedYear === year ? "bg-primary" : "bg-muted"}`}
                                    onPress={() => {
                                        if (!savingRef.current) setSelectedYear(year);
                                    }}
                                >
                                    <NativeText
                                        variant="caption"
                                        wrap={false}
                                        textStyle={{
                                            fontWeight: "600" as const, color:
                                                selectedYear === year
                                                    ? colors.primaryForeground
                                                    : colors.mutedForeground
                                        }}
                                    >
                                        {String(year ?? "")}
                                    </NativeText>
                                </Pressable>
                            ))}
                            <Pressable
                                accessibilityRole="button"
                                accessibilityState={{
                                    selected: selectedYear === "all",
                                    disabled: isSavingShareCard,
                                }}
                                disabled={isSavingShareCard}
                                className={`rounded-full px-3 py-2 ${selectedYear === "all" ? "bg-primary" : "bg-muted"}`}
                                onPress={() => {
                                    if (!savingRef.current) setSelectedYear("all");
                                }}
                            >
                                <NativeText
                                    variant="caption"
                                    wrap={false}
                                    textStyle={{
                                        fontWeight: "600" as const, color:
                                            selectedYear === "all"
                                                ? colors.primaryForeground
                                                : colors.mutedForeground
                                    }}
                                >
                                    {t("activity.all")}
                                </NativeText>
                            </Pressable>
                        </View>
                        <View className="flex-row items-center justify-between gap-3">
                            <NativeText variant="label" style={{ flex: 1, minWidth: 0 }}>
                                {t("activity.showDayNumbers")}
                            </NativeText>
                            <DayNumbersToggle
                                label={t("activity.showDayNumbers")}
                                value={showDayNumbers}
                                disabled={isSavingShareCard}
                                onValueChange={(value) => {
                                    if (!savingRef.current) setShowDayNumbers(value);
                                }}
                            />
                        </View>
                    </View>
                </Screen>
            </Modal>
        </>
    );
}
