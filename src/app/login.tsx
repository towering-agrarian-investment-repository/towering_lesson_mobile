import { NativeText } from "@/design-system/components/NativeText";
import goLogoImage from "@/assets/images/img_go.png";
import golfFieldImage from "@/assets/images/img_golf_filed.png";
import { FormPasswordInput, FormTextInput } from "@/components/ui/form";
import { Screen } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { BannedUserError, InvalidCredentialsError, signIn } from "@/service/auth";
import {
    clearSessionEndedNotice,
    getSessionEndedNotice,
    subscribeToSessionEndedNotice,
} from "@/lib/auth-session";
import { Button, Host, Text } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState, useSyncExternalStore } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from "zod";

const createLoginSchema = (t: (key: string) => string) =>
    z.object({
        phoneNumber: z.string().trim().min(1, t("login.phoneNumberRequired")),
        password: z.string().min(1, t("login.passwordRequired")),
    });

type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export default function LoginScreen() {
    const { colors, resolvedScheme, fontScale: uiFontScale } = useTheme();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isLoginPressed, setIsLoginPressed] = useState(false);
    const loginPending = useRef(false);
    const { t } = useTranslation();
    const showSessionEndedNotice = useSyncExternalStore(
        subscribeToSessionEndedNotice,
        getSessionEndedNotice,
        getSessionEndedNotice,
    );
    const loginSchema = createLoginSchema(t);

    const form = useForm<LoginFormValues>({
        defaultValues: {
            phoneNumber: "",
            password: "",
        },
        resolver: zodResolver(loginSchema),
        mode: "onChange",
    });

    const handleInvalidLogin = (errors: FieldErrors<LoginFormValues>) => {
        form.setFocus(errors.phoneNumber ? "phoneNumber" : "password");
    };

    async function handleLogin(values: LoginFormValues) {
        if (loginPending.current) return;
        loginPending.current = true;
        clearSessionEndedNotice();
        form.clearErrors();

        try {
            setIsLoggingIn(true);

            await signIn({
                phoneNumber: values.phoneNumber.trim(),
                password: values.password,
            });
        } catch (error) {
            form.setError("password", {
                type: "server",
                message:
                    error instanceof BannedUserError
                        ? t("login.deactivatedAccount")
                        : error instanceof InvalidCredentialsError
                        ? t("login.invalidCredentials")
                        : t("login.genericError"),
            });
        } finally {
            loginPending.current = false;
            setIsLoggingIn(false);
        }
    }

    return (
        <Screen
            headerShown={false}
            keyboardAware
            horizontalPadding={false}
            contentClassName="justify-start"
        >
            <View className="relative grow">
                <View className="gap-10 px-6 pb-40 pt-6">
                    <View className="w-full items-start gap-5">
                        <Image
                            source={goLogoImage}
                            style={{ width: 64, height: 40 }}
                            contentFit="contain"
                        />
                        <View className="w-full gap-3">
                            <NativeText variant="h1">
                                {t("login.title")}
                            </NativeText>
                        </View>
                    </View>

                    <View className="gap-6">
                        {showSessionEndedNotice ? (
                            <View className="gap-2 rounded-xl border border-warning/30 bg-warning/10 p-4">
                                <NativeText variant="label" accessibilityRole="header">
                                    {t("login.sessionEndedTitle")}
                                </NativeText>
                                <NativeText variant="body" accessibilityLiveRegion="polite">
                                    {t("login.sessionEndedMessage")}
                                </NativeText>
                            </View>
                        ) : null}
                        <View className="gap-5">
                            <FormTextInput
                                control={form.control}
                                name="phoneNumber"
                                label={t("login.phoneNumberLabel")}
                                placeholder={t("login.phoneNumberPlaceholder")}
                                keyboardType="phone-pad"
                                autoCapitalize="none"
                                autoComplete="tel"
                                editable={!isLoggingIn}
                            />

                            <FormPasswordInput
                                control={form.control}
                                name="password"
                                label={t("login.passwordLabel")}
                                placeholder={t("login.passwordPlaceholder")}
                                autoComplete="current-password"
                                editable={!isLoggingIn}
                            />
                        </View>

                        <LinearGradient
                            colors={isLoginPressed
                                ? [colors.btnMainPressedStart, colors.btnMainPressedEnd]
                                : [colors.btnMainStart, colors.btnMainEnd]}
                            onTouchStart={() => { if (!isLoggingIn) setIsLoginPressed(true); }}
                            onTouchEnd={() => setIsLoginPressed(false)}
                            onTouchCancel={() => setIsLoginPressed(false)}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={{ borderRadius: 12, overflow: "hidden", opacity: isLoggingIn ? 0.5 : 1 }}
                        >
                            <Host
                                matchContents={{ vertical: true }}
                                ignoreSafeArea="all"
                                colorScheme={resolvedScheme}
                                style={{ width: "100%" }}
                                accessibilityLabel={isLoggingIn ? t("login.accessibilitySubmitting") : t("login.accessibilitySubmit")}
                                accessibilityState={{ disabled: isLoggingIn, busy: isLoggingIn }}
                            >
                                <Button
                                    variant="text"
                                    style={getNativeButtonStyle(colors, "text")}
                                    modifiers={process.env.EXPO_OS === "ios"
                                        ? [frame({ maxWidth: Infinity, minHeight: 56 })]
                                        : [fillMaxWidth(), defaultMinSize({ minHeight: 56 })]}
                                    disabled={isLoggingIn}
                                    onPress={() => {
                                        if (isLoggingIn) return;
                                        void form.handleSubmit(handleLogin, handleInvalidLogin)();
                                    }}
                                >
                                    <Text
                                        modifiers={process.env.EXPO_OS === "ios"
                                            ? [frame({ maxWidth: Infinity, minHeight: 56 })]
                                            : [fillMaxWidth()]}
                                        textStyle={{ ...typography.label, lineHeight: typography.body.lineHeight * uiFontScale, fontSize: typography.body.fontSize * uiFontScale, fontWeight: "600", color: colors.primaryForeground, textAlign: "center" }}
                                    >
                                        {isLoggingIn ? t("login.submitting") : t("login.submit")}
                                    </Text>
                                </Button>
                            </Host>
                        </LinearGradient>
                    </View>
                </View>

                <Image
                    source={golfFieldImage}
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: "100%",
                        aspectRatio: 2390 / 424,
                    }}
                    contentFit="contain"
                    contentPosition="center"
                />
            </View>
        </Screen>
    );
}
