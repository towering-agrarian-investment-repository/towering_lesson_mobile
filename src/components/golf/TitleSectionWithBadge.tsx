import { AppText as Text } from "@/design-system";
import { View } from "react-native";

type Props = {
    label: string;
    length: number;
}

function TitleSectionWithBadge({ label, length }: Props) {
    return (
        <View className="flex-row items-center gap-2">
            <Text variant="h3" className="text-secondary-foreground">
                {label}
            </Text>

            <View className="min-w-[24px] items-center justify-center rounded-full bg-notification px-1.5 py-1">
                <Text
                    variant="count"
                    className="text-xs font-bold text-white"
                >
                    {length}
                </Text>
            </View>
        </View>
    );
}
export default TitleSectionWithBadge
