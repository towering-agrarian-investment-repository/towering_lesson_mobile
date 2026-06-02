import { StyleSheet, Text, View } from "react-native";

type Props = {}

export default function HomeHeader() {
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    return (
        <View style={styles.header}>
            <Text style={styles.date}>{currentDate}</Text>
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
        color: "#363641",
        marginTop: 4,
        marginBottom: 30,
    },
});
