import { processColor } from "react-native";

/** Apply opacity to any static color accepted by React Native, preserving its alpha. */
export function colorWithOpacity(color: string, opacity: number): string {
    const processed = processColor(color);
    if (typeof processed !== "number") return color;

    const red = (processed >>> 16) & 255;
    const green = (processed >>> 8) & 255;
    const blue = processed & 255;
    const alpha = ((processed >>> 24) / 255) * Math.max(0, Math.min(1, opacity));
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
