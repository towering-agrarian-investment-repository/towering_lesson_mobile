import { AnimatedPressable, AppText } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import CheckCircle2 from "lucide-react-native/icons/circle-check";
import X from "lucide-react-native/icons/x";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

type ShareSavedPreviewBannerProps = {
    previewUri: string;
    reducedMotion: boolean;
    onOpenPhoto: () => void;
    onDismiss: () => void;
};

export function ShareSavedPreviewBanner({
    previewUri,
    reducedMotion,
    onOpenPhoto,
    onDismiss,
}: ShareSavedPreviewBannerProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    return (
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
                onPress={onOpenPhoto}
            >
                <Image
                    source={{ uri: previewUri }}
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
                onPress={onDismiss}
            >
                <X size={18} color={colors.mutedForeground} />
            </AnimatedPressable>
        </Animated.View>
    );
}
