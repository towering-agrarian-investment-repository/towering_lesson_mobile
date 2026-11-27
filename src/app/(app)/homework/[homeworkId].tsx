import { HomeworkDetailHeader } from "@/components/golf/homework/HomeworkDetailHeader";
import { HomeworkDetailSkeleton } from "@/components/golf/homework/HomeworkDetailSkeleton";
import { HomeworkReviewCard } from "@/components/golf/homework/HomeworkReviewCard";
import { HomeworkSourceSheet } from "@/components/golf/homework/HomeworkSourceSheet";
import { HomeworkDraftGuard, HomeworkSubmissionComposer } from "@/components/golf/homework/HomeworkSubmissionComposer";
import { HomeworkSubmissionRow } from "@/components/golf/homework/HomeworkSubmissionRow";
import {
    createFileFromDocument,
    createFileFromPickerAsset,
    createHomeworkDraft,
    getHomeworkDisplayState,
    homeworkDraftKey,
    HomeworkFileValidationError,
    type HomeworkDraft,
} from "@/components/golf/homework/homework-utils";
import {
    ActionButton,
    CompactEmptyState,
    Divider,
    ErrorState,
    ImageViewerModal,
    Screen,
    triggerSuccessHaptic,
} from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { showAppToast } from "@/design-system/components/AppToast";
import { useMemberHomeworkById, useSubmitMemberHomework } from "@/lib/hook/useMemberLessonFlow";
import { useDayClock } from "@/lib/hook/useMinuteClock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import type { HomeworkSubmissionFile } from "@/service/member-homework.service";
import type { MemberHomeworkSubmissionResponse } from "@/types/member-homework";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
    Alert,
    AppState,
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

type HomeworkMemoFormValues = {
    memo: string;
};

const DRAFT_AUTOSAVE_DELAY_MS = 450;

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

const renderHomeworkScrollComponent = (props: ScrollViewProps) => (
    <KeyboardAwareScrollView {...props} bottomOffset={20} mode="layout" />
);

export default function HomeworkDetailScreen() {
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
    const referenceTime = useDayClock();
    const scheduledDraftWrite = useRef<{ timer: ReturnType<typeof setTimeout>; write: () => void } | null>(null);
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

    const flushDraftAutosave = useCallback(() => {
        const pending = scheduledDraftWrite.current;
        if (!pending) return;
        scheduledDraftWrite.current = null;
        clearTimeout(pending.timer);
        pending.write();
    }, []);

    useEffect(() => {
        if (!isDraftLoaded || isDiscardingDraft) return;

        const scheduleAutosave = (memo: string) => {
            if (discardingDraft.current) return;
            clearTimeout(scheduledDraftWrite.current?.timer);
            scheduledDraftWrite.current = {
                timer: setTimeout(flushDraftAutosave, DRAFT_AUTOSAVE_DELAY_MS),
                write: () => {
                    void queueDraftWrite(createHomeworkDraft(memo, selectedFile));
                },
            };
        };

        scheduleAutosave(memoForm.getValues("memo"));
        return memoForm.subscribe({
            name: "memo",
            exact: true,
            formState: { values: true },
            callback: ({ values }) => scheduleAutosave(values.memo),
        });
    }, [flushDraftAutosave, isDiscardingDraft, isDraftLoaded, memoForm, queueDraftWrite, selectedFile]);

    useFocusEffect(useCallback(() => flushDraftAutosave, [flushDraftAutosave]));

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (state) => {
            if (state !== "active") flushDraftAutosave();
        });
        return () => {
            subscription.remove();
            flushDraftAutosave();
        };
    }, [flushDraftAutosave]);

    const discardDraft = async (repeat: () => void) => {
        if (discardingDraft.current) return;
        flushDraftAutosave();
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

    const onPreventRemove = (repeat: () => void) => {
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
    };
    const draftGuardProps = { control: memoForm.control, selectedFile, isSubmitting, onPreventRemove };

    const homeworkDetail = data?.data;
    const homework = homeworkDetail?.homework;
    const submissions = homeworkDetail?.submissions ?? [];
    const latestReview = submissions.find((submission) => submission.review)?.review;
    const displayState = homework ? getHomeworkDisplayState(homework, submissions, referenceTime) : "assigned";

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
                    clearTimeout(scheduledDraftWrite.current?.timer);
                    scheduledDraftWrite.current = null;
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
                <HomeworkDraftGuard {...draftGuardProps} />
                <HomeworkDetailSkeleton />
            </Screen>
        );
    }

    if (isError && !data) {
        return (
            <Screen contentClassName="grow" refreshControl={refreshControl}>
                <HomeworkDraftGuard {...draftGuardProps} />
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
                <HomeworkDraftGuard {...draftGuardProps} />
                <CompactEmptyState title={t("homework.notAvailableTitle")} message={t("homework.notFoundMessage")} />
            </Screen>
        );
    }

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
                            <HomeworkDetailHeader homework={homework} displayState={displayState} />

                            {latestReview ? (
                                <HomeworkReviewCard review={latestReview} displayState={displayState} />
                            ) : null}

                            <Divider className="bg-border/70" />

                            <HomeworkSubmissionComposer
                                {...draftGuardProps}
                                isEditingDisabled={isDraftEditingDisabled}
                                isPicking={isPicking}
                                onOpenSource={openSourceSheet}
                                onRemoveFile={handleRemoveFile}
                                onPreviewImage={(uri, title) => setPreviewImage({ uri, title })}
                            />

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
