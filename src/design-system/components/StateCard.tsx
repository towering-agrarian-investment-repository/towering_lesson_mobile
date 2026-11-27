import AlertCircle from "lucide-react-native/icons/circle-alert";
import Inbox from "lucide-react-native/icons/inbox";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, type StyleProp, View, type ViewStyle } from "react-native";
import { useTheme } from "../utils/theme";
import { ActionButton } from "./ActionButton";
import { AppText } from "./AppText";

function StateCardShell({ children }: { children: ReactNode }) {
    return (
        <View className="w-full grow items-center justify-center py-6">
            <View className="w-full max-w-[360px] items-center rounded-2xl border border-border bg-card px-6 py-7">
                {children}
            </View>
        </View>
    );
}

export function ErrorState({
    title,
    message,
    actionLabel,
    onAction,
    actionPending = false,
}: {
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    actionPending?: boolean;
}) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const buttonLabel = actionPending ? t("common.refreshing") : actionLabel;

    return (
        <StateCardShell>
            <View accessibilityRole="alert" className="w-full items-center gap-5">
                <View className="w-full items-center gap-4">
                    <View className="h-14 w-14 items-center justify-center rounded-full bg-danger/10">
                        <AlertCircle size={28} color={colors.danger} strokeWidth={2.2} />
                    </View>
                    <View className="w-full items-center gap-2">
                        <AppText variant="h3" align="center">
                            {title}
                        </AppText>
                        {message ? (
                            <AppText variant="subtext" color="mutedForeground" align="center">
                                {message}
                            </AppText>
                        ) : null}
                    </View>
                </View>
                {actionLabel && onAction && buttonLabel ? (
                    <ActionButton
                        label={buttonLabel}
                        onPress={onAction}
                        disabled={actionPending}
                        loading={actionPending}
                    />
                ) : null}
            </View>
        </StateCardShell>
    );
}

export function EmptyState({
    title,
    message,
    actionLabel,
    onAction,
    actionPending = false,
}: {
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    actionPending?: boolean;
}) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const buttonLabel = actionPending ? t("common.refreshing") : actionLabel;

    return (
        <StateCardShell>
            <View className="w-full items-center gap-5">
                <View className="w-full items-center gap-4">
                    <View className="h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <Inbox size={28} color={colors.mutedForeground} strokeWidth={2.2} />
                    </View>
                    <View className="w-full items-center gap-2">
                        <AppText variant="h3" align="center">
                            {title}
                        </AppText>
                        {message ? (
                            <AppText variant="subtext" color="mutedForeground" align="center">
                                {message}
                            </AppText>
                        ) : null}
                    </View>
                </View>
                {actionLabel && onAction && buttonLabel ? (
                    <ActionButton
                        label={buttonLabel}
                        onPress={onAction}
                        disabled={actionPending}
                        loading={actionPending}
                    />
                ) : null}
            </View>
        </StateCardShell>
    );
}

/** Pull-to-refresh scroll container for list screens showing EmptyState or ErrorState. */
export function StateList({
    children,
    refreshing,
    onRefresh,
    contentContainerStyle,
}: {
    children: ReactNode;
    refreshing: boolean;
    onRefresh: () => void;
    contentContainerStyle?: StyleProp<ViewStyle>;
}) {
    return (
        <ScrollView
            className="flex-1"
            contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {children}
        </ScrollView>
    );
}
