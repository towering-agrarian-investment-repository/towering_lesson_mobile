import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Host, Text } from "@expo/ui";

import { View } from "react-native";

type Props = {
    label: string;
    length: number;
};

function TitleSectionWithBadge({ label, length }: Props) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    return (
        <View className="flex-row items-center gap-2">
            <Host matchContents ignoreSafeArea="all">
                <Text
                    textStyle={{
                        ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale,
                        color: uiColors.secondaryForeground,
                        fontSize: typography.h3.fontSize * uiFontScale,
                    }}
                >
                    {label}
                </Text>
            </Host>

            <View className="min-w-[24px] items-center justify-center rounded-full bg-notification px-1.5 py-1">
                <Host matchContents ignoreSafeArea="all">
                    <Text
                        textStyle={{
                            ...typography.count, lineHeight: typography.caption.lineHeight * uiFontScale,
                            fontSize: typography.caption.fontSize * uiFontScale,
                            fontWeight: "700" as const,
                            color: "#ffffff",
                        }}
                    >
                        {String(length ?? "")}
                    </Text>
                </Host>
            </View>
        </View>
    );
}
export default TitleSectionWithBadge;
