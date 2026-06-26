import { Inbox } from "lucide-react-native";
import { View } from "react-native";
import { AppText } from "./AppText";
import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";

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
    const colors = useThemeColors();

    return (
        <View
            className={cn(
                "flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5",
                className,
            )}
        >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Inbox size={18} color={colors.mutedForeground} strokeWidth={2.2} />
            </View>

            <View className="min-w-0 flex-1 gap-0.5">
                <AppText variant="label" className="font-semibold text-foreground">
                    {title}
                </AppText>

                {message ? (
                    <AppText
                        variant="caption"
                        className="leading-5 text-muted-foreground"
                        numberOfLines={2}
                    >
                        {message}
                    </AppText>
                ) : null}
            </View>
        </View>
    );
}
