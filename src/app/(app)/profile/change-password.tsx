import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { FormPasswordInput } from "@/components/ui/form";
import { Screen, triggerNotificationHaptic } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { responseError } from "@/lib/api-response/api-response";
import { showAppToast } from "@/lib/toast/toast";
import { changePassword } from "@/service/auth";
import { Button, Host, RNHostView, Row, Text, Spacer } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { type FieldErrors, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
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
    const {
        colors: uiColors,
        resolvedScheme: uiScheme,
        fontScale: uiFontScale,
    } = useTheme();
    const { t } = useTranslation();

    const router = useRouter();
    const changePasswordSchema = createChangePasswordSchema(t);

    const form = useForm<ChangePasswordFormValues>({
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
        resolver: zodResolver(changePasswordSchema),
        mode: "onChange",
    });

    const onSubmit = async (data: ChangePasswordFormValues) => {
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

    return (
        <Screen
            maxWidth={640}
            keyboardAware
            contentClassName="flex-grow"
            footer={
                <View className="pb-8 pt-4">
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        colorScheme={uiScheme}
                        seedColor={uiColors.primary}
                        style={{ width: "100%", borderRadius: 12 }}
                        accessibilityLabel={
                            form.formState.isSubmitting
                                ? t("changePassword.saving")
                                : t("changePassword.confirm")
                        }
                        accessibilityState={{
                            disabled:
                                form.formState.isSubmitting ||
                                !form.formState.isDirty ||
                                !form.formState.isValid ||
                                form.formState.isSubmitting,
                            busy: form.formState.isSubmitting,
                        }}
                    >
                        <Button
                            modifiers={
                                process.env.EXPO_OS === "ios"
                                    ? [
                                        frame({
                                            maxWidth: Infinity,
                                            minHeight: 48,
                                        }),
                                    ]
                                    : [
                                        fillMaxWidth(),
                                        defaultMinSize({ minHeight: 48 }),
                                    ]
                            }
                            variant="text"
                            disabled={
                                form.formState.isSubmitting ||
                                !form.formState.isDirty ||
                                !form.formState.isValid ||
                                form.formState.isSubmitting
                            }
                            onPress={form.handleSubmit(
                                onSubmit,
                                handleInvalidSubmit,
                            )}
                            style={{
                                ...getNativeButtonStyle(
                                    uiColors,
                                    "filled",
                                    form.formState.isSubmitting ||
                                    !form.formState.isDirty ||
                                    !form.formState.isValid ||
                                    form.formState.isSubmitting,
                                    uiColors.primary,
                                ), ...{ borderRadius: 12 }
                            }}
                        >
                            <Row
                                modifiers={
                                    process.env.EXPO_OS === "ios"
                                        ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                                        : [fillMaxWidth()]
                                }
                                spacing={8}
                                alignment="center"
                            >
                                <Spacer flexible />
                                {form.formState.isSubmitting ? (
                                    <RNHostView matchContents>
                                        <ActivityIndicator
                                            color={uiColors.primaryForeground}
                                        />
                                    </RNHostView>
                                ) : null}
                                <Text
                                    textStyle={{
                                        textAlign: "center",
                                        ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                        fontWeight: "600",
                                        color: uiColors.primaryForeground,
                                        fontSize:
                                            typography.label.fontSize *
                                            uiFontScale,
                                    }}
                                >
                                    {form.formState.isSubmitting
                                        ? t("changePassword.saving")
                                        : t("changePassword.confirm")}
                                </Text>
                                <Spacer flexible />
                            </Row>
                        </Button>
                    </Host>
                </View>
            }
        >
            <View className="grow flex-col gap-6">
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.body, lineHeight: typography.body.lineHeight * uiFontScale,
                            color: uiColors.foreground,
                            fontSize: typography.body.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {t("changePassword.lostPasswordHelp")}
                    </Text>
                </Host>

                <View className="flex-col gap-8">
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={{
                                ...typography.body, lineHeight: typography.h3.lineHeight * uiFontScale,
                                color: uiColors.foreground,
                                fontSize: typography.subtitle.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {t("changePassword.enterOldPassword")}
                        </Text>
                    </Host>

                    <FormPasswordInput
                        control={form.control}
                        name="currentPassword"
                        label={t("changePassword.currentPassword")}
                        placeholder={t("changePassword.passwordMask")}
                        autoComplete="current-password"
                    />
                </View>

                <View className="flex-col gap-8">
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={{
                                ...typography.body, lineHeight: typography.h3.lineHeight * uiFontScale,
                                color: uiColors.foreground,
                                fontSize: typography.subtitle.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {t("changePassword.enterNewPassword")}
                        </Text>
                    </Host>

                    <View className="flex-col gap-6">
                        <FormPasswordInput
                            control={form.control}
                            name="newPassword"
                            label={t("changePassword.password")}
                            placeholder={t("changePassword.passwordMask")}
                            autoComplete="new-password"
                        />

                        <FormPasswordInput
                            control={form.control}
                            name="confirmPassword"
                            label={t("changePassword.confirmPassword")}
                            placeholder={t("changePassword.passwordMask")}
                            autoComplete="new-password"
                        />
                    </View>
                </View>
            </View>
        </Screen>
    );
}

export default ChangePasswordScreen;
