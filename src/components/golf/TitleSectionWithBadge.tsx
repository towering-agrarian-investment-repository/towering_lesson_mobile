import { globalStyles } from '@/styles/global';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
    label: string;
    length: number;
}

function TitleSectionWithBadge({ label, length }: Props) {
    return (
        <View style={style.titleRow}>
            <Text style={globalStyles.sectionTitle}>{label}</Text>

            <View style={style.lengthBadge}>
                <Text style={style.lengthBadgeText}>{length}</Text>
            </View>
        </View>)
}

const style = StyleSheet.create({
    titleRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 8,
    },
    lengthBadge: {
        width: 22,
        height: 22,
        backgroundColor: "red",
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
        transform: [{ translateY: -2 }],
    },
    lengthBadgeText: {
        color: "white",
        fontSize: 12,
        fontWeight: "700",
    }
});
export default TitleSectionWithBadge