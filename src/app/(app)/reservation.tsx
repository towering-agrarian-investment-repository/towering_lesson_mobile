import { memo, useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    Text,
    View,
} from "react-native";

import ReservationCard from "@/components/golf/ReservationCard";
import { useMemberReservations } from "@/lib/hook/useReservation";
import { MemberReservationType } from "@/service/reservation.service";
import type {
    MemberReservationResponse,
    MemberReservationSummaryResponse,
} from "@/types/member-reservation";

const MemoReservationCard = memo(ReservationCard);

const RESERVATION_TABS: MemberReservationType[] = [
    "all",
    "bay",
    "private",
    "group",
    "program",
];

const TAB_LABELS: Record<MemberReservationType, string> = {
    all: "All",
    bay: "Bay",
    private: "Private",
    group: "Group",
    program: "Program",
};

type ReservationItem =
    | MemberReservationResponse
    | MemberReservationSummaryResponse;

export default function ReservationScreen() {
    const [activeTab, setActiveTab] = useState<MemberReservationType>("all");

    const {
        data,
        isLoading,
        isFetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useMemberReservations(activeTab);

    const reservations = data?.items ?? [];

    const keyExtractor = useCallback((item: ReservationItem) => {
        return String(item.id);
    }, []);

    const renderReservationItem = useCallback(
        ({ item }: { item: ReservationItem }) => (
            <MemoReservationCard reservation={item} tab={activeTab} />
        ),
        [activeTab],
    );

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
        <View className="flex-1 bg-white">
            <View className="px-6 pt-6">
                <View className="flex-row border-b border-gray-200">
                    {RESERVATION_TABS.map((tab) => {
                        const isActive = activeTab === tab;

                        return (
                            <Pressable
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                className="flex-1 items-center pb-3"
                            >
                                <Text
                                    className={`text-base font-bold ${isActive
                                        ? "text-green-600"
                                        : "text-gray-400"
                                        }`}
                                >
                                    {TAB_LABELS[tab]}
                                </Text>

                                {isActive ? (
                                    <View className="absolute bottom-0 h-0.5 w-full rounded-full bg-green-600" />
                                ) : null}
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <View className="flex-1">
                {isLoading ? (
                    <FullStateBox>
                        <ActivityIndicator size="large" color="#16a34a" />
                        <Text className="mt-3 text-base text-gray-500">
                            Loading reservations...
                        </Text>
                    </FullStateBox>
                ) : reservations.length === 0 ? (
                    <FullStateBox>
                        <Text className="text-lg font-semibold text-gray-950 text-center leading-7">
                            No reservations found
                        </Text>

                        <Text className="mt-2 text-base text-gray-500 text-center leading-6">
                            Your reservations will appear here.
                        </Text>
                    </FullStateBox>
                ) : (
                    <FlatList
                        data={reservations}
                        keyExtractor={keyExtractor}
                        renderItem={renderReservationItem}
                        contentContainerClassName="px-6 pt-5 pb-10"
                        ItemSeparatorComponent={ReservationItemSeparator}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={8}
                        maxToRenderPerBatch={8}
                        windowSize={7}
                        removeClippedSubviews
                        updateCellsBatchingPeriod={50}
                        ListHeaderComponent={
                            <ReservationListHeader
                                count={reservations.length}
                                isUpdating={isFetching && !isFetchingNextPage}
                            />
                        }
                        onEndReached={handleEndReached}
                        onEndReachedThreshold={0.4}
                        ListFooterComponent={
                            isFetchingNextPage ? <ReservationListFooter /> : null
                        }
                    />
                )}
            </View>
        </View>
    );
}

function FullStateBox({ children }: { children: React.ReactNode }) {
    return (
        <View style={{ flex: 1 }} className="px-6 py-5">
            <View
                style={{
                    flex: 1,
                    alignSelf: "stretch",
                    borderStyle: "dashed",
                }}
                className="items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 px-6"
            >
                {children}
            </View>
        </View>
    );
}

function ReservationItemSeparator() {
    return <View className="h-5" />;
}

function ReservationListHeader({
    count,
    isUpdating,
}: {
    count: number;
    isUpdating: boolean;
}) {
    return (
        <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">
                {count} Records
            </Text>

            {isUpdating ? (
                <Text className="text-xs font-medium text-gray-400">
                    Updating...
                </Text>
            ) : null}
        </View>
    );
}

function ReservationListFooter() {
    return (
        <View className="py-5">
            <ActivityIndicator size="small" color="#16a34a" />
        </View>
    );
}