import { AppText as Text } from "@/design-system";
import { useThemeColors } from "@/design-system/utils/theme";
import { StyleSheet, View } from 'react-native';

type Props = {
    label: string;
    length: number;
}

function TitleSectionWithBadge({ label, length }: Props) {
    const colors = useThemeColors();

    return (
        <View style={style.titleRow}>
            <Text style={[style.sectionTitle, { color: colors.secondaryForeground }]}>
                {label}
            </Text>

            <View style={[style.lengthBadge, { backgroundColor: colors.primary }]}>
                <Text style={[style.lengthBadgeText, { color: colors.primaryForeground }]}>
                    {length}
                </Text>
            </View>
        </View>)
}

const style = StyleSheet.create({
    titleRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: 30,
        marginBottom: 16,
    },
    lengthBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
        transform: [{ translateY: -2 }],
    },
    lengthBadgeText: {
        fontSize: 12,
        fontWeight: "700",
    }
});
export default TitleSectionWithBadge
