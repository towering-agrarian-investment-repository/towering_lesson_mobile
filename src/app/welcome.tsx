import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { Screen, useThemeColors } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { useWelcome } from "@/lib/welcome/welcome-context";
import { Host, Text } from "@expo/ui";
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const colors = useThemeColors();
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
            maxWidth={640}
            footer={
                <View className="gap-3 px-6 py-4">
                    {startFailed ? (
                        <Host
                            matchContents={{ vertical: true }}
                            ignoreSafeArea="all"
                            style={{ width: "100%" }}
                            accessibilityRole="alert"
                            accessibilityLiveRegion="polite"
                        >
                            <Text
                                textStyle={{
                                    ...typography.subtext,
                                    fontSize: typography.subtext.fontSize * uiFontScale,
                                    lineHeight: typography.subtext.lineHeight * uiFontScale,
                                    color: colors.danger,
                                    textAlign: "center",
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}
                            >
                                {t("login.genericError")}
                            </Text>
                        </Host>
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
                                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                    <Text
                                        textStyle={{
                                            ...typography.label,
                                            lineHeight: typography.label.lineHeight * uiFontScale,
                                            fontSize: typography.label.fontSize * uiFontScale,
                                            fontWeight: "600" as const,
                                            textAlign: "center",
                                            color: uiColors.primaryForeground,
                                        }}
                                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}
                                    >
                                        {t("welcome.getStarted", {
                                            defaultValue: "Get Started",
                                        })}
                                    </Text>
                                </Host>
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>
            }
        >
            <View className="grow gap-4 px-6 pt-4">
                <HappyGolfLogo width={148} height={35} />

                <View className="w-full grow items-center justify-center gap-8 py-6">
                    <View className="w-full items-center gap-3">
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                textStyle={{
                                    ...typography.h1, lineHeight: typography.h1.lineHeight * uiFontScale,
                                    color: uiColors.foreground,
                                    textAlign: "center" as const,
                                    fontSize:
                                        typography.h1.fontSize * uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                                {t("welcome.title", {
                                    defaultValue: "Welcome to HappyGolf Go",
                                })}
                            </Text>
                        </Host>
                        <Host
                            matchContents={{ vertical: true }}
                            ignoreSafeArea="all"
                            style={{ width: "100%" }}
                        >
                            <Text
                                textStyle={{
                                    ...typography.subtext,
                                    lineHeight: typography.subtext.lineHeight * uiFontScale,
                                    textAlign: "center" as const,
                                    fontSize: typography.subtext.fontSize * uiFontScale,
                                    color: uiColors.mutedForeground,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "center" })] : [fillMaxWidth()]}>
                                {t("welcome.description", {
                                    defaultValue:
                                        "Your golf lessons, all in one place.",
                                })}
                            </Text>
                        </Host>
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
                                    <Host
                                        matchContents={{ vertical: true }}
                                        ignoreSafeArea="all"
                                        style={{ flex: 1, minWidth: 0 }}
                                    >
                                        <Text
                                            textStyle={{
                                                ...typography.label,
                                                lineHeight: typography.label.lineHeight * uiFontScale,
                                                color: uiColors.foreground,
                                                fontSize:
                                                    typography.label.fontSize *
                                                    uiFontScale,
                                            }}
                                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                            {feature}
                                        </Text>
                                    </Host>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Screen>
    );
}
