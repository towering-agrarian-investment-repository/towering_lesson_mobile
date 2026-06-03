import { AppText as Text } from "@/design-system";
import { useThemeColors } from "@/design-system/utils/theme";
import { StyleSheet, View } from "react-native";

type Props = {}

export default function HomeHeader() {
    const colors = useThemeColors();
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    return (
        <View style={styles.header}>
            <Text style={[styles.date, { color: colors.secondaryForeground }]}>
                {currentDate}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    date: {
        fontSize: 14,
        marginTop: 4,
        marginBottom: 30,
    },
});
