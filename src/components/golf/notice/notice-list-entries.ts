import type { NotificationResponse } from "@/service/shared/notification-service";
import { toAppTimeZoneDate } from "@/utils/timezone";
import { differenceInCalendarDays } from "date-fns";

type NotificationSectionKey = "today" | "yesterday" | "thisWeek" | "earlier";
export type NotificationListEntry =
    { kind: "header"; key: string; label: string } | { kind: "item"; item: NotificationResponse };

export const notificationKeyExtractor = (entry: NotificationListEntry) =>
    entry.kind === "header" ? `section-${entry.key}` : String(entry.item.id);

export const getNotificationItemType = (entry: NotificationListEntry) =>
    entry.kind === "header" ? "header" : entry.item.isRead ? "read" : "unread";

function getNotificationSectionKey(createdAt: string, referenceTime: number): NotificationSectionKey | null {
    const created = toAppTimeZoneDate(createdAt);
    const reference = toAppTimeZoneDate(referenceTime);
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

    for (const notification of notifications) {
        const key = getNotificationSectionKey(notification.createdAt, referenceTime);
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
