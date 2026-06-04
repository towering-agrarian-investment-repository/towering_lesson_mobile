import {
    FormPasswordInput,
    FormTextInput,
} from "@/components/ui/form";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/design-system";
import { useThemeColors } from "@/design-system/utils/theme";
import { signIn } from "@/service/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { z } from "zod";

const loginSchema = z.object({
    username: z.string().trim().min(1, "Username is required."),
    password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isLoginPressed, setIsLoginPressed] = useState(false);
    const colors = useThemeColors();

    const form = useForm<LoginFormValues>({
        defaultValues: {
            username: "",
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
                username: values.username.trim(),
                password: values.password,
            });

            // await authClient.getSession();

            // router.replace("/(app)/(tabs)" as Href);

        } catch (error) {
            form.setError("password", {
                type: "server",
                message:
                    error instanceof Error
                        ? error.message
                        : "Something went wrong. Please try again.",
            });
        } finally {
            setIsLoggingIn(false);
        }
    }

    return (
        <Screen
            headerShown={false}
            keyboardAware
            scroll={false}
            horizontalPadding={false}
            contentClassName="justify-start"
        >
            <View className="relative flex-1">
                <View className="gap-10 px-6 pb-40 pt-6">
                    <View className="items-start gap-5">
                        <Image
                            source={require("../../assets/images/img_go.png")}
                            style={{
                                width: 64,
                                height: 40,
                            }}
                            contentFit="contain"
                        />
                        <View className="gap-3">
                            <AppText selectable variant="h1">
                                Start HappyGolf
                            </AppText>
                        </View>
                    </View>

                    <View className="gap-6">
                        <View className="gap-5">
                            <FormTextInput
                                control={form.control}
                                name="username"
                                label="Username"
                                placeholder="user_01000000000"
                                // keyboardType="phone-pad"
                                autoCapitalize="none"
                                editable={!isLoggingIn}
                            />

                            <FormPasswordInput
                                control={form.control}
                                name="password"
                                label="Password"
                                placeholder="Enter password"
                                editable={!isLoggingIn}
                            />
                        </View>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={isLoggingIn ? "Logging in" : "Login"}
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
                                    {isLoggingIn ? "LOGGING IN..." : "LOGIN"}
                                </AppText>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>

                <Image
                    source={require("../../assets/images/img_golf_filed.png")}
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
