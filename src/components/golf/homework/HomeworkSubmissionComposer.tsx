import { HomeworkMemoSection } from "@/components/golf/homework/HomeworkMemoSection";
import type { HomeworkSubmissionFile } from "@/service/member-homework.service";
import { AnimatedPressable } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { useTheme } from "@/design-system/utils/theme";
import { formatFileSize } from "@/utils/file";
import { Image } from "expo-image";
import { usePreventRemove } from "expo-router";
import FileCheck from "lucide-react-native/icons/file-check";
import FileUp from "lucide-react-native/icons/file-up";
import Video from "lucide-react-native/icons/video";
import X from "lucide-react-native/icons/x";
import { useWatch, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { isImageFile, isVideoFile } from "./homework-utils";

type HomeworkDraftGuardProps = {
    control: Control<{ memo: string }>;
    selectedFile: HomeworkSubmissionFile | null;
    isSubmitting: boolean;
    onPreventRemove: (repeat: () => void) => void;
};

export function HomeworkDraftGuard({ control, selectedFile, isSubmitting, onPreventRemove }: HomeworkDraftGuardProps) {
    const memo = useWatch({ control, name: "memo" });
    usePreventRemove((Boolean(selectedFile) || Boolean(memo.trim())) && !isSubmitting, ({ repeat }) => {
        onPreventRemove(repeat);
    });
    return null;
}

type HomeworkSubmissionComposerProps = HomeworkDraftGuardProps & {
    isEditingDisabled: boolean;
    isPicking: boolean;
    onOpenSource: () => void;
    onRemoveFile: () => void;
    onPreviewImage: (uri: string, title: string) => void;
};

export function HomeworkSubmissionComposer({
    control,
    selectedFile,
    isEditingDisabled,
    isSubmitting,
    onPreventRemove,
    isPicking,
    onOpenSource,
    onRemoveFile,
    onPreviewImage,
}: HomeworkSubmissionComposerProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    return (
        <View className="gap-4">
            <HomeworkDraftGuard {...{ control, selectedFile, isSubmitting, onPreventRemove }} />
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
                            onPress={() => onPreviewImage(selectedFile.uri, selectedFile.name)}
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
                        disabled={isEditingDisabled || isPicking}
                        haptic="selection"
                        style={{ flex: 1, minWidth: 0 }}
                        className="gap-1"
                        onPress={onOpenSource}
                    >
                        <AppText variant="label" numberOfLines={2} ellipsizeMode="middle">
                            {selectedFile.name}
                        </AppText>
                        <AppText variant="caption" color="mutedForeground" numberOfLines={1} tabular>
                            {formatFileSize(selectedFile.size)}
                        </AppText>
                    </AnimatedPressable>

                    <AnimatedPressable
                        accessibilityRole="button"
                        accessibilityLabel={t("homework.removeFile")}
                        disabled={isEditingDisabled}
                        hitSlop={6}
                        haptic="selection"
                        className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted"
                        onPress={onRemoveFile}
                    >
                        <X size={16} color={colors.mutedForeground} strokeWidth={2} />
                    </AnimatedPressable>
                </View>
            ) : (
                <AnimatedPressable
                    accessibilityRole="button"
                    accessibilityLabel={t("homework.chooseFile")}
                    disabled={isEditingDisabled || isPicking}
                    haptic="selection"
                    className="items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-6 active:bg-primary/10 disabled:opacity-60"
                    onPress={onOpenSource}
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

            <HomeworkMemoSection control={control} editable={!isEditingDisabled} />
        </View>
    );
}
