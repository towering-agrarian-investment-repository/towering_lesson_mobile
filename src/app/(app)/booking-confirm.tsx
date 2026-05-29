import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PRIMARY = "#38bdf8";

function formatDuration(m: number) {
    const n = Number(m);
    if (n < 60) return `${n}m`;
    if (n % 60 === 0) return `${n / 60}h`;
    return `${Math.floor(n / 60)}h ${n % 60}m`;
}

export default function ConfirmScreen() {
    const { date, bay, time, duration } = useLocalSearchParams<{
        date: string;
        bay: string;
        time: string;
        duration: string;
    }>();
    const router = useRouter();

    const handleConfirm = () => {
        router.replace("/");
    };

    const rows = [
        { icon: "calendar-outline", label: "Date", value: new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) },
        { icon: "golf-outline", label: "Bay", value: `Bay ${bay}` },
        { icon: "time-outline", label: "Time", value: time },
        { icon: "hourglass-outline", label: "Duration", value: formatDuration(Number(duration)) },
    ];

    return (
        <View style={s.container}>
            <View style={s.card}>
                <View style={s.iconRow}>
                    <View style={s.iconBg}>
                        <Ionicons name="golf" size={28} color={PRIMARY} />
                    </View>
                    <Text style={s.headline}>Bay {bay} Session</Text>
                </View>

                <View style={s.divider} />

                {rows.map((row) => (
                    <View key={row.label} style={s.row}>
                        <View style={s.rowLeft}>
                            <Ionicons name={row.icon as any} size={16} color="#94a3b8" />
                            <Text style={s.label}>{row.label}</Text>
                        </View>
                        <Text style={s.value}>{row.value}</Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity style={s.button} onPress={handleConfirm} activeOpacity={0.85}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={s.buttonText}>Confirm Booking</Text>
            </TouchableOpacity>

            <Text style={s.note}>Free cancellation up to 2 hours before your session</Text>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 16 },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "#f8fafc",
        padding: 20,
        marginBottom: 20,
        gap: 12,
    },
    iconRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconBg: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#e0f7fe",
        alignItems: "center",
        justifyContent: "center",
    },
    headline: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
    divider: { height: 1, backgroundColor: "#e2e8f0" },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    label: { fontSize: 13, color: "#64748b" },
    value: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
    button: {
        backgroundColor: PRIMARY,
        borderRadius: 14,
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    note: { textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 12 },
});