import { AppText, Button } from "@/design-system";
import { useThemeColors } from "@/design-system/utils/theme";
import { CircleAlert, Inbox } from "lucide-react-native";
import { View } from "react-native";

const CircleAlertIcon = CircleAlert as React.ComponentType<any>;
const InboxIcon = Inbox as React.ComponentType<any>;

export function ErrorState({
    title,
    message,
    actionLabel,
    onAction,
}: {
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    const colors = useThemeColors();

    return (
        <StateCardShell>
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-danger/10">
                <CircleAlertIcon size={28} color={colors.danger} strokeWidth={2.4} />
            </View>

            <AppText variant="value" className="text-center text-danger">
                {title}
            </AppText>

            <AppText variant="subtext" className="mt-3 text-center text-foreground/75">
                {message}
            </AppText>

            {actionLabel && onAction ? (
                <Button title={actionLabel} onPress={onAction} className="mt-5 rounded-xl" />
            ) : null}
        </StateCardShell>
    );
}

export function EmptyState({
    title,
    message,
}: {
    title: string;
    message: string;
}) {
    const colors = useThemeColors();

    return (
        <StateCardShell>
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-muted">
                <InboxIcon size={28} color={colors.mutedForeground} strokeWidth={2.2} />
            </View>

            <AppText variant="value" className="text-center text-foreground">
                {title}
            </AppText>

            <AppText variant="subtext" className="mt-3 text-center text-foreground/75">
                {message}
            </AppText>
        </StateCardShell>
    );
}

function StateCardShell({ children }: { children: React.ReactNode }) {
    return (
        <View className="flex-1 px-6 py-5">
            <View className="flex-1 items-center justify-center">
                {children}
            </View>
        </View>
    );
}
