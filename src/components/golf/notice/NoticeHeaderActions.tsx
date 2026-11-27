import { cn } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { MenuView, type MenuAction } from "@expo/ui/community/menu";
import MoreVertical from "lucide-react-native/icons/ellipsis-vertical";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type NoticeHeaderActionsProps = {
    hasUnread: boolean;
    isMarkingAllAsRead: boolean;
    isDeletingAllNotifications: boolean;
    isPending: boolean;
    onMarkAllRead: () => void;
    onDeleteAll: () => void;
};

export function NoticeHeaderActions({
    hasUnread,
    isMarkingAllAsRead,
    isDeletingAllNotifications,
    isPending,
    onMarkAllRead,
    onDeleteAll,
}: NoticeHeaderActionsProps) {
    const { colors, resolvedScheme } = useTheme();
    const { t } = useTranslation();

    const actions: MenuAction[] = [
        ...(hasUnread
            ? [
                  {
                      id: "mark-all-read",
                      title: isMarkingAllAsRead ? t("notice.marking") : t("notice.markAllRead"),
                      image: "checkmark.circle" as const,
                      attributes: {
                          disabled: isPending,
                      },
                  },
              ]
            : []),
        {
            id: "delete-all",
            title: isDeletingAllNotifications ? t("notice.deleting") : t("notice.deleteAll"),
            image: "trash",
            imageColor: colors.danger,
            titleColor: colors.danger,
            attributes: {
                destructive: true,
                disabled: isPending,
            },
        },
    ];

    return (
        <MenuView
            actions={actions}
            colorScheme={resolvedScheme}
            onPressAction={({ nativeEvent }) => {
                if (nativeEvent.event === "mark-all-read") {
                    onMarkAllRead();
                    return;
                }
                if (nativeEvent.event === "delete-all") {
                    onDeleteAll();
                }
            }}
        >
            <View
                accessibilityRole="button"
                accessibilityLabel={t("notice.moreActions", {
                    defaultValue: "More actions",
                })}
                accessibilityState={{
                    disabled: isPending,
                    busy: isMarkingAllAsRead || isDeletingAllNotifications,
                }}
                className={cn("items-center justify-center", isPending && "opacity-60")}
                style={{ minHeight: 48, minWidth: 48 }}
            >
                <MoreVertical size={22} color={colors.foreground} />
            </View>
        </MenuView>
    );
}
