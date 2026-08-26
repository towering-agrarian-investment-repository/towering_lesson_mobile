import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { AppText, Screen, useThemeColors } from "@/design-system";
import { useWelcome } from "@/lib/welcome/welcome-context";
import { CalendarDays, ClipboardCheck, MessageCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useRouter } from "expo-router";

const featureIcons = [CalendarDays, ClipboardCheck, MessageCircle];

export default function WelcomeScreen() {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const { completeWelcome } = useWelcome();
    const [isStarting, setIsStarting] = useState(false);

    const features = [
        t("welcome.featureBooking", { defaultValue: "Book lessons and golf sessions easily" }),
        t("welcome.featureLessons", { defaultValue: "Keep track of your lessons and progress" }),
        t("welcome.featureUpdates", { defaultValue: "Stay up to date with important notifications" }),
    ];

    const handleGetStarted = async () => {
        if (isStarting) {
            return;
        }

        setIsStarting(true);

        try {
            await completeWelcome();
            router.replace("/login");
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <Screen
            headerShown={false}
            horizontalPadding={false}
            contentClassName="px-6 pb-6 pt-8"
        >
            <View className="flex-1 gap-4">
                <HappyGolfLogo width={148} height={35} />

                <View className="flex-1 items-center justify-center gap-8">
                    <View className="items-center gap-3">
                        <AppText variant="h1" className="text-center">
                            {t("welcome.title", { defaultValue: "Welcome to HappyGolf Go" })}
                        </AppText>
                        <AppText
                            variant="body"
                            className="w-full text-center text-sm text-muted-foreground"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                        >
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
                                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                        <Icon size={20} color={colors.primary} strokeWidth={2.2} />
                                    </View>
                                    <AppText variant="label" className="min-w-0 flex-1">
                                        {feature}
                                    </AppText>
                                </View>
                            );
                        })}
                    </View>
                </View>

                <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isStarting, busy: isStarting }}
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
                            minHeight: 56,
                            alignItems: "center",
                            justifyContent: "center",
                            paddingHorizontal: 24,
                            borderRadius: 12,
                            opacity: isStarting ? 0.5 : 1,
                        }}
                    >
                        {isStarting ? (
                            <ActivityIndicator color={colors.primaryForeground} />
                        ) : (
                            <AppText variant="label" className="text-base font-semibold text-primary-foreground">
                                {t("welcome.getStarted", { defaultValue: "Get Started" })}
                            </AppText>
                        )}
                    </LinearGradient>
                </Pressable>
            </View>
        </Screen>
    );
}
