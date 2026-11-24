import { HomeworkSourceSheet } from "@/components/golf/homework/HomeworkSourceSheet";
import { HomeworkSubmissionRow } from "@/components/golf/homework/HomeworkSubmissionRow";
import {
    createFileFromDocument,
    createFileFromPickerAsset,
    createHomeworkDraft,
    getHomeworkDisplayState,
    homeworkDraftKey,
    HomeworkFileValidationError,
    isImageFile,
    isVideoFile,
    type HomeworkDraft,
} from "@/components/golf/homework/homework-utils";
import { FormTextInput } from "@/components/ui/form";
import {
    ActionButton,
    AnimatedPressable,
    Badge,
    CompactEmptyState,
    Divider,
    ErrorState,
    ImageViewerModal,
    Screen,
    Skeleton,
    triggerSuccessHaptic,
} from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { showAppToast } from "@/design-system/components/AppToast";
import { cn } from "@/design-system/utils/cn";
import { useTheme } from "@/design-system/utils/theme";
import { useMemberHomeworkById, useSubmitMemberHomework } from "@/lib/hook/useMemberLessonFlow";
import { useDayClock } from "@/lib/hook/useMinuteClock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import type { HomeworkSubmissionFile } from "@/service/member-homework.service";
import type { MemberHomeworkSubmissionResponse } from "@/types/member-homework";
import { formatFileSize } from "@/utils/file";
import { getHomeworkTitle } from "@/utils/member-lesson";
import { fmtDateTime, formatDateForDisplay } from "@/utils/time-helper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, usePreventRemove } from "expo-router";
import { Award, Calendar, FileCheck, FileUp, MessageSquare, Video, X } from "lucide-react-native";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { type Control, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
    Alert,
    FlatList,
    Keyboard,
    Linking,
    type ListRenderItem,
    RefreshControl,
    type ScrollViewProps,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type HomeworkParams = {
    homeworkId: string;
};

const submissionKeyExtractor = (submission: MemberHomeworkSubmissionResponse) => `submission-${submission.id}`;
const SUBMISSION_LIST_CONTENT_STYLE = {
    paddingHorizontal: 16,
    paddingBottom: 24,
} as const;

function SubmissionSeparator() {
    return <View className="h-3" />;
}

function showPermissionSettingsAlert(t: (key: string) => string, message: string) {
    Alert.alert(t("common.permissionTitle"), message, [
        { text: t("common.cancel"), style: "cancel" },
        {
            text: t("common.openSettings"),
            onPress: () => {
                void Linking.openSettings();
            },
        },
    ]);
}

type HomeworkMemoFormValues = {
    memo: string;
};

const renderHomeworkScrollComponent = (props: ScrollViewProps) => (
    <KeyboardAwareScrollView {...props} bottomOffset={20} mode="layout" />
);

const HomeworkMemoSection = memo(function HomeworkMemoSection({
    control,
    editable,
}: {
    control: Control<HomeworkMemoFormValues>;
    editable: boolean;
}) {
    const { t } = useTranslation();

    return (
        <FormTextInput
            control={control}
            name="memo"
            label={t("homework.memo")}
            placeholder={t("homework.noteForCoach")}
            editable={editable}
            multiline
            numberOfLines={3}
            maxLength={500}
            showCharacterCount
        />
    );
});

export default function HomeworkDetailScreen() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { homeworkId } = useLocalSearchParams<HomeworkParams>();
    const numericHomeworkId = Number(homeworkId);
    const draftKey = homeworkDraftKey(numericHomeworkId);
    const [selectedFile, setSelectedFile] = useState<HomeworkSubmissionFile | null>(null);
    const [isSourceSheetVisible, setIsSourceSheetVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState<{
        uri: string;
        title: string;
    } | null>(null);
    const [isPicking, setIsPicking] = useState(false);
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);
    const [isDiscardingDraft, setIsDiscardingDraft] = useState(false);
    const memoForm = useForm<HomeworkMemoFormValues>({
        defaultValues: { memo: "" },
        mode: "onTouched",
    });
    const memoValue = useWatch({ control: memoForm.control, name: "memo" });
    const referenceTime = useDayClock();
    const pendingDraftWrite = useRef<Promise<void> | null>(null);
    const discardingDraft = useRef(false);
    const submitting = useRef(false);
    const picking = useRef(false);
    const { data, isLoading, isError, refetch, isRefetching } = useMemberHomeworkById(numericHomeworkId);
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        refetch({ cancelRefetch: false }),
    );
    const { mutate: submitHomework, isPending: isSubmitting } = useSubmitMemberHomework();
    const isDraftEditingDisabled = isSubmitting || isDiscardingDraft;
    const isSubmitDisabled = !selectedFile || isDraftEditingDisabled;

    const queueDraftWrite = useCallback(
        (draft: HomeworkDraft | null) => {
            // Finish older autosaves before writing or removing the latest draft.
            const write = (pendingDraftWrite.current ?? Promise.resolve()).then(() =>
                draft ? AsyncStorage.setItem(draftKey, JSON.stringify(draft)) : AsyncStorage.removeItem(draftKey),
            );
            pendingDraftWrite.current = write.catch(() => {
                // A failed write must not block the next queued operation.
            });
            return write;
        },
        [draftKey],
    );

    useEffect(() => {
        let isActive = true;
        void AsyncStorage.getItem(draftKey)
            .then((raw) => {
                if (!isActive || discardingDraft.current || !raw) return;
                const draft = JSON.parse(raw) as HomeworkDraft;
                if (draft.memo && !memoForm.getValues("memo")) {
                    memoForm.reset({ memo: draft.memo });
                }
                if (draft.file) {
                    const file = new File(draft.file.uri);
                    if (file.exists) {
                        setSelectedFile(draft.file);
                    }
                }
            })
            .catch(() => {
                // A broken draft must never block the composer.
            })
            .finally(() => {
                if (isActive) setIsDraftLoaded(true);
            });
        return () => {
            isActive = false;
        };
    }, [draftKey, memoForm]);

    useEffect(() => {
        if (!isDraftLoaded || isDiscardingDraft || discardingDraft.current) {
            return;
        }
        void queueDraftWrite(createHomeworkDraft(memoValue, selectedFile));
    }, [isDiscardingDraft, isDraftLoaded, memoValue, queueDraftWrite, selectedFile]);

    const discardDraft = async (repeat: () => void) => {
        if (discardingDraft.current) return;
        discardingDraft.current = true;
        setIsDiscardingDraft(true);

        try {
            await queueDraftWrite(null);
            setSelectedFile(null);
            memoForm.reset({ memo: "" });
            repeat();
        } catch {
            showAppToast({ message: t("common.requestError"), type: "error" });
        } finally {
            discardingDraft.current = false;
            setIsDiscardingDraft(false);
        }
    };

    const hasDraft = Boolean(selectedFile) || Boolean(memoValue?.trim());
    usePreventRemove(hasDraft && !isSubmitting, ({ repeat }) => {
        if (discardingDraft.current) return;
        Alert.alert(t("homework.discardDraftTitle"), t("homework.discardDraftMessage"), [
            { text: t("common.cancel"), style: "cancel" },
            {
                text: t("homework.discardDraft"),
                style: "destructive",
                onPress: () => {
                    void discardDraft(repeat);
                },
            },
        ]);
    });

    const homeworkDetail = data?.data;
    const homework = homeworkDetail?.homework;
    const submissions = homeworkDetail?.submissions ?? [];
    const latestReview = submissions.find((submission) => submission.review)?.review;
    const displayState = homework ? getHomeworkDisplayState(homework, submissions, referenceTime) : "assigned";
    const displayStateLabel = t(`homework.state_${displayState}`);
    const displayStateTone = {
        approved: { className: "bg-success/10", color: "success" as const },
        needsRevision: { className: "bg-danger/10", color: "danger" as const },
        awaitingReview: {
            className: "bg-primary/10",
            color: "primary" as const,
        },
        overdue: { className: "bg-danger/10", color: "danger" as const },
        dueSoon: { className: "bg-warning/10", color: "warning" as const },
        assigned: {
            className: "bg-muted",
            color: "mutedForeground" as const,
        },
    }[displayState];

    const reviewCardClassName =
        displayState === "approved"
            ? "border-success/25 bg-success/5"
            : displayState === "needsRevision"
              ? "border-danger/25 bg-danger/5"
              : "border-border bg-surface";
    const reviewAccentColor =
        displayState === "approved"
            ? colors.success
            : displayState === "needsRevision"
              ? colors.danger
              : colors.primary;
    const reviewAccentToken =
        displayState === "approved"
            ? ("success" as const)
            : displayState === "needsRevision"
              ? ("danger" as const)
              : ("primary" as const);

    const refreshControl = <RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />;

    const renderSubmission: ListRenderItem<MemberHomeworkSubmissionResponse> = useCallback(
        ({ item }) => (
            <HomeworkSubmissionRow submission={item} onPreviewImage={(uri, title) => setPreviewImage({ uri, title })} />
        ),
        [],
    );

    const openSourceSheet = () => {
        if (isDraftEditingDisabled || isPicking) return;
        Keyboard.dismiss();
        setIsSourceSheetVisible(true);
    };

    const closeSourceSheet = () => {
        if (picking.current || isSubmitting) {
            return;
        }
        setIsSourceSheetVisible(false);
    };

    const handlePickFile = async () => {
        if (isSubmitting || discardingDraft.current || picking.current) {
            return;
        }

        picking.current = true;
        setIsPicking(true);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
                multiple: false,
                type: ["image/jpeg", "image/png", "image/webp", "video/mp4"],
            });
            setIsSourceSheetVisible(false);

            if (result.canceled || !result.assets?.[0]) {
                return;
            }

            setSelectedFile(createFileFromDocument(result.assets[0], t));
        } catch (error) {
            setIsSourceSheetVisible(false);
            showAppToast({
                message:
                    error instanceof HomeworkFileValidationError ? error.message : t("homework.fileSelectionFailed"),
                type: "error",
            });
        } finally {
            picking.current = false;
            setIsPicking(false);
        }
    };

    const handlePickFromLibrary = async () => {
        if (isSubmitting || discardingDraft.current || picking.current) {
            return;
        }

        picking.current = true;
        setIsPicking(true);
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                setIsSourceSheetVisible(false);
                showPermissionSettingsAlert(t, t("homework.libraryPermission"));
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images", "videos"],
                allowsMultipleSelection: false,
                quality: 0.85,
            });
            setIsSourceSheetVisible(false);

            if (result.canceled || !result.assets?.[0]) {
                return;
            }

            setSelectedFile(createFileFromPickerAsset(result.assets[0], t));
        } catch (error) {
            setIsSourceSheetVisible(false);
            showAppToast({
                message:
                    error instanceof HomeworkFileValidationError ? error.message : t("homework.fileSelectionFailed"),
                type: "error",
            });
        } finally {
            picking.current = false;
            setIsPicking(false);
        }
    };

    const handleRecordVideo = async () => {
        if (isSubmitting || discardingDraft.current || picking.current) {
            return;
        }

        picking.current = true;
        setIsPicking(true);
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                setIsSourceSheetVisible(false);
                showPermissionSettingsAlert(t, t("profile.cameraPermission"));
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ["videos"],
                videoMaxDuration: 60,
                quality: 1,
            });
            setIsSourceSheetVisible(false);

            if (result.canceled || !result.assets?.[0]) {
                return;
            }

            setSelectedFile(createFileFromPickerAsset(result.assets[0], t));
        } catch (error) {
            setIsSourceSheetVisible(false);
            showAppToast({
                message:
                    error instanceof HomeworkFileValidationError ? error.message : t("homework.fileSelectionFailed"),
                type: "error",
            });
        } finally {
            picking.current = false;
            setIsPicking(false);
        }
    };

    const handleRemoveFile = () => {
        if (isSubmitting || discardingDraft.current) return;
        setSelectedFile(null);
    };

    const handleSubmit = () => {
        if (!homework || !selectedFile || isSubmitting || discardingDraft.current || submitting.current) {
            return;
        }

        submitting.current = true;
        submitHomework(
            {
                homeworkId: homework.homeworkId,
                file: selectedFile,
                memberMemo: memoForm.getValues("memo"),
            },
            {
                onSuccess: () => {
                    triggerSuccessHaptic();
                    void queueDraftWrite(null);
                    setSelectedFile(null);
                    memoForm.reset({ memo: "" });
                },
                onSettled: () => {
                    submitting.current = false;
                },
            },
        );
    };

    if (isLoading) {
        return (
            <Screen contentClassName="gap-6">
                <HomeworkDetailSkeleton />
            </Screen>
        );
    }

    if (isError && !data) {
        return (
            <Screen contentClassName="grow" refreshControl={refreshControl}>
                <ErrorState
                    title={t("homework.failedTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={() => {
                        void refetch();
                    }}
                />
            </Screen>
        );
    }

    if (!homework) {
        return (
            <Screen contentClassName="gap-6" refreshControl={refreshControl}>
                <CompactEmptyState title={t("homework.notAvailableTitle")} message={t("homework.notFoundMessage")} />
            </Screen>
        );
    }

    const description = homework.description?.trim() || null;

    return (
        <>
            <ImageViewerModal
                visible={Boolean(previewImage)}
                imageUri={previewImage?.uri ?? null}
                title={previewImage?.title}
                onClose={() => setPreviewImage(null)}
            />

            <HomeworkSourceSheet
                isPresented={isSourceSheetVisible}
                isSubmitting={isSubmitting}
                isPicking={isPicking}
                isDraftEditingDisabled={isDraftEditingDisabled}
                onDismiss={closeSourceSheet}
                onPickFromLibrary={handlePickFromLibrary}
                onRecordVideo={handleRecordVideo}
                onPickFile={handlePickFile}
            />

            <Screen
                keyboardAware
                scroll={false}
                horizontalPadding={false}
                contentClassName="min-h-0"
                footer={
                    <ActionButton
                        label={t("homework.submitHomework")}
                        disabled={isSubmitDisabled}
                        loading={isSubmitting}
                        haptic="selection"
                        onPress={handleSubmit}
                    />
                }
            >
                <FlatList
                    data={submissions}
                    keyExtractor={submissionKeyExtractor}
                    renderItem={renderSubmission}
                    ItemSeparatorComponent={SubmissionSeparator}
                    renderScrollComponent={renderHomeworkScrollComponent}
                    refreshControl={refreshControl}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={SUBMISSION_LIST_CONTENT_STYLE}
                    ListHeaderComponent={
                        <View className="gap-6 pb-3">
                            <View className="gap-3">
                                <View className="gap-2">
                                    <View className="flex-row flex-wrap items-center justify-between gap-2">
                                        <Badge
                                            label={displayStateLabel}
                                            className={displayStateTone.className}
                                            color={displayStateTone.color}
                                        />

                                        <View className="flex-row items-center gap-1.5">
                                            <Calendar size={15} color={colors.mutedForeground} strokeWidth={2} />
                                            <AppText
                                                variant="caption"
                                                color="mutedForeground"
                                                wrap={false}
                                                tabular
                                                textStyle={{ fontWeight: "600" }}
                                            >
                                                {homework.dueAt
                                                    ? t("homework.dueDate", {
                                                          date: formatDateForDisplay(homework.dueAt),
                                                      })
                                                    : t("homework.noDueDate")}
                                            </AppText>
                                        </View>
                                    </View>

                                    <AppText variant="h2">{getHomeworkTitle(homework)}</AppText>
                                </View>

                                {description ? (
                                    <AppText variant="body" color="mutedForeground">
                                        {description}
                                    </AppText>
                                ) : (
                                    <AppText variant="subtext" color="mutedForeground">
                                        {t("homework.noDescription")}
                                    </AppText>
                                )}
                            </View>

                            {latestReview ? (
                                <View className={cn("gap-3 rounded-2xl border p-4", reviewCardClassName)}>
                                    <View className="flex-row items-center justify-between gap-3">
                                        <View className="flex-row items-center gap-2">
                                            <MessageSquare size={15} color={reviewAccentColor} strokeWidth={2} />
                                            <AppText
                                                variant="label"
                                                color={reviewAccentToken}
                                                wrap={false}
                                                textStyle={{
                                                    fontWeight: "700",
                                                }}
                                            >
                                                {t("homework.coachReview")}
                                            </AppText>
                                        </View>

                                        {latestReview.score != null ? (
                                            <View className="flex-row items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1">
                                                <Award size={13} color={colors.warning} strokeWidth={2} />
                                                <AppText
                                                    variant="caption"
                                                    color="foreground"
                                                    wrap={false}
                                                    tabular
                                                    textStyle={{
                                                        fontWeight: "700",
                                                    }}
                                                >
                                                    {t("homework.score", {
                                                        score: latestReview.score,
                                                    })}
                                                </AppText>
                                            </View>
                                        ) : null}
                                    </View>

                                    <AppText variant="body">
                                        {latestReview.coachFeedback?.trim() || t("homework.noReviewComment")}
                                    </AppText>

                                    {latestReview.reviewedAt ? (
                                        <AppText variant="caption" color="mutedForeground" tabular>
                                            {t("homework.reviewedAt", {
                                                date: fmtDateTime(latestReview.reviewedAt),
                                            })}
                                        </AppText>
                                    ) : null}
                                </View>
                            ) : null}

                            <Divider className="bg-border/70" />

                            <View className="gap-4">
                                <AppText variant="subtitle" textStyle={{ fontWeight: "700" }}>
                                    {t("homework.submission")}
                                </AppText>

                                {selectedFile ? (
                                    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
                                        {isImageFile(selectedFile) ? (
                                            <AnimatedPressable
                                                accessibilityRole="imagebutton"
                                                accessibilityLabel={t("sessionResources.openImage", {
                                                    title: selectedFile.name,
                                                })}
                                                haptic="selection"
                                                className="shrink-0 overflow-hidden rounded-xl"
                                                onPress={() =>
                                                    setPreviewImage({
                                                        uri: selectedFile.uri,
                                                        title: selectedFile.name,
                                                    })
                                                }
                                            >
                                                <Image
                                                    source={{
                                                        uri: selectedFile.uri,
                                                    }}
                                                    contentFit="cover"
                                                    recyclingKey={selectedFile.uri}
                                                    className="h-14 w-14 rounded-xl bg-muted"
                                                />
                                            </AnimatedPressable>
                                        ) : (
                                            <View className="h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                                {isVideoFile(selectedFile) ? (
                                                    <Video size={22} color={colors.primary} strokeWidth={2} />
                                                ) : (
                                                    <FileCheck size={22} color={colors.primary} strokeWidth={2} />
                                                )}
                                            </View>
                                        )}

                                        <AnimatedPressable
                                            accessibilityRole="button"
                                            accessibilityLabel={t("homework.chooseFile")}
                                            disabled={isDraftEditingDisabled || isPicking}
                                            haptic="selection"
                                            style={{ flex: 1, minWidth: 0 }}
                                            className="gap-1"
                                            onPress={openSourceSheet}
                                        >
                                            <AppText variant="label" numberOfLines={2} ellipsizeMode="middle">
                                                {selectedFile.name}
                                            </AppText>
                                            <AppText
                                                variant="caption"
                                                color="mutedForeground"
                                                numberOfLines={1}
                                                tabular
                                            >
                                                {formatFileSize(selectedFile.size)}
                                            </AppText>
                                        </AnimatedPressable>

                                        <AnimatedPressable
                                            accessibilityRole="button"
                                            accessibilityLabel={t("homework.removeFile")}
                                            disabled={isDraftEditingDisabled}
                                            hitSlop={6}
                                            haptic="selection"
                                            className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted"
                                            onPress={handleRemoveFile}
                                        >
                                            <X size={16} color={colors.mutedForeground} strokeWidth={2} />
                                        </AnimatedPressable>
                                    </View>
                                ) : (
                                    <AnimatedPressable
                                        accessibilityRole="button"
                                        accessibilityLabel={t("homework.chooseFile")}
                                        disabled={isDraftEditingDisabled || isPicking}
                                        haptic="selection"
                                        className="items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-6 active:bg-primary/10 disabled:opacity-60"
                                        onPress={openSourceSheet}
                                    >
                                        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                                            <FileUp size={20} color={colors.primary} strokeWidth={2} />
                                        </View>
                                        <View className="items-center gap-1">
                                            <AppText variant="label" color="primary">
                                                {t("homework.chooseFile")}
                                            </AppText>
                                            <AppText variant="caption" color="mutedForeground" align="center">
                                                {t("homework.uploadHint")}
                                            </AppText>
                                        </View>
                                    </AnimatedPressable>
                                )}

                                <HomeworkMemoSection control={memoForm.control} editable={!isDraftEditingDisabled} />
                            </View>

                            <View className="gap-3">
                                <View className="flex-row items-baseline justify-between gap-4">
                                    <AppText variant="subtitle" wrap={false} textStyle={{ fontWeight: "700" }}>
                                        {t("homework.submissionHistory")}
                                    </AppText>
                                    {submissions.length > 0 ? (
                                        <AppText
                                            variant="caption"
                                            color="mutedForeground"
                                            wrap={false}
                                            tabular
                                            textStyle={{ fontWeight: "600" }}
                                        >
                                            {String(submissions.length)}
                                        </AppText>
                                    ) : null}
                                </View>

                                {submissions.length === 0 ? (
                                    <CompactEmptyState
                                        title={t("homework.noSubmissionsTitle")}
                                        message={t("homework.noSubmissionsMessage")}
                                    />
                                ) : null}
                            </View>
                        </View>
                    }
                    initialNumToRender={6}
                    maxToRenderPerBatch={8}
                    windowSize={7}
                />
            </Screen>
        </>
    );
}

function HomeworkDetailSkeleton() {
    return (
        <>
            <View className="gap-3">
                <View className="flex-row items-center justify-between">
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-4 w-28 rounded-full" />
                </View>
                <Skeleton className="h-8 w-4/5 rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
            </View>

            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
        </>
    );
}
