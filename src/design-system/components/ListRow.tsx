import { ChevronRight } from "lucide-react-native";
import { type ReactNode } from "react";
import { Pressable, View, type PressableProps } from "react-native";
import { AppText } from "./AppText";
import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";

type ListRowProps = PressableProps & {
    title: string;
    subtitle?: string;
    meta?: string;
    leading?: ReactNode;
    trailing?: ReactNode;
    showChevron?: boolean;
    className?: string;
    titleClassName?: string;
};

export function ListRow({
    title,
    subtitle,
    meta,
    leading,
    trailing,
    showChevron = true,
    className,
    titleClassName,
    disabled,
    ...props
}: ListRowProps) {
    const colors = useThemeColors();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            disabled={disabled}
            className={cn(
                "min-h-16 flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 active:bg-surface disabled:opacity-60",
                className,
            )}
            {...props}
        >
            {leading ? <View className="shrink-0">{leading}</View> : null}

            <View className="min-w-0 flex-1 gap-1">
                <AppText
                    variant="body"
                    className={cn("text-base text-foreground", titleClassName)}
                    numberOfLines={2}
                >
                    {title}
                </AppText>

                {subtitle ? (
                    <AppText variant="caption" numberOfLines={2}>
                        {subtitle}
                    </AppText>
                ) : null}
            </View>

            {meta ? (
                <AppText variant="meta" className="shrink-0 text-foreground/75">
                    {meta}
                </AppText>
            ) : null}

            {trailing}

            {showChevron ? (
                <ChevronRight
                    size={20}
                    color={colors.mutedForeground}
                    strokeWidth={2.25}
                />
            ) : null}
        </Pressable>
    );
}
