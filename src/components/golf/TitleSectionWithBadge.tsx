import { AppText as Text } from "@/design-system";
import { View } from "react-native";

type Props = {
    label: string;
    length: number;
}

function TitleSectionWithBadge({ label, length }: Props) {
    return (
        <View className="flex-row items-baseline gap-2">
            <Text variant="h3" className="text-secondary-foreground">
                {label}
            </Text>

            <View className="h-[22px] w-[22px] items-center justify-center rounded-full -translate-y-0.5 bg-notification">
                <Text
                    variant="count"
                    className="text-xs font-bold text-primary-foreground"
                >
                    {length}
                </Text>
            </View>
        </View>
    );
}
export default TitleSectionWithBadge
