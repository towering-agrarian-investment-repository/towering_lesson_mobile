import { useTheme } from "@/design-system/utils/theme";
import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { HomeBanner } from "@/components/golf/HomeBanner";
import MyTicket from "@/components/golf/MyTicket";
import { ReservationCardSkeleton } from "@/components/golf/ReservationCard";
import { TicketHistoryCardSkeleton } from "@/components/golf/TicketHistoryCard";
import TodayReservation from "@/components/golf/TodayReservation";
import {
    ActionButton,
    CompactEmptyState,
    ErrorState,
    Screen,
    Skeleton,
} from "@/design-system";
import { usePublishedBanners } from "@/lib/hook/useBanner";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { getMemberReservationsQueryOptions } from "@/lib/hook/useReservation";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

export default function HomeScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { colors } = useTheme();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const {
        data: publishedBanners,
        refetch: refetchBanners,
    } = usePublishedBanners();
    const {
        data: memberResponse,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useGetMemberProfile();

    const member = memberResponse?.data;

    const { refreshing, onRefresh: handleRefresh } = usePullToRefresh(() =>
        Promise.all([
            refetch({ cancelRefetch: false }),
            refetchBanners({ cancelRefetch: false }),
            queryClient.refetchQueries({
                queryKey: ["member", "tickets"],
                type: "active",
            }, { cancelRefetch: false }),
            queryClient.refetchQueries({
                queryKey: ["member", "reservations", "today"],
                type: "active",
            }, { cancelRefetch: false }),
        ]),
    );

    if (isLoading) {
        return (
            <Screen
                headerShown={false}
                bottomSafeArea={process.env.EXPO_OS === "ios"}
                contentClassName="flex-grow"
            >
                <View className="grow gap-4">
                    <HappyGolfLogo
                        width={120}
                        height={28}
                        primaryColor={colors.primary}
                        accentColor={colors.warning}
                    />
                    <View className="gap-6">
                        <Skeleton className="h-44 w-full rounded-2xl" />
                        <View className="gap-3">
                            <Skeleton className="h-5 w-32 rounded-full" />
                            <TicketHistoryCardSkeleton />
                        </View>
                        <View className="gap-3">
                            <Skeleton className="h-5 w-40 rounded-full" />
                            <ReservationCardSkeleton />
                            <ReservationCardSkeleton />
                        </View>
                    </View>
                </View>
            </Screen>
        );
    }

    if (isError && !memberResponse) {
        return (
            <Screen
                headerShown={false}
                contentClassName="grow"
                bottomPadding={16}
                bottomSafeArea={process.env.EXPO_OS === "ios"}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            void handleRefresh();
                        }}
                    />
                }
            >
                <ErrorState
                    title={t("home.couldNotLoadProfile")}
                    message={t("home.checkConnection")}
                    actionLabel={
                        isRefetching
                            ? t("common.refreshing")
                            : t("common.refreshTryAgain")
                    }
                    actionPending={isRefetching || refreshing}
                    onAction={() => {
                        void refetch();
                    }}
                />
            </Screen>
        );
    }

    return (
        <Screen
            headerShown={false}
            contentClassName="flex-grow"
            footerSafeArea={process.env.EXPO_OS === "ios"}
            footer={
                <ActionButton
                    label={t("home.viewMyReservations")}
                    disabled={isLocked}
                    haptic="selection"
                    onPress={() => {
                        if (isLocked) return;
                        void queryClient.prefetchInfiniteQuery(
                            getMemberReservationsQueryOptions("all"),
                        );
                        runWithNavigationLock(() =>
                            router.push("/reservation"),
                        );
                    }}
                />
            }
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                        void handleRefresh();
                    }}
                />
            }
        >
            <View className="grow gap-4">
                <HappyGolfLogo
                    width={120}
                    height={28}
                    primaryColor={colors.primary}
                    accentColor={colors.warning}
                />

                <View className="gap-6">
                    <HomeBanner banners={publishedBanners} />

                    {member ? (
                        <MyTicket />
                    ) : (
                        <CompactEmptyState title={t("home.noMemberProfile")} />
                    )}
                    <TodayReservation />
                </View>
            </View>
        </Screen>
    );
}
