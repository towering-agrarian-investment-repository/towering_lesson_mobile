import { NativeText } from "@/design-system/components/NativeText";
import { FormPasswordInput } from "@/components/ui/form";
import { ActionButton, Screen, triggerNotificationHaptic } from "@/design-system";
import { typography } from "@/design-system/utils/typography";
import { responseError } from "@/lib/api-response/api-response";
import { showAppToast } from "@/lib/toast/toast";
import { changePassword } from "@/service/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from "zod";
const createChangePasswordSchema = (t: (key: string) => string) =>
    z
        .object({
            currentPassword: z
                .string()
                .min(1, t("changePassword.currentPasswordRequired")),
            newPassword: z.string().min(6, t("changePassword.newPasswordMin")),
            confirmPassword: z
                .string()
                .min(1, t("changePassword.confirmPasswordRequired")),
        })
        .refine((values) => values.newPassword !== values.currentPassword, {
            message: t("changePassword.newPasswordDifferent"),
            path: ["newPassword"],
        })
        .refine((values) => values.newPassword === values.confirmPassword, {
            message: t("changePassword.passwordsDoNotMatch"),
            path: ["confirmPassword"],
        });

type ChangePasswordFormValues = z.infer<
    ReturnType<typeof createChangePasswordSchema>
>;

function ChangePasswordScreen() {
    const { t } = useTranslation();

    const router = useRouter();
    const submitting = useRef(false);
    const changePasswordSchema = createChangePasswordSchema(t);

    const form = useForm<ChangePasswordFormValues>({
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
        resolver: zodResolver(changePasswordSchema),
        mode: "onTouched",
    });

    const onSubmit = async (data: ChangePasswordFormValues) => {
        if (submitting.current) return;
        submitting.current = true;
        try {
            await changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            showAppToast({
                message: t("changePassword.passwordUpdated"),
                type: "success",
            });
            triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);

            router.dismissTo("/(app)/(tabs)/profile");
        } catch (error) {
            const err = error as {
                code?: string;
                message?: string;
            };

            const code = err.code;
            const message = err.message;

            if (code === "INVALID_PASSWORD") {
                form.setError("currentPassword", {
                    type: "server",
                    message: message || t("changePassword.invalidPassword"),
                });

                return;
            }

            responseError(error);
        } finally {
            submitting.current = false;
        }
    };

    const handleInvalidSubmit = (
        errors: FieldErrors<ChangePasswordFormValues>,
    ) => {
        if (errors.currentPassword) {
            form.setFocus("currentPassword");
        } else if (errors.newPassword) {
            form.setFocus("newPassword");
        } else {
            form.setFocus("confirmPassword");
        }
    };

    const isSubmitDisabled =
        form.formState.isSubmitting ||
        !form.formState.isDirty;

    const submitChangePassword = () => {
        if (form.formState.isSubmitting || submitting.current) return;
        void form.handleSubmit(onSubmit, handleInvalidSubmit)();
    };

    return (
        <Screen
            keyboardAware
            contentClassName="flex-grow"
            footer={
                <ActionButton
                    label={
                        form.formState.isSubmitting
                            ? t("changePassword.saving")
                            : t("changePassword.confirm")
                    }
                    disabled={isSubmitDisabled}
                    loading={form.formState.isSubmitting}
                    onPress={submitChangePassword}
                />
            }
        >
            <View className="grow flex-col gap-6">
                <NativeText variant="body">
                    {t("changePassword.lostPasswordHelp")}
                </NativeText>

                <View className="flex-col gap-8">
                    <NativeText
                        variant="body"
                        textStyle={{ lineHeight: typography.h3.lineHeight, fontSize: typography.subtitle.fontSize }}
                    >
                        {t("changePassword.enterOldPassword")}
                    </NativeText>

                    <FormPasswordInput
                        control={form.control}
                        name="currentPassword"
                        label={t("changePassword.currentPassword")}
                        placeholder={t("changePassword.passwordMask")}
                        autoComplete="current-password"
                        returnKeyType="next"
                        onSubmitEditing={() => form.setFocus("newPassword")}
                        editable={!form.formState.isSubmitting}
                    />
                </View>

                <View className="flex-col gap-8">
                    <NativeText
                        variant="body"
                        textStyle={{ lineHeight: typography.h3.lineHeight, fontSize: typography.subtitle.fontSize }}
                    >
                        {t("changePassword.enterNewPassword")}
                    </NativeText>

                    <View className="flex-col gap-6">
                        <FormPasswordInput
                            control={form.control}
                            name="newPassword"
                            label={t("changePassword.password")}
                            placeholder={t("changePassword.passwordMask")}
                            autoComplete="new-password"
                            returnKeyType="next"
                            onSubmitEditing={() => form.setFocus("confirmPassword")}
                            editable={!form.formState.isSubmitting}
                        />

                        <FormPasswordInput
                            control={form.control}
                            name="confirmPassword"
                            label={t("changePassword.confirmPassword")}
                            placeholder={t("changePassword.passwordMask")}
                            autoComplete="new-password"
                            returnKeyType="done"
                            onSubmitEditing={submitChangePassword}
                            editable={!form.formState.isSubmitting}
                        />
                    </View>
                </View>
            </View>
        </Screen>
    );
}

export default ChangePasswordScreen;
