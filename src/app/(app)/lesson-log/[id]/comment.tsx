import { AppText } from "@/design-system/components/AppText";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { FormTextInput } from "@/components/ui/form";
import {
    ActionButton,
    EmptyState,
    ErrorState,
    AnimatedPressable,
    Screen,
    Skeleton,
    triggerSuccessHaptic,
    triggerSelectionHaptic,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { useMemberLessonLogById, useUpdateMemberLessonLog } from "@/lib/hook/useLessonLog";
import { formatDateForDisplay } from "@/utils/time-helper";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, usePreventRemove, useRouter } from "expo-router";
import Star from "lucide-react-native/icons/star";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, RefreshControl, View } from "react-native";
import { z } from "zod";

type LessonLogParams = {
    id: string;
};

type LessonLogCommentFormValues = {
    ratings: number;
    comment: string;
};

function LessonLogCommentScreen() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<LessonLogParams>();
    const router = useRouter();
    const { data: lessonLogResponse, isLoading, isError, refetch, isRefetching } = useMemberLessonLogById(Number(id));
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        refetch({ cancelRefetch: false }),
    );
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
    const [savedLessonLogId, setSavedLessonLogId] = useState<number | null>(null);
    usePreventRemove(form.formState.isDirty && !isPending && savedLessonLogId === null, ({ repeat }) => {
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
        if (savedLessonLogId === null) return;
        router.dismissTo({
            pathname: "/lesson-log/[id]",
            params: { id: String(savedLessonLogId) },
        });
    }, [router, savedLessonLogId]);

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
                    <Skeleton className="h-8 w-32 rounded-full" />
                    <Skeleton className="h-5 w-56 rounded-full" />
                </View>

                <View className="gap-4">
                    <Skeleton className="h-7 w-48 rounded-full" />
                    <View className="flex-row gap-3 py-2">
                        {Array.from({ length: 5 }, (_, index) => (
                            <Skeleton key={index} className="h-12 w-12 rounded-full" />
                        ))}
                    </View>
                </View>

                <View className="gap-3">
                    <Skeleton className="h-6 w-40 rounded-full" />
                    <Skeleton className="h-28 rounded-xl" />
                </View>
            </Screen>
        );
    }

    if (isError && !lessonLogResponse) {
        return (
            <Screen
                contentClassName="grow"
                refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
            >
                <ErrorState
                    title={t("lessonLog.failedCommentFormTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
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
                refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
            >
                <EmptyState title={t("lessonLog.postNotAvailableTitle")} message={t("lessonLog.postNotFoundMessage")} />
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
            contentClassName="grow gap-6"
            footer={
                <ActionButton
                    label={t("lessonLog.submit")}
                    accessibilityLabel={t("lessonLog.submitCommentAccessibility")}
                    disabled={isPending}
                    loading={isPending}
                    haptic="selection"
                    onPress={() => {
                        void form.handleSubmit(
                            (values) => {
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
                                            triggerSuccessHaptic();
                                            setSavedLessonLogId(Number(lessonLog.id));
                                        },
                                        onSettled: () => {
                                            submitting.current = false;
                                        },
                                    },
                                );
                            },
                            (errors) => {
                                if (errors.comment) {
                                    form.setFocus("comment");
                                }
                            },
                        )();
                    }}
                />
            }
        >
            <View className="gap-2">
                <AppText variant="h2">{formatDateForDisplay(lessonLog.lessonDate)}</AppText>
                <AppText variant="body" color="mutedForeground">
                    {t("lessonLog.shareRatingPrompt")}
                </AppText>
            </View>

            <View className="h-px bg-border" />

            <View className="gap-4">
                <View className="gap-2">
                    <AppText variant="label">{t("lessonLog.howWasLesson")}</AppText>
                    <AppText variant="subtext" color="danger">
                        {t("lessonLog.ratingPrivateNotice")}
                    </AppText>
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
                                        <AnimatedPressable
                                            key={starValue}
                                            accessibilityRole="button"
                                            accessibilityLabel={t("lessonLog.rateStarsAccessibility", {
                                                count: starValue,
                                            })}
                                            accessibilityState={{
                                                selected: isActive,
                                                disabled: isPending,
                                            }}
                                            disabled={isPending}
                                            className={`items-center justify-center${isPending ? " opacity-60" : ""}`}
                                            style={{ minHeight: 48, minWidth: 48 }}
                                            onPress={() => {
                                                triggerSelectionHaptic();
                                                onChange(starValue);
                                            }}
                                        >
                                            <Star
                                                size={34}
                                                fill={isActive ? colors.warning : "transparent"}
                                                color={isActive ? colors.warning : colors.border}
                                                strokeWidth={1.8}
                                            />
                                        </AnimatedPressable>
                                    );
                                })}
                            </View>

                            {fieldState.error?.message ? (
                                <AppText variant="subtext" color="danger">
                                    {fieldState.error.message}
                                </AppText>
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
                    maxLength={500}
                    showCharacterCount
                    editable={!isPending}
                />
            </View>
        </Screen>
    );
}

export default LessonLogCommentScreen;
