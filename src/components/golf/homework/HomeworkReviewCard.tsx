import { cn } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { useTheme } from "@/design-system/utils/theme";
import type { MemberHomeworkSubmissionResponse } from "@/types/member-homework";
import { fmtDateTime } from "@/utils/time-helper";
import Award from "lucide-react-native/icons/award";
import MessageSquare from "lucide-react-native/icons/message-square";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { getHomeworkDisplayState } from "./homework-utils";

type HomeworkReview = NonNullable<MemberHomeworkSubmissionResponse["review"]>;

type HomeworkReviewCardProps = {
    review: HomeworkReview;
    displayState: ReturnType<typeof getHomeworkDisplayState>;
};

export function HomeworkReviewCard({ review, displayState }: HomeworkReviewCardProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();

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

    return (
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

                {review.score != null ? (
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
                                score: review.score,
                            })}
                        </AppText>
                    </View>
                ) : null}
            </View>

            <AppText variant="body">{review.coachFeedback?.trim() || t("homework.noReviewComment")}</AppText>

            {review.reviewedAt ? (
                <AppText variant="caption" color="mutedForeground" tabular>
                    {t("homework.reviewedAt", {
                        date: fmtDateTime(review.reviewedAt),
                    })}
                </AppText>
            ) : null}
        </View>
    );
}
