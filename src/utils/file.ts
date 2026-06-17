const BYTES_PER_KB = 1024;

export function formatFileSize(value?: number | null) {
    if (!value || value <= 0) {
        return "-";
    }

    if (value < BYTES_PER_KB) {
        return `${value} B`;
    }

    const kb = value / BYTES_PER_KB;

    if (kb < BYTES_PER_KB) {
        return `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`;
    }

    const mb = kb / BYTES_PER_KB;

    return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}
