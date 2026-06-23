import {
    AppText,
    Button,
    EmptyState,
    ErrorState,
    Screen,
    Textarea,
    useThemeColors,
} from "@/design-system";
import {
    useMemberLessonLogById,
    useUpdateMemberLessonLog,
} from "@/lib/hook/useLessonLog";
import { formatDateForDisplay } from "@/utils/time-helper";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Star } from "lucide-react-native";
import { Pressable, RefreshControl, View } from "react-native";
import { useTranslation } from "react-i18next";
import { z } from "zod";

type LessonLogParams = {
    id: string;
};

type LessonLogCommentFormValues = {
    ratings: number;
    comment: string;
};

function LessonLogCommentScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<LessonLogParams>();
    const router = useRouter();
    const colors = useThemeColors();
    const {
        data: lessonLogResponse,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberLessonLogById(Number(id));
    const { mutate: updateLessonLog, isPending } = useUpdateMemberLessonLog();

    const lessonLog = lessonLogResponse?.data;
    const canReview = lessonLog?.status !== "APPROVED";
    const lessonLogCommentSchema = z.object({
        ratings: z.number().min(1, t("lessonLog.ratingRequired")),
        comment: z.string().trim().min(1, t("lessonLog.commentRequired")),
    });
    const form = useForm<LessonLogCommentFormValues>({
        resolver: zodResolver(lessonLogCommentSchema),
        mode: "onSubmit",
        values: {
            ratings: lessonLog?.ratings ?? 0,
            comment: lessonLog?.comment ?? "",
        },
    });

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
                            <View key={index} className="h-12 w-12 rounded-full bg-muted" />
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

    if (isError) {
        return (
            <Screen
                contentClassName="grow"
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => {
                            void refetch();
                        }}
                    />
                }
            >
                <ErrorState
                    title={t("lessonLog.failedCommentFormTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    onAction={() => {
                        void refetch();
                    }}
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
                        refreshing={isRefetching}
                        onRefresh={() => {
                            void refetch();
                        }}
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
                <View className="border-t border-border bg-background px-6 pb-8 pt-4">
                    <Button
                        title={t("changePassword.confirm")}
                        accessibilityLabel={t("lessonLog.submitCommentAccessibility")}
                        loading={isPending}
                        disabled={isPending}
                        onPress={form.handleSubmit((values) => {
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
                                        router.replace({
                                            pathname: "/lesson-log/[id]",
                                            params: {
                                                id: String(lessonLog.id),
                                            },
                                        });
                                    },
                                },
                            );
                        })}
                    />
                </View>
            }
        >
            <View className="gap-2">
                <AppText selectable variant="h2">
                    {formatDateForDisplay(lessonLog.lessonDate)}
                </AppText>
                <AppText selectable variant="muted">
                    {t("lessonLog.shareRatingPrompt")}
                </AppText>
            </View>

            <View className="h-px bg-border" />

            <View className="gap-4">
                <View className="gap-2">
                    <AppText selectable variant="label">
                        {t("lessonLog.howWasLesson")}
                    </AppText>
                    <AppText selectable variant="meta" className="text-danger">
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
                                        <Pressable
                                            key={starValue}
                                            accessibilityRole="button"
                                            accessibilityLabel={t("lessonLog.rateStarsAccessibility", {
                                                count: starValue,
                                            })}
                                            className="h-12 w-12 items-center justify-center active:opacity-80"
                                            onPress={() => onChange(starValue)}
                                        >
                                            <Star
                                                size={34}
                                                fill={isActive ? colors.warning : "transparent"}
                                                color={isActive ? colors.warning : colors.border}
                                                strokeWidth={1.8}
                                            />
                                        </Pressable>
                                    );
                                })}
                            </View>

                            {fieldState.error?.message ? (
                                <AppText selectable variant="meta" className="text-danger">
                                    {fieldState.error.message}
                                </AppText>
                            ) : null}
                        </View>
                    )}
                />
            </View>

            <View className="h-px bg-border" />

            <View className="gap-3">
                <AppText selectable variant="label">
                    {t("lessonLog.leaveComment")}
                </AppText>

                <Controller
                    control={form.control}
                    name="comment"
                    render={({ field: { value, onChange, onBlur }, fieldState }) => (
                        <Textarea
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            placeholder={t("lessonLog.commentPlaceholder")}
                            error={fieldState.error?.message}
                        />
                    )}
                />
            </View>
        </Screen>
    );
}

export default LessonLogCommentScreen;
