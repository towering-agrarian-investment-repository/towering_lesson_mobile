import { Badge } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { useTheme } from "@/design-system/utils/theme";
import type { MemberHomeworkSummaryResponse } from "@/types/member-homework";
import { getHomeworkTitle } from "@/utils/member-lesson";
import { formatDateForDisplay } from "@/utils/time-helper";
import Calendar from "lucide-react-native/icons/calendar";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { getHomeworkDisplayState } from "./homework-utils";

const DISPLAY_STATE_TONES = {
    approved: { className: "bg-success/10", color: "success" },
    needsRevision: { className: "bg-danger/10", color: "danger" },
    awaitingReview: { className: "bg-primary/10", color: "primary" },
    overdue: { className: "bg-danger/10", color: "danger" },
    dueSoon: { className: "bg-warning/10", color: "warning" },
    assigned: { className: "bg-muted", color: "mutedForeground" },
} as const;

type HomeworkDetailHeaderProps = {
    homework: MemberHomeworkSummaryResponse;
    displayState: ReturnType<typeof getHomeworkDisplayState>;
};

export function HomeworkDetailHeader({ homework, displayState }: HomeworkDetailHeaderProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const tone = DISPLAY_STATE_TONES[displayState];
    const description = homework.description?.trim() || null;

    return (
        <View className="gap-3">
            <View className="gap-2">
                <View className="flex-row flex-wrap items-center justify-between gap-2">
                    <Badge label={t(`homework.state_${displayState}`)} className={tone.className} color={tone.color} />

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
    );
}
