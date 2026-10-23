import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { NativeText } from "@/design-system/components/NativeText";
import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { FormTextInput } from "@/components/ui/form";
import {
    EmptyState,
    ErrorState,
    getPressedScaleStyle,
    Screen,
    triggerNotificationHaptic,
    triggerSelectionHaptic,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import {
    useMemberLessonLogById,
    useUpdateMemberLessonLog,
} from "@/lib/hook/useLessonLog";
import { formatDateForDisplay } from "@/utils/time-helper";
import { Button, Host, RNHostView, Row, Text, Spacer } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    View,
} from "react-native";
import { z } from "zod";

type LessonLogParams = {
    id: string;
};

type LessonLogCommentFormValues = {
    ratings: number;
    comment: string;
};

function LessonLogCommentScreen() {
    const { colors, resolvedScheme: uiScheme, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<LessonLogParams>();
    const router = useRouter();
    const {
        data: lessonLogResponse,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberLessonLogById(Number(id));
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => refetch({ cancelRefetch: false }));
    const { mutate: updateLessonLog, isPending } = useUpdateMemberLessonLog();
    const submitting = useRef(false);
    const initializedLessonLogId = useRef<number | null>(null);

    const lessonLog = lessonLogResponse?.data;
    const canReview = lessonLog?.status !== "APPROVED";
    const lessonLogCommentSchema = z.object({
        ratings: z.number().min(1, t("lessonLog.ratingRequired")),
        comment: z.string().trim().min(1, t("lessonLog.commentRequired")),
    });
    const form = useForm<LessonLogCommentFormValues>({
        resolver: zodResolver(lessonLogCommentSchema),
        mode: "onSubmit",
        defaultValues: {
            ratings: 0,
            comment: "",
        },
    });

    useEffect(() => {
        if (!lessonLog || initializedLessonLogId.current === lessonLog.id) return;

        initializedLessonLogId.current = lessonLog.id;
        form.reset({
            ratings: lessonLog.ratings ?? 0,
            comment: lessonLog.comment ?? "",
        });
    }, [form, lessonLog]);

    if (isLoading) {
        return (
            <Screen contentClassName="gap-6">
                <View className="gap-3">
                    <View className="h-8 w-32 rounded-full bg-muted" />
                    <View className="h-5 w-56 rounded-full bg-muted" />
                </View>

                <View className="gap-4">
                    <View className="h-7 w-48 rounded-full bg-muted" />
                    <View className="flex-row gap-3 py-2">
                        {Array.from({ length: 5 }, (_, index) => (
                            <View
                                key={index}
                                className="h-12 w-12 rounded-full bg-muted"
                            />
                        ))}
                    </View>
                </View>

                <View className="gap-3">
                    <View className="h-6 w-40 rounded-full bg-muted" />
                    <View className="h-28 rounded-xl bg-muted" />
                </View>
            </Screen>
        );
    }

    if (isError && !lessonLogResponse) {
        return (
            <Screen
                contentClassName="grow"
                refreshControl={
                    <RefreshControl
                        refreshing={isPullRefreshing}
                        onRefresh={handlePullRefresh}
                    />
                }
            >
                <ErrorState
                    title={t("lessonLog.failedCommentFormTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={
                        isRefetching
                            ? t("common.refreshing")
                            : t("common.refreshTryAgain")
                    }
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </Screen>
        );
    }

    if (!lessonLog) {
        return (
            <Screen
                contentClassName="grow"
                refreshControl={
                    <RefreshControl
                        refreshing={isPullRefreshing}
                        onRefresh={handlePullRefresh}
                    />
                }
            >
                <EmptyState
                    title={t("lessonLog.postNotAvailableTitle")}
                    message={t("lessonLog.postNotFoundMessage")}
                />
            </Screen>
        );
    }

    if (!canReview) {
        return (
            <Screen scroll={false} contentClassName="grow justify-center">
                <EmptyState
                    title={t("lessonLog.reviewPeriodEndedTitle")}
                    message={t("lessonLog.reviewPeriodEndedMessage")}
                />
            </Screen>
        );
    }

    return (
        <Screen
            keyboardAware
            contentClassName="grow gap-5"
            footer={
                <View className="pb-8 pt-4">
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        colorScheme={uiScheme}
                        seedColor={colors.primary}
                        accessibilityLabel={t(
                            "lessonLog.submitCommentAccessibility",
                        )}
                        accessibilityState={{
                            disabled: isPending,
                            busy: isPending,
                        }}
                        style={{ width: "100%" }}>
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
                            disabled={isPending}
                            onPress={() => { void form.handleSubmit((values) => {
                                if (submitting.current || isPending || !canReview) return;
                                submitting.current = true;
                                updateLessonLog(
                                    {
                                        lessonLogId: Number(lessonLog.id),
                                        data: {
                                            ratings: values.ratings,
                                            comment: values.comment.trim(),
                                        },
                                    },
                                    {
                                        onSuccess: () => {
                                            triggerNotificationHaptic(
                                                Haptics.NotificationFeedbackType
                                                    .Success,
                                            );
                                            router.dismissTo({
                                                pathname: "/lesson-log/[id]",
                                                params: {
                                                    id: String(lessonLog.id),
                                                },
                                            });
                                        },
                                        onSettled: () => { submitting.current = false; },
                                    },
                                );
                            })(); }}
                            style={{
                                ...getNativeButtonStyle(
                                    colors,
                                    "filled",
                                    isPending,
                                    colors.primary,
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
                                {isPending ? (
                                    <RNHostView matchContents>
                                        <ActivityIndicator
                                            color={colors.primaryForeground}
                                        />
                                    </RNHostView>
                                ) : null}
                                <Text
                                    textStyle={{
                                        textAlign: "center",
                                        ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                        fontWeight: "600",
                                        color: colors.primaryForeground,
                                        fontSize:
                                            typography.label.fontSize *
                                            uiFontScale,
                                    }}
                                >
                                    {t("changePassword.confirm")}
                                </Text>
                                <Spacer flexible />
                            </Row>
                        </Button>
                    </Host>
                </View>
            }
        >
            <View className="gap-2">
                <NativeText variant="h2">
                    {formatDateForDisplay(lessonLog.lessonDate)}
                </NativeText>
                <NativeText variant="muted" color="mutedForeground">
                    {t("lessonLog.shareRatingPrompt")}
                </NativeText>
            </View>

            <View className="h-px bg-border" />

            <View className="gap-4">
                <View className="gap-2">
                    <NativeText variant="label">
                        {t("lessonLog.howWasLesson")}
                    </NativeText>
                    <NativeText variant="meta" color="danger">
                        {t("lessonLog.ratingPrivateNotice")}
                    </NativeText>
                </View>

                <Controller
                    control={form.control}
                    name="ratings"
                    render={({ field: { value, onChange }, fieldState }) => (
                        <View className="gap-3">
                            <View className="flex-row items-center justify-between">
                                {Array.from({ length: 5 }, (_, index) => {
                                    const starValue = index + 1;
                                    const isActive = starValue <= value;

                                    return (
                                        <Pressable
                                            key={starValue}
                                            accessibilityRole="button"
                                            accessibilityLabel={t(
                                                "lessonLog.rateStarsAccessibility",
                                                {
                                                    count: starValue,
                                                },
                                            )}
                                            className="h-12 w-12 items-center justify-center"
                                            style={({ pressed }) =>
                                                getPressedScaleStyle(
                                                    pressed,
                                                    false,
                                                    0.92,
                                                )
                                            }
                                            onPress={() => {
                                                triggerSelectionHaptic();
                                                onChange(starValue);
                                            }}
                                        >
                                            <Star
                                                size={34}
                                                fill={
                                                    isActive
                                                        ? colors.warning
                                                        : "transparent"
                                                }
                                                color={
                                                    isActive
                                                        ? colors.warning
                                                        : colors.border
                                                }
                                                strokeWidth={1.8}
                                            />
                                        </Pressable>
                                    );
                                })}
                            </View>

                            {fieldState.error?.message ? (
                                <NativeText variant="meta" color="danger">
                                    {fieldState.error.message}
                                </NativeText>
                            ) : null}
                        </View>
                    )}
                />
            </View>

            <View className="h-px bg-border" />

            <View className="gap-3">
                <FormTextInput
                    control={form.control}
                    name="comment"
                    label={t("lessonLog.leaveComment")}
                    placeholder={t("lessonLog.commentPlaceholder")}
                    multiline
                    numberOfLines={4}
                    editable={!isPending}
                />
            </View>
        </Screen>
    );
}

export default LessonLogCommentScreen;
