import { AppText as Text, Button, Screen } from "@/design-system";
import { FormPasswordInput } from "@/components/ui/form";
import { responseError } from "@/lib/api-response/api-response";
import { showAppToast } from "@/lib/toast/toast";
import { changePassword } from "@/service/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from 'react-native';
import { z } from "zod";
const createChangePasswordSchema = (t: (key: string) => string) =>
    z
        .object({
            currentPassword: z.string().min(1, t("changePassword.currentPasswordRequired")),
            newPassword: z.string().min(6, t("changePassword.newPasswordMin")),
            confirmPassword: z.string().min(1, t("changePassword.confirmPasswordRequired")),
        })
        .refine((values) => values.newPassword !== values.currentPassword, {
            message: t("changePassword.newPasswordDifferent"),
            path: ["newPassword"],
        })
        .refine((values) => values.newPassword === values.confirmPassword, {
            message: t("changePassword.passwordsDoNotMatch"),
            path: ["confirmPassword"],
        });

type ChangePasswordFormValues = z.infer<ReturnType<typeof createChangePasswordSchema>>;

function ChangePasswordScreen() {
    const { t } = useTranslation();

    const router = useRouter()
    const changePasswordSchema = createChangePasswordSchema(t);

    const form = useForm<ChangePasswordFormValues>({
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
        resolver: zodResolver(changePasswordSchema),
        mode: "onChange"
    })

    const onSubmit = async (data: ChangePasswordFormValues) => {
        try {
            await changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            })
            showAppToast({
                message: t("changePassword.passwordUpdated"),
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
                    message: message || t("changePassword.invalidPassword"),
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
                        title={form.formState.isSubmitting ? t("changePassword.saving") : t("changePassword.confirm")}
                        loading={form.formState.isSubmitting}
                        disabled={
                            form.formState.isSubmitting
                            || !form.formState.isDirty
                            || !form.formState.isValid
                        }
                        className="rounded-xl"
                        onPress={form.handleSubmit(onSubmit)}
                    />
                </View>
            }
        >
            <View className="flex-1 flex-col gap-6">
                <Text selectable className="text-base">
                    {t("changePassword.lostPasswordHelp")}
                </Text>

                <View className="flex-col gap-8">
                    <Text selectable className="text-lg">
                        {t("changePassword.enterOldPassword")}
                    </Text>

                    <FormPasswordInput
                        control={form.control}
                        name="currentPassword"
                        label={t("changePassword.currentPassword")}
                        placeholder={t("changePassword.passwordMask")}
                    />
                </View>

                <View className="flex-col gap-8">
                    <Text selectable className="text-lg">
                        {t("changePassword.enterNewPassword")}
                    </Text>

                    <View className="flex-col gap-6">
                        <FormPasswordInput
                            control={form.control}
                            name="newPassword"
                            label={t("changePassword.password")}
                            placeholder={t("changePassword.passwordMask")}
                        />

                        <FormPasswordInput
                            control={form.control}
                            name="confirmPassword"
                            label={t("changePassword.confirmPassword")}
                            placeholder={t("changePassword.passwordMask")}
                        />
                    </View>
                </View>
            </View>
        </Screen>
    )
}

export default ChangePasswordScreen
