import { CircleAlert, Inbox } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

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
    return (
        <StateCardShell>
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full">
                <CircleAlert size={28} color="#dc2626" strokeWidth={2.4} />
            </View>

            <Text className="text-center text-lg font-semibold leading-7 text-red-600">
                {title}
            </Text>

            <Text className="mt-3 text-center text-base leading-6 text-gray-500">
                {message}
            </Text>

            {actionLabel && onAction ? (
                <Pressable
                    onPress={onAction}
                    className="mt-5 rounded-xl bg-green-600 px-5 py-3 active:bg-green-700"
                >
                    <Text className="text-base font-bold text-white">
                        {actionLabel}
                    </Text>
                </Pressable>
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
    return (
        <StateCardShell>
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full">
                <Inbox size={28} color="#6b7280" strokeWidth={2.2} />
            </View>

            <Text className="text-center text-lg font-semibold leading-7 text-gray-950">
                {title}
            </Text>

            <Text className="mt-3 text-center text-base leading-6 text-gray-500">
                {message}
            </Text>
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