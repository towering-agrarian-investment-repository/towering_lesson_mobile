import { AppText } from "@/design-system/components/AppText";
import { FormPasswordInput } from "@/components/ui/form";
import { ActionButton, Screen, triggerSuccessHaptic } from "@/design-system";
import { triggerNotificationHaptic } from "@/design-system/utils/haptics";
import { typography } from "@/design-system/utils/typography";
import { responseError } from "@/lib/api-response/api-response";
import { showAppToast } from "@/design-system/components/AppToast";
import { changePassword } from "@/service/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { usePreventRemove, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";
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

    const router = useRouter();
    const [isSaved, setIsSaved] = useState(false);
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
            triggerSuccessHaptic();
            setIsSaved(true);
        } catch (error) {
            const err = error as {
                code?: string;
                message?: string;
            };

            const code = err.code;
            const message = err.message;

            if (code === "INVALID_PASSWORD") {
                triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
                form.setError("currentPassword", {
                    type: "server",
                    message: message || t("changePassword.invalidPassword"),
                });
                form.setFocus("currentPassword");

                return;
            }

            responseError(error);
        } finally {
            submitting.current = false;
        }
    };

    const handleInvalidSubmit = (errors: FieldErrors<ChangePasswordFormValues>) => {
        if (errors.currentPassword) {
            form.setFocus("currentPassword");
        } else if (errors.newPassword) {
            form.setFocus("newPassword");
        } else {
            form.setFocus("confirmPassword");
        }
    };

    const isSubmitDisabled = form.formState.isSubmitting || !form.formState.isDirty;

    usePreventRemove(form.formState.isDirty && !form.formState.isSubmitting && !isSaved, ({ repeat }) => {
        Alert.alert(t("common.unsavedChangesTitle"), t("common.unsavedChangesMessage"), [
            { text: t("common.cancel"), style: "cancel" },
            {
                text: t("common.discardChanges"),
                style: "destructive",
                onPress: () => {
                    form.reset();
                    repeat();
                },
            },
        ]);
    });

    useEffect(() => {
        if (isSaved) {
            router.dismissTo("/(app)/(tabs)/profile");
        }
    }, [isSaved, router]);

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
                    label={form.formState.isSubmitting ? t("changePassword.saving") : t("changePassword.confirm")}
                    disabled={isSubmitDisabled}
                    loading={form.formState.isSubmitting}
                    haptic="selection"
                    onPress={submitChangePassword}
                />
            }
        >
            <View className="grow flex-col gap-6">
                <AppText variant="body">{t("changePassword.lostPasswordHelp")}</AppText>

                <View className="flex-col gap-8">
                    <AppText
                        variant="body"
                        textStyle={{ lineHeight: typography.h3.lineHeight, fontSize: typography.subtitle.fontSize }}
                    >
                        {t("changePassword.enterOldPassword")}
                    </AppText>

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
                    <AppText
                        variant="body"
                        textStyle={{ lineHeight: typography.h3.lineHeight, fontSize: typography.subtitle.fontSize }}
                    >
                        {t("changePassword.enterNewPassword")}
                    </AppText>

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
