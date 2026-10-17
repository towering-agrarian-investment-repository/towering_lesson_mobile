import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { NativeText } from "./NativeText";
import { Inbox } from "lucide-react-native";
import { View } from "react-native";

import { cn } from "../utils/cn";

type CompactEmptyStateProps = {
    title: string;
    message?: string;
    className?: string;
};

export function CompactEmptyState({
    title,
    message,
    className,
}: CompactEmptyStateProps) {
    const { colors } = useTheme();

    return (
        <View
            className={cn(
                "flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5",
                className,
            )}
        >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Inbox
                    size={18}
                    color={colors.mutedForeground}
                    strokeWidth={2.2}
                />
            </View>

            <View className="min-w-0 flex-1 gap-0.5">
                <NativeText variant="label" textStyle={{ fontWeight: "600" }}>
                    {title.trim()}
                </NativeText>

                {message ? (
                    <NativeText variant="caption" color="mutedForeground" numberOfLines={2} textStyle={{ lineHeight: typography.subtext.lineHeight }}>
                        {message.trim()}
                    </NativeText>
                ) : null}
            </View>
        </View>
    );
}
