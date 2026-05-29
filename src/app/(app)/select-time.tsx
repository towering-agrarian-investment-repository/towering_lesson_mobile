import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PRIMARY = "#38bdf8";

const TIME_SLOTS = [
    { start: "06:00", duration: 60, available: true },
    { start: "07:00", duration: 30, available: true },
    { start: "08:00", duration: 90, available: false },
    { start: "09:00", duration: 60, available: true },
    { start: "10:00", duration: 30, available: true },
    { start: "11:00", duration: 120, available: true },
    { start: "12:00", duration: 60, available: false },
    { start: "13:00", duration: 30, available: true },
    { start: "14:00", duration: 90, available: true },
    { start: "15:00", duration: 60, available: false },
    { start: "16:00", duration: 30, available: true },
    { start: "17:00", duration: 60, available: true },
    { start: "18:00", duration: 90, available: true },
    { start: "19:00", duration: 30, available: false },
    { start: "20:00", duration: 60, available: true },
    { start: "21:00", duration: 30, available: true },
];

function formatRange(start: string, duration: number): string {
    const [h, m] = start.split(":").map(Number);
    const totalMins = h * 60 + m + duration;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;

    const fmt = (hour: number, min: number) => {
        const period = hour < 12 ? "AM" : "PM";
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        const mm = min.toString().padStart(2, "0");
        return `${h12}:${mm} ${period}`;
    };

    return `${fmt(h, m)} – ${fmt(endH, endM)}`;
}

export default function TimeScreen() {
    const { date, bay } = useLocalSearchParams<{ date: string; bay: string }>();
    const router = useRouter();

    const handleSelect = (slot: typeof TIME_SLOTS[0]) => {
        router.push({
            pathname: "/booking-confirm",
            params: {
                date,
                bay,
                time: slot.start,
                duration: slot.duration,
            },
        });
    };

    return (
        <ScrollView style={s.container} contentContainerStyle={s.content}>
            <Text style={s.subLabel}>Bay {bay} · {date}</Text>
            <View style={s.list}>
                {TIME_SLOTS.map((slot) => (
                    <TouchableOpacity
                        key={slot.start}
                        style={[s.row, !slot.available && s.rowUnavailable]}
                        onPress={() => slot.available && handleSelect(slot)}
                        activeOpacity={slot.available ? 0.7 : 1}
                        disabled={!slot.available}
                    >
                        <Text style={[s.range, !slot.available && s.textUnavailable]}>
                            {formatRange(slot.start, slot.duration)}
                        </Text>
                        <Text style={[s.status, !slot.available && s.statusUnavailable]}>
                            {slot.available ? "Available" : "Full"}
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
    list: { gap: 8 },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#e2e8f0",
        backgroundColor: "#f8fafc",
    },
    rowUnavailable: {
        backgroundColor: "#f1f5f9",
        borderColor: "#f1f5f9",
        opacity: 0.5,
    },
    range: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0f172a",
    },
    textUnavailable: {
        color: "#94a3b8",
    },
    status: {
        fontSize: 12,
        fontWeight: "500",
        color: PRIMARY,
    },
    statusUnavailable: {
        color: "#cbd5e1",
    },
});