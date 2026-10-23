import { NativeText } from "@/design-system/components/NativeText";
import { typography } from "@/design-system/utils/typography";
import { View } from "react-native";

type Props = {
    label: string;
    length: number | string;
    variant?: "h3" | "body";
};

function TitleSectionWithBadge({ label, length, variant = "h3" }: Props) {

    return (
        <View className="min-w-0 flex-row items-center gap-2">
            <NativeText
                variant={variant}
                color="foreground"
                wrap={false}
                numberOfLines={variant === "body" ? 2 : undefined}
                style={variant === "body" ? { flexShrink: 1, minWidth: 0 } : undefined}
            >
                {label}
            </NativeText>

            <View className="min-w-[24px] shrink-0 items-center justify-center rounded-full bg-danger px-1.5 py-1">
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
