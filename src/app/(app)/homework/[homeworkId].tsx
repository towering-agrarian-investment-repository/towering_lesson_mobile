import {
    AppText,
    Badge,
    Button,
    Card,
    EmptyState,
    ErrorState,
    ListRow,
    Screen,
    Skeleton,
    Textarea,
} from "@/design-system";
import {
    useMemberHomeworkById,
    useMemberHomeworkSubmissions,
    useSubmitMemberHomework,
} from "@/lib/hook/useMemberLessonFlow";
import { showAppToast } from "@/lib/toast/toast";
import type { HomeworkSubmissionFile } from "@/service/member-homework.service";
import type { MemberHomeworkSubmissionResponse } from "@/types/member-homework";
import { formatFileSize } from "@/utils/file";
import { formatType } from "@/utils/format-enum";
import {
    getFileExtension,
    getProfileImageMimeType,
    HOMEWORK_SUBMISSION_EXTENSIONS,
    HOMEWORK_SUBMISSION_MIME_TYPES,
    isAllowedExtension,
    isAllowedMimeType,
} from "@/utils/media";
import { getHomeworkTitle } from "@/utils/member-lesson";
import {
    getHomeworkReviewTone,
    getHomeworkSubmissionTone,
} from "@/utils/status-tone";
import { formatDateForDisplay, fmtDateTime } from "@/utils/time-helper";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams } from "expo-router";
import { FileCheck, FileUp, MessageSquare } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

type HomeworkParams = {
    homeworkId: string;
};

export default function HomeworkDetailScreen() {
    const { t } = useTranslation();
    const { homeworkId } = useLocalSearchParams<HomeworkParams>();
    const numericHomeworkId = Number(homeworkId);
    const [selectedFile, setSelectedFile] = useState<HomeworkSubmissionFile | null>(null);
    const [memo, setMemo] = useState("");
    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberHomeworkById(numericHomeworkId);
    const {
        data: submissionsResponse,
        refetch: refetchSubmissions,
    } = useMemberHomeworkSubmissions(numericHomeworkId);
    const {
        mutate: submitHomework,
        isPending: isSubmitting,
    } = useSubmitMemberHomework();

    const homeworkDetail = data?.data;
    const homework = homeworkDetail?.homework;
    const submissions = [
        ...(homeworkDetail?.submissions ?? []),
        ...(submissionsResponse?.data ?? []),
    ].filter(
        (submission, index, all) =>
            all.findIndex((item) => item.id === submission.id) === index,
    );
    const latestReview =
        submissions.find((submission) => submission.review)?.review;
    const submissionTone = getHomeworkSubmissionTone(homework?.currentSubmissionStatus);
    const reviewTone = getHomeworkReviewTone(homework?.currentReviewStatus);

    const refreshControl = (
        <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
                void refetch();
                void refetchSubmissions();
            }}
        />
    );

    const handlePickFile = async () => {
        if (isSubmitting) {
            return;
        }

        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
            multiple: false,
            type: [
                "image/jpeg",
                "image/png",
                "image/webp",
                "video/mp4",
            ],
        });

        if (result.canceled || !result.assets?.[0]) {
            return;
        }

        try {
            setSelectedFile(createFileFromDocument(result.assets[0], t));
        } catch (error) {
            showAppToast({
                message:
                    error instanceof Error
                        ? error.message
                        : t("homework.unsupportedFile"),
                type: "error",
            });
        }
    };

    const handleSubmit = () => {
        if (
            !homework ||
            !selectedFile ||
            isSubmitting
        ) {
            return;
        }

        submitHomework(
            {
                homeworkId: homework.homeworkId,
                homeworkInstanceId: homework.homeworkId,
                file: selectedFile,
                memberMemo: memo,
            },
            {
                onSuccess: () => {
                    setSelectedFile(null);
                    setMemo("");
                },
            },
        );
    };

    if (isLoading) {
        return (
            <Screen contentClassName="gap-6">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-36 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
            </Screen>
        );
    }

    if (isError) {
        return (
            <Screen contentClassName="grow" refreshControl={refreshControl}>
                <ErrorState
                    title={t("homework.failedTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    onAction={() => {
                        void refetch();
                    }}
                />
            </Screen>
        );
    }

    if (!homework) {
        return (
            <Screen contentClassName="grow" refreshControl={refreshControl}>
                <EmptyState
                    title={t("homework.notAvailableTitle")}
                    message={t("homework.notFoundMessage")}
                />
            </Screen>
        );
    }

    return (
        <Screen
            keyboardAware
            contentClassName="gap-5"
            refreshControl={refreshControl}
            footer={
                <View className="gap-3 border-t border-border bg-background px-6 pb-8 pt-4">
                    <Button
                        title={t("homework.chooseFile")}
                        variant="secondary"
                        disabled={isSubmitting}
                        onPress={() => {
                            void handlePickFile();
                        }}
                    />
                    <Button
                        title={t("homework.submitHomework")}
                        loading={isSubmitting}
                        disabled={!selectedFile || isSubmitting}
                        onPress={handleSubmit}
                    />
                </View>
            }
        >
            <Card className="overflow-hidden border-border bg-card p-0">
                <View className="gap-4 bg-surface px-4 py-4">
                    <View className="gap-2">
                        <AppText
                            variant="h3"
                            className="text-xl font-semibold leading-7"
                            numberOfLines={2}
                        >
                            {getHomeworkTitle(homework)}
                        </AppText>
                        <AppText
                            variant="meta"
                            className="leading-5 text-muted-foreground"
                            numberOfLines={1}
                        >
                            {homework.dueAt
                                ? t("homework.dueDate", { date: formatDateForDisplay(homework.dueAt) })
                                : t("homework.noDueDate")}
                        </AppText>
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                        {homework.homeworkStatus ? (
                            <Badge
                                label={formatType(homework.homeworkStatus)}
                                className="bg-primary/10"
                                textClassName="text-primary"
                            />
                        ) : null}
                        {homework.currentSubmissionStatus ? (
                            <Badge
                                label={formatType(homework.currentSubmissionStatus)}
                                className={submissionTone.className}
                                textClassName={submissionTone.textClassName}
                            />
                        ) : null}
                        {homework.currentReviewStatus ? (
                            <Badge
                                label={formatType(homework.currentReviewStatus)}
                                className={reviewTone.className}
                                textClassName={reviewTone.textClassName}
                            />
                        ) : null}
                    </View>
                </View>

                <View className="px-4 py-4">
                        <AppText variant="body" className="leading-6 text-foreground">
                            {homework.description?.trim() || t("homework.noDescription")}
                        </AppText>
                </View>
            </Card>

            <Card className="gap-4 border-border bg-card p-4">
                <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <FileUp size={20} color="#2563EB" />
                    </View>
                    <View className="min-w-0 flex-1">
                        <AppText variant="label" className="font-semibold">
                            {t("homework.submission")}
                        </AppText>
                        <AppText variant="caption" className="leading-5" numberOfLines={1}>
                            {selectedFile
                                ? `${selectedFile.name} / ${formatFileSize(selectedFile.size)}`
                                : t("homework.selectOneFile")}
                        </AppText>
                    </View>
                </View>

                <Textarea
                    label={t("homework.memo")}
                    placeholder={t("homework.noteForCoach")}
                    value={memo}
                    onChangeText={setMemo}
                    editable={!isSubmitting}
                />
            </Card>

            {latestReview ? (
                <Card className="gap-3 border-border bg-card p-4">
                    <View className="flex-row items-center justify-between gap-4">
                        <View className="flex-row items-center gap-3">
                            <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
                                <MessageSquare size={18} color="#6B7280" />
                            </View>
                            <AppText variant="h3" className="text-lg font-semibold">
                                {t("homework.coachReview")}
                            </AppText>
                        </View>
                        {latestReview.status ? (
                            <Badge
                                label={formatType(latestReview.status)}
                                className={getHomeworkReviewTone(latestReview.status).className}
                                textClassName={getHomeworkReviewTone(latestReview.status).textClassName}
                            />
                        ) : null}
                    </View>

                    {latestReview.score != null ? (
                        <AppText selectable variant="meta">
                            {t("homework.score", { score: latestReview.score })}
                        </AppText>
                    ) : null}

                    <View className="rounded-xl bg-surface px-3 py-3">
                        <AppText variant="body" className="leading-6 text-foreground">
                            {latestReview.coachFeedback?.trim() || t("homework.noReviewComment")}
                        </AppText>
                    </View>

                    {latestReview.reviewedAt ? (
                        <AppText selectable variant="caption">
                            {t("homework.reviewedAt", { date: fmtDateTime(latestReview.reviewedAt) })}
                        </AppText>
                    ) : null}
                </Card>
            ) : null}

            <View className="flex-row items-center justify-between gap-4">
                <AppText variant="h3" className="text-lg font-semibold">
                    {t("homework.submissionHistory")}
                </AppText>
                <AppText variant="count">{submissions.length}</AppText>
            </View>

            {submissions.length === 0 ? (
                <EmptyState
                    title={t("homework.noSubmissionsTitle")}
                    message={t("homework.noSubmissionsMessage")}
                />
            ) : (
                <View className="gap-3">
                    {submissions.map((submission, index) => (
                        <SubmissionRow
                            key={`submission-${submission.id ?? index}`}
                            submission={submission}
                        />
                    ))}
                </View>
            )}
        </Screen>
    );
}

function createFileFromDocument(
    asset: DocumentPicker.DocumentPickerAsset,
    t: (key: string) => string,
): HomeworkSubmissionFile {
    const extension = getFileExtension(asset.name);
    const hasSupportedExtension = isAllowedExtension(
        asset.name,
        HOMEWORK_SUBMISSION_EXTENSIONS,
    );
    const hasSupportedMimeType = isAllowedMimeType(
        asset.mimeType,
        HOMEWORK_SUBMISSION_MIME_TYPES,
    );

    if (!hasSupportedExtension && !hasSupportedMimeType) {
        throw new Error(t("homework.supportedFilesOnly"));
    }

    const mimeType = asset.mimeType?.toLowerCase()
        || (extension ? getProfileImageMimeType(extension) : null)
        || (extension === "mp4" ? "video/mp4" : null);

    return {
        uri: asset.uri,
        name: asset.name || `homework-${Date.now()}`,
        type: mimeType || "application/octet-stream",
        size: asset.size,
    };
}

function SubmissionRow({
    submission,
}: {
    submission: MemberHomeworkSubmissionResponse;
}) {
    const { t } = useTranslation();
    return (
        <ListRow
            title={
                submission.submittedByName?.trim() ||
                submission.fileUrl?.split("/").pop() ||
                submission.s3Key?.split("/").pop() ||
                t("homework.submissionWithId", { id: submission.id })
            }
            subtitle={[
                submission.submittedAt ? fmtDateTime(submission.submittedAt) : null,
                formatFileSize(submission.fileSizeBytes),
                submission.memberMemo?.trim(),
            ]
                .filter((value) => value && value !== "-")
                .join(" / ") || undefined}
            meta={submission.status ? formatType(submission.status) : undefined}
            leading={
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <FileCheck size={18} color="#6B7280" />
                </View>
            }
            className="border-border bg-card px-4 py-3.5"
            titleClassName="font-medium leading-6"
            showChevron={false}
        />
    );
}
