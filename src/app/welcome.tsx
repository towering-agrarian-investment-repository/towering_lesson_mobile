import { AppText } from "@/design-system/components/AppText";
import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { AnimatedPressable, Screen } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { useWelcome } from "@/lib/welcome/welcome-context";
import { LinearGradient } from "expo-linear-gradient";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import ClipboardCheck from "lucide-react-native/icons/clipboard-check";
import MessageCircle from "lucide-react-native/icons/message-circle";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

const featureIcons = [CalendarDays, ClipboardCheck, MessageCircle];

export default function WelcomeScreen() {
    const { colors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const { completeWelcome } = useWelcome();
    const [isStarting, setIsStarting] = useState(false);
    const [startFailed, setStartFailed] = useState(false);
    const startPending = useRef(false);

    const features = [
        t("welcome.featureBooking", {
            defaultValue: "Book lessons and golf sessions easily",
        }),
        t("welcome.featureLessons", {
            defaultValue: "Keep track of your lessons and progress",
        }),
        t("welcome.featureUpdates", {
            defaultValue: "Stay up to date with important notifications",
        }),
    ];

    const handleGetStarted = async () => {
        if (startPending.current) {
            return;
        }

        startPending.current = true;
        setStartFailed(false);
        setIsStarting(true);

        try {
            await completeWelcome();
        } catch {
            setStartFailed(true);
        } finally {
            startPending.current = false;
            setIsStarting(false);
        }
    };

    return (
        <Screen
            headerShown={false}
            horizontalPadding={false}
            footer={
                <View className="gap-3 px-2">
                    {startFailed ? (
                        <AppText
                            variant="subtext"
                            accessibilityRole="alert"
                            accessibilityLiveRegion="polite"
                            color="danger"
                            align="center"
                        >
                            {t("login.genericError")}
                        </AppText>
                    ) : null}
                    <AnimatedPressable
                        accessibilityRole="button"
                        accessibilityLabel={t(isStarting ? "welcome.starting" : "welcome.getStarted")}
                        accessibilityState={{
                            disabled: isStarting,
                            busy: isStarting,
                        }}
                        disabled={isStarting}
                        haptic="impact"
                        className="overflow-hidden rounded-xl"
                        onPress={() => {
                            void handleGetStarted();
                        }}
                    >
                        <LinearGradient
                            colors={[colors.btnMainStart, colors.btnMainEnd]}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={{
                                minHeight: Math.max(56, typography.label.lineHeight * uiFontScale + 32),
                                alignItems: "center",
                                justifyContent: "center",
                                paddingHorizontal: 24,
                                paddingVertical: 16,
                                borderRadius: 12,
                                opacity: isStarting ? 0.5 : 1,
                            }}
                        >
                            {isStarting ? (
                                <ActivityIndicator color={colors.primaryForeground} />
                            ) : (
                                <AppText
                                    variant="label"
                                    color="primaryForeground"
                                    align="center"
                                    textStyle={{ fontWeight: "600" as const }}
                                >
                                    {t("welcome.getStarted", {
                                        defaultValue: "Get Started",
                                    })}
                                </AppText>
                            )}
                        </LinearGradient>
                    </AnimatedPressable>
                </View>
            }
        >
            <View className="grow justify-center gap-8 px-4 py-6">
                <HappyGolfLogo width={148} height={35} primaryColor={colors.primary} accentColor={colors.warning} />

                <View className="w-full gap-8">
                    <View className="w-full items-center gap-3">
                        <AppText variant="h1" align="center">
                            {t("welcome.title", {
                                defaultValue: "Welcome to HappyGolf Go",
                            })}
                        </AppText>
                        <AppText variant="subtext" color="mutedForeground" align="center">
                            {t("welcome.description", {
                                defaultValue: "Your golf lessons, all in one place.",
                            })}
                        </AppText>
                    </View>

                    <View className="w-full gap-3">
                        {features.map((feature, index) => {
                            const Icon = featureIcons[index];

                            return (
                                <View
                                    key={feature}
                                    className="flex-row items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4"
                                >
                                    <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                        <Icon size={20} color={colors.primary} strokeWidth={2.2} />
                                    </View>
                                    <AppText variant="label" style={{ flex: 1, minWidth: 0 }}>
                                        {feature}
                                    </AppText>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Screen>
    );
}
