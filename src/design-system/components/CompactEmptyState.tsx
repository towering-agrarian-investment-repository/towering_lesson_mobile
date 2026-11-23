import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { CircleAlert, Inbox } from "lucide-react-native";
import { View } from "react-native";
import { cn } from "../utils/cn";
import { AnimatedPressable } from "./AnimatedPressable";
import { AppText } from "./AppText";

type CompactEmptyStateTone = "neutral" | "danger";

type CompactEmptyStateProps = {
    title: string;
    message?: string;
    tone?: CompactEmptyStateTone;
    actionLabel?: string;
    actionPending?: boolean;
    onAction?: () => void;
    className?: string;
};

export function CompactEmptyState({
    title,
    message,
    tone = "neutral",
    actionLabel,
    actionPending = false,
    onAction,
    className,
}: CompactEmptyStateProps) {
    const { colors } = useTheme();
    const isDanger = tone === "danger";
    const hasAction = Boolean(actionLabel && onAction);

    return (
        <View
            accessibilityRole={isDanger ? "alert" : undefined}
            className={cn(
                "w-full items-center justify-center gap-2 px-4 py-6",
                className,
            )}
        >
            {isDanger ? (
                <CircleAlert
                    size={20}
                    color={colors.danger}
                    strokeWidth={1.8}
                />
            ) : (
                <Inbox
                    size={20}
                    color={colors.mutedForeground}
                    strokeWidth={1.8}
                />
            )}

            <View className="w-full items-center gap-1">
                <AppText
                    variant="subtext"
                    color={isDanger ? "danger" : "mutedForeground"}
                    align="center"
                    textStyle={{ fontWeight: "500" }}
                >
                    {title.trim()}
                </AppText>

                {message ? (
                    <AppText
                        variant="caption"
                        color="mutedForeground"
                        align="center"
                        numberOfLines={2}
                        textStyle={{ lineHeight: typography.subtext.lineHeight }}
                    >
                        {message.trim()}
                    </AppText>
                ) : null}
            </View>

            {hasAction ? (
                <AnimatedPressable
                    accessibilityRole="button"
                    accessibilityLabel={actionLabel}
                    accessibilityState={{
                        disabled: actionPending,
                        busy: actionPending,
                    }}
                    disabled={actionPending}
                    haptic="selection"
                    onPress={onAction}
                    style={{ minHeight: 48 }}
                    className={cn(
                        "items-center justify-center rounded-lg px-3",
                        actionPending && "opacity-60",
                    )}
                >
                    <AppText
                        variant="label"
                        color="primary"
                        align="center"
                        wrap={false}
                        textStyle={{
                            fontSize: typography.subtext.fontSize,
                            lineHeight: typography.subtext.lineHeight,
                            fontWeight: "600",
                        }}
                    >
                        {actionLabel}
                    </AppText>
                </AnimatedPressable>
            ) : null}
        </View>
    );
}
