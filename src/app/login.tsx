import { CircleLoader } from "@/components/ui/CircleLoader";
import { Screen } from "@/components/ui/Screen";
import {
    FormPasswordInput,
    FormTextInput,
} from "@/components/ui/form";
import { signIn } from "@/service/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
    Image,
    Pressable,
    Text,
    View,
} from "react-native";
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
            contentClassName="justify-start"
        >
            <View className="gap-8">
                <Image
                    source={require("../../assets/golf/drawable-xxxhdpi/happygolf_toolbar_logo.png")}
                    style={{
                        width: 200,
                        height: 50,
                        resizeMode: "contain",
                    }}
                />

                <Text className="text-3xl font-bold tracking-tight text-gray-900">
                    Start HappyGolf
                </Text>
                <View className="gap-6">
                    <View className="gap-4">
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

                    <Pressable
                        className={`h-14 items-center justify-center rounded-2xl ${isLoggingIn ? "bg-green-200" : "bg-green-600"
                            }`}
                        onPress={form.handleSubmit(handleLogin)}
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? (
                            <CircleLoader />
                        ) : (
                            <Text className="text-base font-bold text-white">
                                Log In
                            </Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </Screen>
    );
}
