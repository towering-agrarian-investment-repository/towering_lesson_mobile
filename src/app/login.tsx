import { CircleLoader } from "@/components/ui/CircleLoader";
import { Screen } from "@/components/ui/Screen";
import { AppText, Button } from "@/design-system";
import {
    FormPasswordInput,
    FormTextInput,
} from "@/components/ui/form";
import { Image } from "expo-image";
import { signIn } from "@/service/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { View } from "react-native";
import { z } from "zod";

const loginSchema = z.object({
    username: z.string().trim().min(1, "Username is required."),
    password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
    const [isLoggingIn, setIsLoggingIn] = useState(false);

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
            contentClassName="justify-center"
        >
            <View className="gap-10">
                <View className="items-start gap-6">
                    <Image
                        source={require("../../assets/images/happygolf_toolbar_logo.png")}
                        style={{
                            width: 200,
                            height: 50,
                        }}
                        contentFit="contain"
                    />

                    <View className="gap-2">
                        <AppText selectable variant="h1">
                            Start HappyGolf
                        </AppText>

                        <AppText
                            selectable
                            variant="subtext"
                            className="text-foreground/80"
                        >
                            Sign in to view your reservations, tickets, and lesson details.
                        </AppText>
                    </View>
                </View>

                <View className="gap-6">
                    <View className="gap-5">
                        <FormTextInput
                            control={form.control}
                            name="username"
                            label="Username"
                            placeholder="Enter username"
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

                    <Button
                        title={isLoggingIn ? "Logging In..." : "Log In"}
                        size="lg"
                        loading={isLoggingIn}
                        className="rounded-2xl"
                        onPress={form.handleSubmit(handleLogin)}
                    />
                </View>
            </View>
        </Screen>
    );
}
