import { AppText } from "@/design-system/components/AppText";
import { cn } from "@/design-system/utils/cn";
import { typography } from "@/design-system/utils/typography";
import { View } from "react-native";

type Props = {
    label: string;
    length: number | string;
    variant?: "h3" | "body";
};

function TitleSectionWithBadge({ label, length, variant = "h3" }: Props) {
    const isZero = length === 0 || length === "0";

    return (
        <View className="min-w-0 flex-row items-center gap-2">
            <AppText
                variant={variant}
                color="foreground"
                wrap={false}
                numberOfLines={variant === "body" ? 2 : undefined}
                style={variant === "body" ? { flexShrink: 1, minWidth: 0 } : undefined}
            >
                {label}
            </AppText>

            <View
                className={cn(
                    "h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5",
                    isZero ? "bg-muted" : "bg-primary/10",
                )}
            >
                <AppText
                    variant="count"
                    color={isZero ? "mutedForeground" : "primary"}
                    wrap={false}
                    textStyle={{
                        lineHeight: typography.caption.lineHeight,
                        fontSize: typography.caption.fontSize,
                        fontWeight: "700",
                    }}
                >
                    {String(length ?? "")}
                </AppText>
            </View>
        </View>
    );
}
export default TitleSectionWithBadge;
