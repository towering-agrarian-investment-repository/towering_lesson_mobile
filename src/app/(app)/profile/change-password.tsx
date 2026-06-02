import { FormPasswordInput } from "@/components/ui/form";
import { Screen } from "@/components/ui/Screen";
import { responseError } from "@/lib/api-response/api-response";
import { showAppToast } from "@/lib/toast/toast";
import { changePassword } from "@/service/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React from 'react';
import { useForm } from "react-hook-form";
import { Pressable, Text, View } from 'react-native';
import { z } from "zod";


const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required."),
        newPassword: z.string().min(6, "New password must be at least 6 characters."),
        confirmPassword: z.string().min(1, "Please confirm your new password."),
    })
    .refine((values) => values.newPassword !== values.currentPassword, {
        message: "New password must be different from current password.",
        path: ["newPassword"],
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

function ChangePasswordScreen() {

    const router = useRouter()

    const form = useForm<ChangePasswordFormValues>({
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
        resolver: zodResolver(changePasswordSchema),
        mode: "onSubmit"
    })

    const onSubmit = async (data: ChangePasswordFormValues) => {
        try {
            await changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            })
            showAppToast({
                message: "Success",
                type: "success",
            });

            router.replace("/")

        } catch (error) {
            const err = error as {
                code?: string;
                message?: string;
                status?: number;
                statusText?: string;
                response?: {
                    data?: {
                        code?: string;
                        message?: string;
                        status?: number;
                    };
                };
            };

            const code = err.code || err.response?.data?.code;
            const message = err.message || err.response?.data?.message;

            if (code === "INVALID_PASSWORD") {
                form.setError("currentPassword", {
                    type: "server",
                    message: message || "Invalid password",
                });

                return;
            }

            responseError({ error })
        }
    }

    return (
        <Screen
            keyboardAware
            contentClassName="flex-grow"
            footer={
                <View className="border-t border-gray-100 bg-white px-6 pb-8 pt-4">
                    <Pressable
                        className={`items-center justify-center rounded-2xl px-4 py-4 ${form.formState.isSubmitting ? "bg-green-300" : "bg-green-500"
                            }`}
                        onPress={form.handleSubmit(onSubmit)}
                        disabled={form.formState.isSubmitting}
                    >
                        <Text
                            className="w-full text-center text-base font-bold text-white"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}
                        >
                            {form.formState.isSubmitting ? "Saving..." : "Confirm"}
                        </Text>
                    </Pressable>
                </View>
            }
        >
            <View className="flex-1 flex-col gap-6">
                <Text className="text-base">
                    If you lose your password, ask the store manager to reset it.
                </Text>

                <View className="flex-col gap-8">
                    <Text className="text-lg">
                        Please enter your old password
                    </Text>

                    <FormPasswordInput
                        control={form.control}
                        name="currentPassword"
                        label="Current Password"
                        placeholder="******"
                    />
                </View>

                <View className="flex-col gap-8">
                    <Text className="text-lg">
                        Please enter a new password
                    </Text>

                    <View className="flex-col gap-6">
                        <FormPasswordInput
                            control={form.control}
                            name="newPassword"
                            label="Password"
                            placeholder="******"
                        />

                        <FormPasswordInput
                            control={form.control}
                            name="confirmPassword"
                            label="Confirm Password"
                            placeholder="******"
                        />
                    </View>
                </View>
            </View>
        </Screen>
    )
}

export default ChangePasswordScreen
