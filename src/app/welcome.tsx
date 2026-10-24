import { NativeText } from "@/design-system/components/NativeText";
import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { Screen } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { useWelcome } from "@/lib/welcome/welcome-context";
import { LinearGradient } from "expo-linear-gradient";
import {
    CalendarDays,
    ClipboardCheck,
    MessageCircle,
} from "lucide-react-native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

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
                <View className="gap-3 px-6 py-4">
                    {startFailed ? (
                        <NativeText
                            variant="subtext"
                            accessibilityRole="alert"
                            accessibilityLiveRegion="polite"
                            color="danger"
                            align="center"
                        >
                            {t("login.genericError")}
                        </NativeText>
                    ) : null}
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t(isStarting ? "welcome.starting" : "welcome.getStarted")}
                        accessibilityState={{
                            disabled: isStarting,
                            busy: isStarting,
                        }}
                        disabled={isStarting}
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
                                <ActivityIndicator
                                    color={colors.primaryForeground}
                                />
                            ) : (
                                    <NativeText
                                        variant="label"
                                        color="primaryForeground"
                                        align="center"
                                        textStyle={{ fontWeight: "600" as const }}
                                    >
                                        {t("welcome.getStarted", {
                                            defaultValue: "Get Started",
                                        })}
                                    </NativeText>
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>
            }
        >
            <View className="grow justify-center gap-8 px-6 py-6">
                <HappyGolfLogo width={148} height={35} />

                <View className="w-full gap-8">
                    <View className="w-full items-center gap-3">
                        <NativeText variant="h1" align="center">
                            {t("welcome.title", {
                                defaultValue: "Welcome to HappyGolf Go",
                            })}
                        </NativeText>
                        <NativeText variant="subtext" color="mutedForeground" align="center">
                            {t("welcome.description", {
                                defaultValue:
                                    "Your golf lessons, all in one place.",
                            })}
                        </NativeText>
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
                                        <Icon
                                            size={20}
                                            color={colors.primary}
                                            strokeWidth={2.2}
                                        />
                                    </View>
                                    <NativeText variant="label" style={{ flex: 1, minWidth: 0 }}>
                                        {feature}
                                    </NativeText>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Screen>
    );
}
