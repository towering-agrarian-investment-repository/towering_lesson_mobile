import { MemberGroups } from "@/components/golf/MemberGroups";
import { Screen } from "@/design-system";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { RefreshControl, View } from "react-native";

export default function LessonsScreen() {
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await queryClient.refetchQueries({
                queryKey: ["member", "groups"],
                type: "active",
            });
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <Screen
            contentClassName="flex-grow"
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                        void handleRefresh();
                    }}
                />
            }
        >
            <View className="gap-6">
                <MemberGroups />
            </View>
        </Screen>
    );
}
