import { NativeText } from "@/design-system/components/NativeText";
import { typography } from "@/design-system/utils/typography";
import { View } from "react-native";

type Props = {
    label: string;
    length: number;
};

function TitleSectionWithBadge({ label, length }: Props) {

    return (
        <View className="flex-row items-center gap-2">
            <NativeText variant="h3" color="secondaryForeground" wrap={false}>
                {label}
            </NativeText>

            <View className="min-w-[24px] items-center justify-center rounded-full bg-notification px-1.5 py-1">
                <NativeText
                    variant="count"
                    wrap={false}
                    textStyle={{ lineHeight: typography.caption.lineHeight, fontSize: typography.caption.fontSize, fontWeight: "700" as const, color: "#ffffff" }}
                >
                    {String(length ?? "")}
                </NativeText>
            </View>
        </View>
    );
}
export default TitleSectionWithBadge;
