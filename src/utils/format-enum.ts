export function formatType(value?: string | null) {
    return formatTypeOrNull(value) ?? "-";
}

export function formatTypeOrNull(value?: string | null): string | null {
    if (!value) return null;

    return String(value)
        .toLowerCase()
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
