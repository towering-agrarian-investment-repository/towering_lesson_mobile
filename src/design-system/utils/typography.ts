// NativeWind uses a 14-point rem on native; browsers use 16px. Keep explicit
// Expo UI text at the same sizes as the original Tailwind text utilities.
const rem = process.env.EXPO_OS === "web" ? 16 : 14;

export const typography = {
    display: { fontSize: 3.75 * rem, lineHeight: 3.75 * rem, fontWeight: "700", letterSpacing: 0 },
    h1: { fontSize: 1.875 * rem, lineHeight: 2.25 * rem, fontWeight: "700", letterSpacing: 0 },
    h2: { fontSize: 1.5 * rem, lineHeight: 2 * rem, fontWeight: "700", letterSpacing: 0 },
    h3: { fontSize: 1.25 * rem, lineHeight: 1.75 * rem, fontWeight: "600", letterSpacing: 0 },
    subtitle: { fontSize: 1.125 * rem, lineHeight: 1.75 * rem, fontWeight: "600", letterSpacing: 0 },
    body: { fontSize: rem, lineHeight: 1.5 * rem, fontWeight: "400", letterSpacing: 0 },
    value: { fontSize: 1.5 * rem, lineHeight: 2 * rem, fontWeight: "700", letterSpacing: 0 },
    subtext: { fontSize: 0.875 * rem, lineHeight: 1.25 * rem, fontWeight: "400", letterSpacing: 0 },
    muted: { fontSize: rem, lineHeight: 1.5 * rem, fontWeight: "400", letterSpacing: 0 },
    caption: { fontSize: 0.75 * rem, lineHeight: rem, fontWeight: "400", letterSpacing: 0 },
    meta: { fontSize: 0.875 * rem, lineHeight: 1.25 * rem, fontWeight: "400", letterSpacing: 0 },
    eyebrow: { fontSize: 0.875 * rem, lineHeight: 1.25 * rem, fontWeight: "600", letterSpacing: 0.07 * rem },
    label: { fontSize: rem, lineHeight: 1.5 * rem, fontWeight: "500", letterSpacing: 0 },
    badge: { fontSize: 0.75 * rem, lineHeight: rem, fontWeight: "600", letterSpacing: 0.01875 * rem },
    count: { fontSize: 0.875 * rem, lineHeight: 1.25 * rem, fontWeight: "500", letterSpacing: 0 },
} as const;
