// Integer native point sizes with a 12pt floor. Korean line-heights stay
// comfortable at 1.4x–1.5x, and weights stay within 400/600/700.
export const typography = {
    h1: { fontSize: 26, lineHeight: 34, fontWeight: "700", letterSpacing: -0.4 },
    h2: { fontSize: 21, lineHeight: 28, fontWeight: "700", letterSpacing: -0.2 },
    h3: { fontSize: 17, lineHeight: 24, fontWeight: "600", letterSpacing: 0 },
    subtitle: { fontSize: 16, lineHeight: 23, fontWeight: "600", letterSpacing: 0 },
    body: { fontSize: 15, lineHeight: 22, fontWeight: "400", letterSpacing: 0 },
    label: { fontSize: 15, lineHeight: 22, fontWeight: "600", letterSpacing: 0 },
    subtext: { fontSize: 13, lineHeight: 19, fontWeight: "400", letterSpacing: 0 },
    caption: { fontSize: 12, lineHeight: 17, fontWeight: "400", letterSpacing: 0 },
    badge: { fontSize: 12, lineHeight: 16, fontWeight: "600", letterSpacing: 0.2 },
} as const;
