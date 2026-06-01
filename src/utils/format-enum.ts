export function formatType(value?: string | null) {
    if (!value) return "-";
    return String(value)
        .toLowerCase()
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
