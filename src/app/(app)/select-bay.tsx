import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PRIMARY = "#38bdf8";

const BAYS = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    available: ![3, 7, 10].includes(i + 1),
}));

export default function BayScreen() {
    const { date } = useLocalSearchParams<{ date: string }>();
    const router = useRouter();

    const handleSelect = (bayId: number) => {
        router.push({
            pathname: "/select-time",
            params: { date, bay: bayId },
        });
    };

    return (
        <ScrollView style={s.container} contentContainerStyle={s.content}>
            <Text style={s.subLabel}>{date}</Text>
            <View style={s.grid}>
                {BAYS.map((bay) => (
                    <TouchableOpacity
                        key={bay.id}
                        style={[s.chip, !bay.available && s.chipUnavailable]}
                        onPress={() => bay.available && handleSelect(bay.id)}
                        activeOpacity={bay.available ? 0.7 : 1}
                        disabled={!bay.available}
                    >
                        <Text style={[s.chipLabel, !bay.available && s.chipLabelUnavailable]}>
                            Bay {bay.id}
                        </Text>
                        <Text style={[s.chipStatus, !bay.available && s.chipStatusUnavailable]}>
                            {bay.available ? "Available" : "Full"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    content: { padding: 16, paddingBottom: 40 },
    subLabel: { fontSize: 13, color: "#94a3b8", marginBottom: 16 },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    chip: {
        width: "30%",
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#e2e8f0",
        backgroundColor: "#f8fafc",
        alignItems: "center",
        gap: 4,
    },
    chipUnavailable: {
        backgroundColor: "#f1f5f9",
        borderColor: "#f1f5f9",
        opacity: 0.5,
    },
    chipLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0f172a",
    },
    chipLabelUnavailable: {
        color: "#94a3b8",
    },
    chipStatus: {
        fontSize: 11,
        color: PRIMARY,
        fontWeight: "500",
    },
    chipStatusUnavailable: {
        color: "#cbd5e1",
    },
});