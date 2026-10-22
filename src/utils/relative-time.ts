import { formatDistanceToNow, isValid } from "date-fns";
import { getDateLocale } from "./date-locale";

export function formatRelativeTime(value?: string | Date | null, language = "en") {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value);
    if (!isValid(date)) return "";

    const locale = getDateLocale(language);
    return formatDistanceToNow(date.getTime() > Date.now() ? new Date() : date, {
        addSuffix: true,
        locale,
    });
}
