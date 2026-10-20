import { NativeText } from "@/design-system/components/NativeText";
import { cn } from "@/design-system/utils/cn";
import { typography } from "@/design-system/utils/typography";
import { View } from "react-native";

type Props = {
    label: string;
    length: number;
    variant?: "h3" | "body";
    tone?: "notification" | "primary";
};

function TitleSectionWithBadge({ label, length, variant = "h3", tone = "notification" }: Props) {

    return (
        <View className="min-w-0 flex-row items-center gap-2">
            <NativeText
                variant={variant}
                color={variant === "h3" ? "secondaryForeground" : "foreground"}
                wrap={false}
                numberOfLines={variant === "body" ? 2 : undefined}
                style={variant === "body" ? { flexShrink: 1, minWidth: 0 } : undefined}
            >
                {label}
            </NativeText>

            <View className={cn(
                "min-w-[24px] shrink-0 items-center justify-center rounded-full px-1.5 py-1",
                tone === "primary" ? "bg-primary" : "bg-notification",
            )}>
                <NativeText
                    variant="count"
                    color="primaryForeground"
                    wrap={false}
                    textStyle={{ lineHeight: typography.caption.lineHeight, fontSize: typography.caption.fontSize, fontWeight: "700" as const }}
                >
                    {String(length ?? "")}
                </NativeText>
            </View>
        </View>
    );
}
export default TitleSectionWithBadge;
