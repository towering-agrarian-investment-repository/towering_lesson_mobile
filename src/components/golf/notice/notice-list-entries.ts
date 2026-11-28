import type { NotificationResponse } from "@/service/shared/notification-service";
import { toAppTimeZoneDate } from "@/utils/timezone";
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";

type NotificationSectionKey = "today" | "yesterday" | "thisWeek" | "earlier";
export type NotificationListEntry =
    { kind: "header"; key: string; label: string } | { kind: "item"; item: NotificationResponse };

export const notificationKeyExtractor = (entry: NotificationListEntry) =>
    entry.kind === "header" ? `section-${entry.key}` : String(entry.item.id);

export const getNotificationItemType = (entry: NotificationListEntry) => (entry.kind === "header" ? "header" : "item");

function getNotificationSectionKey(
    createdAt: string,
    reference: ReturnType<typeof toAppTimeZoneDate>,
): NotificationSectionKey | null {
    const created = toAppTimeZoneDate(createdAt);
    if (!created || !reference) return null;

    const daysAgo = differenceInCalendarDays(reference, created);
    if (daysAgo <= 0) return "today";
    if (daysAgo === 1) return "yesterday";
    if (daysAgo <= 6) return "thisWeek";
    return "earlier";
}

export function buildNotificationEntries(
    notifications: NotificationResponse[],
    referenceTime: number,
    t: (key: string) => string,
) {
    const entries: NotificationListEntry[] = [];
    const stickyHeaderIndices: number[] = [];
    let currentKey: NotificationSectionKey | null = null;

    const reference = toAppTimeZoneDate(referenceTime);

    for (const notification of notifications) {
        const key = getNotificationSectionKey(notification.createdAt, reference);
        if (key && key !== currentKey) {
            stickyHeaderIndices.push(entries.length);
            entries.push({
                kind: "header",
                key,
                label:
                    key === "today"
                        ? t("notice.groupToday")
                        : key === "yesterday"
                          ? t("notice.groupYesterday")
                          : key === "thisWeek"
                            ? t("notice.groupThisWeek")
                            : t("notice.groupEarlier"),
            });
            currentKey = key;
        }
        entries.push({ kind: "item", item: notification });
    }

    return { data: entries, stickyHeaderIndices };
}
