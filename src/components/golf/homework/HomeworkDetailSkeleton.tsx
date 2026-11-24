import { Skeleton } from "@/design-system";
import { View } from "react-native";

export function HomeworkDetailSkeleton() {
    return (
        <>
            <View className="gap-3">
                <View className="flex-row items-center justify-between">
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-4 w-28 rounded-full" />
                </View>
                <Skeleton className="h-8 w-4/5 rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
            </View>

            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
        </>
    );
}
