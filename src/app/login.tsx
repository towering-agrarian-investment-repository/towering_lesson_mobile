import {
    FormNumberInput,
    FormPasswordInput,
} from "@/components/ui/form";
import golfFieldImage from "@/assets/images/img_golf_filed.png";
import goLogoImage from "@/assets/images/img_go.png";
import { AppText, Screen, useThemeColors } from "@/design-system";
import { signIn } from "@/service/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { z } from "zod";

const createLoginSchema = (t: (key: string) => string) =>
    z.object({
        phoneNumber: z
            .string()
            .trim()
            .min(1, t("login.phoneNumberRequired")),
        password: z.string().min(1, t("login.passwordRequired")),
    });

type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export default function LoginScreen() {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isLoginPressed, setIsLoginPressed] = useState(false);
    const colors = useThemeColors();
    const { t } = useTranslation();
    const loginSchema = createLoginSchema(t);

    const form = useForm<LoginFormValues>({
        defaultValues: {
            phoneNumber: "",
            password: "",
        },
        resolver: zodResolver(loginSchema),
        mode: "onSubmit",
    });

    async function handleLogin(values: LoginFormValues) {
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
                    error instanceof Error
                        ? error.message
                        : t("login.genericError"),
            });
        } finally {
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
            <View className="relative flex-1">
                <View className="gap-10 px-6 pb-40 pt-6">
                    <View className="items-start gap-5">
                        <Image
                            source={goLogoImage}
                            style={{
                                width: 64,
                                height: 40,
                            }}
                            contentFit="contain"
                        />
                        <View className="gap-3">
                            <AppText selectable variant="h1">
                                {t("login.title")}
                            </AppText>
                        </View>
                    </View>

                    <View className="gap-6">
                        <View className="gap-5">
                            <FormNumberInput
                                control={form.control}
                                name="phoneNumber"
                                label={t("login.phoneNumberLabel")}
                                placeholder={t("login.phoneNumberPlaceholder")}
                                numericMode="phone-pad"
                                editable={!isLoggingIn}
                            />

                            <FormPasswordInput
                                control={form.control}
                                name="password"
                                label={t("login.passwordLabel")}
                                placeholder={t("login.passwordPlaceholder")}
                                editable={!isLoggingIn}
                            />
                        </View>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={
                                isLoggingIn
                                    ? t("login.accessibilitySubmitting")
                                    : t("login.accessibilitySubmit")
                            }
                            disabled={isLoggingIn}
                            className={isLoggingIn ? "overflow-hidden rounded-xl opacity-50" : "overflow-hidden rounded-xl"}
                            onPress={form.handleSubmit(handleLogin)}
                            onPressIn={() => setIsLoginPressed(true)}
                            onPressOut={() => setIsLoginPressed(false)}
                        >
                            <LinearGradient
                                colors={
                                    isLoginPressed
                                        ? [colors.btnMainPressedStart, colors.btnMainPressedEnd]
                                        : [colors.btnMainStart, colors.btnMainEnd]
                                }
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={{
                                    minHeight: 56,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    paddingHorizontal: 24,
                                    borderRadius: 12,
                                }}
                            >
                                <AppText
                                    variant="label"
                                    className="text-base font-semibold text-primary-foreground"
                                >
                                    {isLoggingIn
                                        ? t("login.submitting")
                                        : t("login.submit")}
                                </AppText>
                            </LinearGradient>
                        </Pressable>
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
