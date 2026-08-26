import { CircleAlert, Inbox } from "lucide-react-native";
import { MotiView } from "moti";
import { useReducedMotion } from "react-native-reanimated";
import { View } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { useThemeColors } from "../utils/theme";

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
    const reduceMotion = useReducedMotion();

    return (
        <StateCardShell>
            <MotiView
                from={{ opacity: reduceMotion ? 1 : 0, translateY: reduceMotion ? 0 : -8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={reduceMotion ? { duration: 0 } : { type: "timing", duration: 220 }}
                className="items-center"
            >
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-danger/10">
                    <CircleAlertIcon size={28} color={colors.danger} strokeWidth={2.4} />
                </View>
                <AppText variant="h3" className="text-center text-danger">
                    {title}
                </AppText>
                <AppText variant="subtext" className="mt-3 text-center text-muted-foreground">
                    {message}
                </AppText>
                {actionLabel && onAction ? (
                    <Button title={actionLabel} onPress={onAction} className="mt-5 rounded-xl" />
                ) : null}
            </MotiView>
        </StateCardShell>
    );
}

export function EmptyState({
    title,
    message,
    actionLabel,
    onAction,
    }: {
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    const colors = useThemeColors();
    const reduceMotion = useReducedMotion();

    return (
        <StateCardShell>
            <MotiView
                from={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduceMotion ? { duration: 0 } : { type: "timing", duration: 220 }}
                className="items-center"
            >
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <InboxIcon size={28} color={colors.mutedForeground} strokeWidth={2.2} />
                </View>
                <AppText variant="h3" className="text-center text-foreground">
                    {title}
                </AppText>
                {message ? (
                    <AppText variant="subtext" className="mt-3 text-center text-muted-foreground">
                        {message}
                    </AppText>
                ) : null}
                {actionLabel && onAction ? (
                    <Button title={actionLabel} onPress={onAction} className="mt-5 rounded-xl" />
                ) : null}
            </MotiView>
        </StateCardShell>
    );
}

function StateCardShell({ children }: { children: React.ReactNode }) {
    return (
        <View className="flex-1 bg-background px-6 py-5">
            <View className="flex-1 items-center justify-center">{children}</View>
        </View>
    );
}
