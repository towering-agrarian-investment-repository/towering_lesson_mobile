import { AppText as Text, useThemeColors } from "@/design-system";
import { View } from "react-native";

export default function HomeHeader() {
    const colors = useThemeColors();
    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    return (
        <View className="flex-row items-center justify-between">
            <Text
                variant="meta"
                className="mb-7 mt-1"
                style={{ color: colors.secondaryForeground }}
            >
                {currentDate}
            </Text>
        </View>
    );
}
