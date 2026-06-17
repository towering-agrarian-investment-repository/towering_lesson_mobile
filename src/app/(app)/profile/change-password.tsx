import { AppText as Text, Button, Screen } from "@/design-system";
import { FormPasswordInput } from "@/components/ui/form";
import { responseError } from "@/lib/api-response/api-response";
import { showAppToast } from "@/lib/toast/toast";
import { changePassword } from "@/service/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { View } from 'react-native';
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
                message: "Password updated.",
                type: "success",
            });

            if (router.canGoBack()) {
                router.back();
                return;
            }

            router.replace("/profile" as never);

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
                <View className="border-t border-border bg-background px-6 pb-8 pt-4">
                    <Button
                        title={form.formState.isSubmitting ? "Saving..." : "Confirm"}
                        loading={form.formState.isSubmitting}
                        disabled={form.formState.isSubmitting}
                        className="rounded-xl"
                        onPress={form.handleSubmit(onSubmit)}
                    />
                </View>
            }
        >
            <View className="flex-1 flex-col gap-6">
                <Text selectable className="text-base">
                    If you lose your password, ask the store manager to reset it.
                </Text>

                <View className="flex-col gap-8">
                    <Text selectable className="text-lg">
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
                    <Text selectable className="text-lg">
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
