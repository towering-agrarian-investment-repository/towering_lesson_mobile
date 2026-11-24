import { AnimatedPressable, Badge } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { showAppToast } from "@/design-system/components/AppToast";
import { useTheme } from "@/design-system/utils/theme";
import type { MemberHomeworkSubmissionResponse } from "@/types/member-homework";
import { formatFileSize } from "@/utils/file";
import { formatType } from "@/utils/format-enum";
import { RESOURCE_IMAGE_EXTENSIONS, isAllowedExtension, isAllowedMimeType } from "@/utils/media";
import { openExternalUrl } from "@/utils/open-external-url";
import { getHomeworkSubmissionTone } from "@/utils/status-tone";
import { fmtDateTime } from "@/utils/time-helper";
import { ExternalLink, FileCheck } from "lucide-react-native";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export const HomeworkSubmissionRow = memo(function HomeworkSubmissionRow({
    submission,
    onPreviewImage,
}: {
    submission: MemberHomeworkSubmissionResponse;
    onPreviewImage: (uri: string, title: string) => void;
}) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const url = submission.fileUrl?.trim() || submission.externalUrl?.trim();
    const title =
        submission.originalFileName?.trim() ||
        submission.fileUrl?.split("/").pop() ||
        submission.submittedByName?.trim() ||
        t("homework.submissionWithId", { id: submission.id });
    const isImageSubmission =
        Boolean(url) &&
        (isAllowedMimeType(submission.mediaType, ["image/jpeg", "image/png", "image/webp"]) ||
            isAllowedExtension(submission.originalFileName || url, RESOURCE_IMAGE_EXTENSIONS));
    const metaParts = [
        submission.submittedAt ? fmtDateTime(submission.submittedAt) : null,
        formatFileSize(submission.fileSizeBytes),
    ].filter((value) => value && value !== "-");
    const memoText = submission.memberMemo?.trim() || null;
    const statusTone = submission.status ? getHomeworkSubmissionTone(submission.status) : null;

    const handleOpen = url
        ? () => {
              if (isImageSubmission) {
                  onPreviewImage(url, title);
                  return;
              }
              void openExternalUrl(url, colors).catch(() => {
                  showAppToast({
                      message: t("common.unableToOpenLink"),
                      type: "error",
                  });
              });
          }
        : undefined;

    return (
        <AnimatedPressable
            accessibilityRole={url ? "button" : "text"}
            accessibilityLabel={title}
            disabled={!url}
            haptic={url ? "selection" : false}
            className="min-h-16 gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 active:bg-surface"
            onPress={handleOpen}
        >
            <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <FileCheck size={18} color={colors.mutedForeground} strokeWidth={2} />
                </View>

                <View style={{ flex: 1, minWidth: 0 }} className="gap-1">
                    <AppText variant="label" numberOfLines={2}>
                        {title}
                    </AppText>
                    {metaParts.length > 0 ? (
                        <AppText variant="caption" color="mutedForeground" numberOfLines={2} tabular>
                            {metaParts.join(" · ")}
                        </AppText>
                    ) : null}
                </View>

                {submission.status && statusTone ? (
                    <View className="shrink-0">
                        <Badge
                            label={formatType(submission.status, t)}
                            size="sm"
                            className={statusTone.className}
                            color={statusTone.color}
                        />
                    </View>
                ) : null}

                {url ? (
                    <View className="shrink-0">
                        <ExternalLink size={16} color={colors.mutedForeground} strokeWidth={2} />
                    </View>
                ) : null}
            </View>

            {memoText ? (
                <AppText variant="subtext" color="mutedForeground" numberOfLines={2}>
                    {memoText}
                </AppText>
            ) : null}
        </AnimatedPressable>
    );
});
