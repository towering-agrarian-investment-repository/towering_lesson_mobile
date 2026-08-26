import {
    AppText,
    InlineState,
    Skeleton,
    triggerSelectionHaptic,
} from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { prefetchTicketAvailability } from "@/lib/booking/prefetchTicketAvailability";
import {
    getMemberTicketsQueryOptions,
    useMemberTickets,
} from "@/lib/hook/useTicket";
import { showAppToast } from "@/lib/toast/toast";
import { MemberSelfResponse } from "@/types/member.type";
import { TicketListItemResponse } from "@/types/member-ticket";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import Animated, {
    interpolate,
    type SharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Pressable,
    View,
} from "react-native";
import TicketCard from "./TicketCard";
import TitleSectionWithBadge from "./TitleSectionWithBadge";

type Props = {
    member: MemberSelfResponse
};

const CARD_WIDTH = 220;
const CARD_GAP = 12;
const CARD_SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

function MyTicket({ member }: Props) {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const { data, isLoading, isError } = useMemberTickets(member.id);
    const tickets = data?.data ?? [];
    const carouselRef = useRef<FlatList<TicketListItemResponse>>(null);
    const [activeTicketIndex, setActiveTicketIndex] = useState(0);
    const carouselProgress = useSharedValue(0);
    const handleTicketScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            carouselProgress.value = event.contentOffset.x / CARD_SNAP_INTERVAL;
        },
    });

    const handleTicketPress = useCallback(
        (item: TicketListItemResponse) => {
            if (item.type === "LESSON_PROGRAM") {
                showAppToast({
                    message: t("common.notAvailable"),
                    type: "info",
                });
                return;
            }

            prefetchTicketAvailability(queryClient, item);

            runWithNavigationLock(() => {
                router.push({
                    pathname: "/select-date",
                    params: {
                        ticketId: String(item.id),
                        ticketName: item.name,
                        ticketType: item.type,
                    },
                });
            });
        },
        [queryClient, router, runWithNavigationLock, t],
    );

    return (
        <View className="gap-4">
            <View className="flex-row items-center justify-between gap-3">
                <TitleSectionWithBadge
                    label={t("tickets.sectionTitle")}
                    length={tickets.length}
                />

                {tickets.length > 1 ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t("tickets.viewAll")}
                        disabled={isLocked}
                        className="rounded-lg px-1 py-2 active:opacity-70"
                        onPressIn={() => {
                            if (!isLocked) {
                                void queryClient.prefetchQuery(
                                    getMemberTicketsQueryOptions(member.id),
                                );
                            }
                        }}
                        onPress={() => {
                            runWithNavigationLock(() => {
                                router.push("/tickets");
                            });
                        }}
                    >
                        <AppText
                            variant="label"
                            className="text-sm font-semibold text-primary"
                        >
                            {t("tickets.viewAll")}
                        </AppText>
                    </Pressable>
                ) : null}
            </View>

            {isLoading ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={style.listContent}
                >
                    {Array.from({ length: 3 }, (_, index) => (
                        <Skeleton key={index} className="h-40 w-60 rounded-xl" />
                    ))}
                </ScrollView>
            ) : isError ? (
                <InlineState
                    title={t("tickets.loadError")}
                    tone="danger"
                />
            ) : tickets.length === 0 ? (
                <InlineState
                    title={t("tickets.empty")}
                />
            ) : (
                <Animated.FlatList
                    ref={carouselRef}
                    data={tickets}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentInsetAdjustmentBehavior="automatic"
                    snapToInterval={CARD_SNAP_INTERVAL}
                    decelerationRate="fast"
                    snapToAlignment="start"
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={style.listContent}
                    onScroll={handleTicketScroll}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={(event) => {
                        const nextIndex = Math.round(
                            event.nativeEvent.contentOffset.x / CARD_SNAP_INTERVAL,
                        );
                        setActiveTicketIndex(
                            Math.max(
                                0,
                                Math.min(nextIndex, tickets.length - 1),
                            ),
                        );
                    }}
                    renderItem={({ item }: { item: TicketListItemResponse }) => (
                        <View style={style.carouselItem}>
                            <TicketCard
                                item={item}
                                disabled={isLocked}
                                onPress={handleTicketPress}
                            />
                        </View>
                    )}
                />
            )}

            {!isLoading && !isError && tickets.length > 1 ? (
                <View
                    accessibilityLabel={`${activeTicketIndex + 1} of ${tickets.length}`}
                    className="flex-row items-center justify-center gap-2"
                >
                    {tickets.map((ticket, index) => (
                        <PaginationDot
                            key={ticket.id}
                            index={index}
                            progress={carouselProgress}
                            onPress={() => {
                                triggerSelectionHaptic();
                                carouselRef.current?.scrollToOffset({
                                    offset: index * CARD_SNAP_INTERVAL,
                                    animated: true,
                                });
                            }}
                            accessibilityLabel={`${t("tickets.sectionTitle")} ${index + 1}`}
                        />
                    ))}
                </View>
            ) : null}

        </View>
    );
}

function PaginationDot({
    index,
    progress,
    onPress,
    accessibilityLabel,
}: {
    index: number;
    progress: SharedValue<number>;
    onPress: () => void;
    accessibilityLabel: string;
}) {
    const animatedStyle = useAnimatedStyle(() => {
        const distance = Math.abs(progress.value - index);

        return {
            opacity: interpolate(distance, [0, 1], [1, 0.35], "clamp"),
            width: interpolate(distance, [0, 1], [20, 8], "clamp"),
        };
    });

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            className="min-h-6 min-w-6 items-center justify-center"
            onPress={onPress}
        >
            <Animated.View
                className="h-2 rounded-full bg-primary"
                style={animatedStyle}
            />
        </Pressable>
    );
}

const style = StyleSheet.create({
    carouselItem: {
        width: CARD_WIDTH,
    },
    listContent: {
        gap: 12,
        paddingVertical: 12,
        paddingRight: 24,
    },
});

export default MyTicket;
