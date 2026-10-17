import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { NativeText } from "@/design-system/components/NativeText";
import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import {
    Badge,
    CompactEmptyState,
    ErrorState,
    ListRow,
    Screen,
    Skeleton,
    triggerNotificationHaptic,
} from "@/design-system";
import { cn } from "@/design-system/utils/cn";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
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
    HOMEWORK_SUBMISSION_EXTENSIONS,
    HOMEWORK_SUBMISSION_MAX_SIZE_BYTES,
    HOMEWORK_SUBMISSION_MIME_TYPES,
    isAllowedExtension,
    isAllowedMimeType,
} from "@/utils/media";
import { getHomeworkTitle } from "@/utils/member-lesson";
import {
    getHomeworkReviewTone,
    getHomeworkSubmissionTone,
} from "@/utils/status-tone";
import { fmtDateTime, formatDateForDisplay } from "@/utils/time-helper";
import {
    Button,
    Host,
    RNHostView,
    Row,
    Text,
    TextInput,
    useNativeState, Spacer
} from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame, textFieldStyle } from "@expo/ui/swift-ui/modifiers";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { FileCheck, FileUp, MessageSquare } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    View,
} from "react-native";

type HomeworkParams = {
    homeworkId: string;
};

export default function HomeworkDetailScreen() {
    const { colors, resolvedScheme: uiScheme, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const { homeworkId } = useLocalSearchParams<HomeworkParams>();
    const numericHomeworkId = Number(homeworkId);
    const [selectedFile, setSelectedFile] =
        useState<HomeworkSubmissionFile | null>(null);
    const [memo, setMemo] = useState("");
    const submitting = useRef(false);
    const picking = useRef(false);
    const nativeMemo = useNativeState("");
    useEffect(() => {
        if (nativeMemo.get() !== memo) nativeMemo.set(memo);
    }, [memo, nativeMemo]);
    const { data, isLoading, isError, refetch, isRefetching } =
        useMemberHomeworkById(numericHomeworkId);
    const {
        data: submissionsResponse,
        refetch: refetchSubmissions,
    } = useMemberHomeworkSubmissions(numericHomeworkId);
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => Promise.all([refetch({ cancelRefetch: false }), refetchSubmissions({ cancelRefetch: false })]));
    const { mutate: submitHomework, isPending: isSubmitting } =
        useSubmitMemberHomework();

    const homeworkDetail = data?.data;
    const homework = homeworkDetail?.homework;
    const submissions = [
        ...(homeworkDetail?.submissions ?? []),
        ...(submissionsResponse?.data ?? []),
    ].filter(
        (submission, index, all) =>
            all.findIndex((item) => item.id === submission.id) === index,
    );
    const latestReview = submissions.find(
        (submission) => submission.review,
    )?.review;
    const submissionTone = getHomeworkSubmissionTone(
        homework?.currentSubmissionStatus,
    );
    const reviewTone = getHomeworkReviewTone(homework?.currentReviewStatus);
    const primaryStatusLabel = homework?.currentReviewStatus
        ? formatType(homework.currentReviewStatus)
        : homework?.currentSubmissionStatus
            ? formatType(homework.currentSubmissionStatus)
            : homework?.homeworkStatus
                ? formatType(homework.homeworkStatus)
                : null;
    const primaryStatusTone = homework?.currentReviewStatus
        ? reviewTone
        : homework?.currentSubmissionStatus
            ? submissionTone
            : homework?.homeworkStatus
                ? {
                    className: "bg-primary/10",
                    color: "primary" as const,
                }
                : null;

    const refreshControl = (
        <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={handlePullRefresh}
        />
    );

    const handlePickFile = async () => {
        if (isSubmitting || picking.current) {
            return;
        }

        picking.current = true;
        try {
            const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
                multiple: false,
                type: ["image/jpeg", "image/png", "image/webp", "video/mp4"],
            });

            if (result.canceled || !result.assets?.[0]) {
                return;
            }

            setSelectedFile(createFileFromDocument(result.assets[0], t));
        } catch (error) {
            showAppToast({
                message:
                    error instanceof Error
                        ? error.message
                        : t("homework.unsupportedFile"),
                type: "error",
            });
        } finally {
            picking.current = false;
        }
    };

    const handleSubmit = () => {
        if (!homework || !selectedFile || isSubmitting || submitting.current) {
            return;
        }

        submitting.current = true;
        submitHomework(
            {
                homeworkId: homework.homeworkId,
                homeworkInstanceId: homework.homeworkId,
                file: selectedFile,
                memberMemo: memo,
            },
            {
                onSuccess: () => {
                    triggerNotificationHaptic(
                        Haptics.NotificationFeedbackType.Success,
                    );
                    setSelectedFile(null);
                    setMemo("");
                },
                onSettled: () => { submitting.current = false; },
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

    if (isError && !data) {
        return (
            <Screen contentClassName="grow" refreshControl={refreshControl}>
                <ErrorState
                    title={t("homework.failedTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={
                        isRefetching
                            ? t("common.refreshing")
                            : t("common.refreshTryAgain")
                    }
                    onAction={() => {
                        void refetch();
                    }}
                />
            </Screen>
        );
    }

    if (!homework) {
        return (
            <Screen contentClassName="gap-5" refreshControl={refreshControl}>
                <CompactEmptyState
                    title={t("homework.notAvailableTitle")}
                    message={t("homework.notFoundMessage")}
                />
            </Screen>
        );
    }

    return (
        <Screen
            keyboardAware
            scroll={false}
            horizontalPadding={false}
            contentClassName="min-h-0"
            footer={
                <View className="gap-3 pb-8 pt-4">
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        colorScheme={uiScheme}
                        seedColor={colors.primary}
                        accessibilityLabel={t("homework.chooseFile")}
                        accessibilityState={{
                            disabled: isSubmitting,
                            busy: false,
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
                            disabled={isSubmitting}
                            onPress={() => {
                                void handlePickFile();
                            }}
                            style={{
                                ...getNativeButtonStyle(
                                    colors,
                                    "outlined",
                                    isSubmitting,
                                    colors.primary,
                                ), ...{ borderRadius: 12 }
                            }}
                        >
                            <Text
                                modifiers={
                                    process.env.EXPO_OS === "ios"
                                        ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                                        : [fillMaxWidth()]
                                }
                                textStyle={{
                                    ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                    textAlign: "center",
                                    color: colors.foreground,
                                    fontSize:
                                        typography.label.fontSize * uiFontScale,
                                }}
                            >
                                {t("homework.chooseFile")}
                            </Text>
                        </Button>
                    </Host>
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        colorScheme={uiScheme}
                        seedColor={colors.primary}
                        accessibilityLabel={t("homework.submitHomework")}
                        accessibilityState={{
                            disabled:
                                !selectedFile || isSubmitting || isSubmitting,
                            busy: isSubmitting,
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
                            disabled={
                                !selectedFile || isSubmitting || isSubmitting
                            }
                            onPress={handleSubmit}
                            style={{
                                ...getNativeButtonStyle(
                                    colors,
                                    "filled",
                                    !selectedFile || isSubmitting || isSubmitting,
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
                                {isSubmitting ? (
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
                                    {t("homework.submitHomework")}
                                </Text>
                                <Spacer flexible />
                            </Row>
                        </Button>
                    </Host>
                </View>
            }
        >
            <FlatList
                data={submissions}
                keyExtractor={(submission, index) =>
                    `submission-${submission.id ?? index}`
                }
                renderItem={({ item: submission }) => (
                    <SubmissionRow
                        submission={submission}
                        iconColor={colors.mutedForeground}
                    />
                )}
                ItemSeparatorComponent={() => <View className="h-3" />}
                refreshControl={refreshControl}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingBottom: 24,
                }}
                ListHeaderComponent={
                    <View className="gap-5 pb-3">
                        <View
                            className={cn(
                                "rounded-xl border border-border bg-card p-5",
                                "overflow-hidden border-border bg-card p-0",
                            )}
                        >
                            <View className="gap-4 bg-surface px-4 py-4">
                                <View className="gap-2">
                                    <NativeText variant="h3" numberOfLines={2} textStyle={{ fontWeight: "600" as const }}>
                                        {getHomeworkTitle(homework)}
                                    </NativeText>
                                    <NativeText
                                        variant="meta"
                                        color="mutedForeground"
                                        numberOfLines={1}
                                        textStyle={{ lineHeight: typography.subtext.lineHeight }}
                                    >
                                        {homework.dueAt
                                            ? t("homework.dueDate", {
                                                date: formatDateForDisplay(
                                                    homework.dueAt,
                                                ),
                                            })
                                            : t("homework.noDueDate")}
                                    </NativeText>
                                </View>

                                <View className="flex-row flex-wrap gap-2">
                                    {primaryStatusLabel && primaryStatusTone ? (
                                        <Badge
                                            label={primaryStatusLabel}
                                            className={
                                                primaryStatusTone.className
                                            }
                                            color={primaryStatusTone.color}
                                        />
                                    ) : null}
                                </View>
                            </View>

                            <View className="px-4 py-4">
                                <NativeText variant="body">
                                    {homework.description?.trim() ||
                                        t("homework.noDescription")}
                                </NativeText>
                            </View>
                        </View>

                        <View
                            className={cn(
                                "rounded-xl border border-border bg-card p-5",
                                "gap-4 border-border bg-card p-4",
                            )}
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                    <FileUp size={20} color={colors.primary} />
                                </View>
                                <View className="min-w-0 flex-1">
                                    <NativeText variant="label" textStyle={{ fontWeight: "600" as const }}>
                                        {t("homework.submission")}
                                    </NativeText>
                                    <NativeText
                                        variant="caption"
                                        color="mutedForeground"
                                        numberOfLines={1}
                                        textStyle={{ lineHeight: typography.subtext.lineHeight }}
                                    >
                                        {selectedFile
                                            ? `${selectedFile.name} / ${formatFileSize(selectedFile.size)}`
                                            : t("homework.selectOneFile")}
                                    </NativeText>
                                </View>
                            </View>

                            <NativeText variant="label">
                                {t("homework.memo")}
                            </NativeText>
                            <Host
                                matchContents={{ vertical: true }}
                                ignoreSafeArea="all"
                                colorScheme={uiScheme}
                                seedColor={colors.primary}
                                accessibilityLabel={t("homework.memo")}
                                style={{
                                    width: "100%",
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    backgroundColor: colors.surface,
                                    overflow: "hidden",
                                }}
                            >
                                <TextInput
                                    modifiers={
                                        process.env.EXPO_OS === "ios"
                                            ? [
                                                textFieldStyle("plain"),
                                                frame({
                                                    maxWidth: Infinity,
                                                    minHeight: 104,
                                                }),
                                            ]
                                            : [
                                                fillMaxWidth(),
                                                defaultMinSize({
                                                    minHeight: 128,
                                                }),
                                            ]
                                    }
                                    value={nativeMemo}
                                    onChangeText={setMemo}
                                    placeholder={t("homework.noteForCoach")}
                                    editable={!isSubmitting}
                                    multiline
                                    numberOfLines={4}
                                    placeholderTextColor={
                                        colors.mutedForeground
                                    }
                                    textStyle={{
                                        fontSize: typography.body.fontSize * uiFontScale,
                                        lineHeight: typography.body.lineHeight * uiFontScale,
                                        color: colors.foreground,
                                    }}
                                    style={{ paddingVertical: 12, paddingHorizontal: 8, backgroundColor: "transparent" }}
                                />
                            </Host>
                        </View>

                        {latestReview ? (
                            <View
                                className={cn(
                                    "rounded-xl border border-border bg-card p-5",
                                    "gap-3 border-border bg-card p-4",
                                )}
                            >
                                <View className="flex-row items-center gap-3">
                                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
                                        <MessageSquare
                                            size={18}
                                            color={colors.mutedForeground}
                                        />
                                    </View>
                                    <NativeText
                                        variant="h3"
                                        wrap={false}
                                        textStyle={{ fontSize: typography.subtitle.fontSize, fontWeight: "600" as const }}
                                    >
                                        {t("homework.coachReview")}
                                    </NativeText>
                                </View>

                                {latestReview.score != null ? (
                                    <NativeText variant="meta" color="mutedForeground">
                                        {t("homework.score", {
                                            score: latestReview.score,
                                        })}
                                    </NativeText>
                                ) : null}

                                <View className="rounded-xl bg-surface px-3 py-3">
                                    <NativeText variant="body">
                                        {latestReview.coachFeedback?.trim() ||
                                            t("homework.noReviewComment")}
                                    </NativeText>
                                </View>

                                {latestReview.reviewedAt ? (
                                    <NativeText variant="caption" color="mutedForeground">
                                        {t("homework.reviewedAt", {
                                            date: fmtDateTime(
                                                latestReview.reviewedAt,
                                            ),
                                        })}
                                    </NativeText>
                                ) : null}
                            </View>
                        ) : null}

                        <View className="flex-row items-center justify-between gap-4">
                            <NativeText
                                variant="h3"
                                wrap={false}
                                textStyle={{ fontSize: typography.subtitle.fontSize, fontWeight: "600" as const }}
                            >
                                {t("homework.submissionHistory")}
                            </NativeText>
                            <NativeText variant="count" color="mutedForeground" wrap={false}>
                                {String(submissions.length ?? "")}
                            </NativeText>
                        </View>

                        {submissions.length === 0 ? (
                            <CompactEmptyState
                                title={t("homework.noSubmissionsTitle")}
                                message={t("homework.noSubmissionsMessage")}
                            />
                        ) : null}
                    </View>
                }
                initialNumToRender={6}
                maxToRenderPerBatch={8}
                windowSize={7}
            />
        </Screen>
    );
}

function createFileFromDocument(
    asset: DocumentPicker.DocumentPickerAsset,
    t: (key: string) => string,
): HomeworkSubmissionFile {
    const file = new File(asset.uri);
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

    const mimeType = asset.mimeType;

    if (
        !mimeType ||
        !isAllowedMimeType(mimeType, HOMEWORK_SUBMISSION_MIME_TYPES)
    ) {
        throw new Error(t("homework.supportedFilesOnly"));
    }

    if (!file.exists || file.size <= 0) {
        throw new Error(
            "The selected homework file is empty or its size is unavailable.",
        );
    }

    if (file.size > HOMEWORK_SUBMISSION_MAX_SIZE_BYTES) {
        throw new Error("Homework files must be 100 MiB or smaller.");
    }

    return {
        uri: asset.uri,
        name: asset.name || file.name,
        type: mimeType,
        size: file.size,
    };
}

function SubmissionRow({
    submission,
    iconColor,
}: {
    submission: MemberHomeworkSubmissionResponse;
    iconColor: string;
}) {
    const { t } = useTranslation();
    return (
        <ListRow
            title={
                submission.submittedByName?.trim() ||
                submission.originalFileName?.trim() ||
                submission.fileUrl?.split("/").pop() ||
                t("homework.submissionWithId", { id: submission.id })
            }
            subtitle={
                [
                    submission.submittedAt
                        ? fmtDateTime(submission.submittedAt)
                        : null,
                    formatFileSize(submission.fileSizeBytes),
                    submission.memberMemo?.trim(),
                ]
                    .filter((value) => value && value !== "-")
                    .join(" / ") || undefined
            }
            meta={submission.status ? formatType(submission.status) : undefined}
            leading={
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <FileCheck size={18} color={iconColor} />
                </View>
            }
            className="border-border bg-card px-4 py-3.5"
            titleStyle={{ fontWeight: "500", lineHeight: 24 }}
            showChevron={false}
        />
    );
}
