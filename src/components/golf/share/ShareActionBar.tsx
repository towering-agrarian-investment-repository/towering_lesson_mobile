import { AnimatedPressable, AppText, cn } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import type { ShareCardAction } from "@/lib/hook/useShareCardExport";
import { Download, Share } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

const ACTIONS: ShareCardAction[] = ["share", "save"];

type ShareActionBarProps = {
    isBusy: boolean;
    canSave: boolean;
    pendingAction: ShareCardAction | null;
    onAction: (action: ShareCardAction) => void;
};

export function ShareActionBar({ isBusy, canSave, pendingAction, onAction }: ShareActionBarProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    const actionLabel = (action: ShareCardAction) => {
        const pending = pendingAction === action;
        if (action === "share") {
            return t(pending ? "shareCard.sharing" : "shareCard.share");
        }
        return t(pending ? "activity.saving" : "activity.save");
    };

    return (
        <View className="flex-row gap-3" accessibilityState={{ busy: isBusy }}>
            {ACTIONS.map((action) => {
                const filled = action === "share";
                const isActionPending = pendingAction === action;
                const contentColor = filled ? colors.primaryForeground : colors.foreground;
                return (
                    <AnimatedPressable
                        key={action}
                        accessibilityRole="button"
                        accessibilityState={{
                            disabled: isBusy || !canSave,
                            busy: isActionPending,
                        }}
                        disabled={isBusy || !canSave}
                        onPress={() => {
                            onAction(action);
                        }}
                        className={cn(
                            "min-h-12 min-w-0 flex-1 flex-row items-center justify-center gap-2.5 rounded-xl px-4 disabled:opacity-50",
                            filled ? "bg-primary" : "border border-border bg-card",
                        )}
                    >
                        {isActionPending ? (
                            <ActivityIndicator size="small" color={contentColor} />
                        ) : filled ? (
                            <Share size={18} color={contentColor} />
                        ) : (
                            <Download size={18} color={contentColor} />
                        )}
                        <AppText variant="label" color={filled ? "primaryForeground" : "foreground"} wrap={false}>
                            {actionLabel(action)}
                        </AppText>
                    </AnimatedPressable>
                );
            })}
        </View>
    );
}
