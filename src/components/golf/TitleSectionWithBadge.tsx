import { StyleSheet, Text, View } from 'react-native';

type Props = {
    label: string;
    length: number;
}

function TitleSectionWithBadge({ label, length }: Props) {
    return (
        <View style={style.titleRow}>
            <Text style={style.sectionTitle}>{label}</Text>

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
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#363641",
        marginTop: 30,
        marginBottom: 16,
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
