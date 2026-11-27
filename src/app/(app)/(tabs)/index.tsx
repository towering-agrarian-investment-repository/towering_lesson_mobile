import { useTheme } from "@/design-system/utils/theme";
import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { HomeBanner, HomeBannerSkeleton } from "@/components/golf/HomeBanner";
import MyTicket from "@/components/golf/MyTicket";
import TodayReservation from "@/components/golf/TodayReservation";
import { ActionButton, CompactEmptyState, ErrorState, Screen, Skeleton } from "@/design-system";
import { usePublishedBanners } from "@/lib/hook/useBanner";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { getMemberReservationsQueryOptions } from "@/lib/hook/useReservation";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useScrollToTop } from "expo-router";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View, type ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const scrollRef = useRef<ScrollViewInstance>(null);
    useScrollToTop(scrollRef);
    const { data: publishedBanners, isLoading: isBannerLoading, refetch: refetchBanners } = usePublishedBanners();
    const { data: memberResponse, isLoading, isError, refetch, isRefetching } = useGetMemberProfile();

    const member = memberResponse?.data;

    const { refreshing, onRefresh: handleRefresh } = usePullToRefresh(() =>
        Promise.all([
            refetch({ cancelRefetch: false }),
            refetchBanners({ cancelRefetch: false }),
            queryClient.refetchQueries(
                {
                    queryKey: ["member", "tickets"],
                    type: "active",
                },
                { cancelRefetch: false },
            ),
            queryClient.refetchQueries(
                {
                    queryKey: ["member", "reservations", "today"],
                    type: "active",
                },
                { cancelRefetch: false },
            ),
        ]),
    );

    if (isError && !memberResponse) {
        return (
            <Screen
                scrollRef={scrollRef}
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
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching || refreshing}
                    onAction={() => {
                        void refetch();
                    }}
                />
            </Screen>
        );
    }

    return (
        <View className="flex-1">
            <Screen
                scrollRef={scrollRef}
                headerShown={false}
                contentClassName="flex-grow"
                bottomSafeArea={isLoading && process.env.EXPO_OS === "ios"}
                footerSafeArea={process.env.EXPO_OS === "ios"}
                footer={
                    isLoading ? null : (
                        <ActionButton
                            label={t("home.viewMyReservations")}
                            disabled={isLocked}
                            onPress={() => {
                                if (isLocked) return;
                                void queryClient.prefetchInfiniteQuery(getMemberReservationsQueryOptions("all"));
                                runWithNavigationLock(() => router.push("/reservation"));
                            }}
                        />
                    )
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
                    {isLoading ? (
                        <Skeleton className="h-7 w-[120px] rounded-md" />
                    ) : (
                        <HappyGolfLogo
                            width={120}
                            height={28}
                            primaryColor={colors.primary}
                            accentColor={colors.warning}
                        />
                    )}

                    <View className="gap-6">
                        {isBannerLoading ? <HomeBannerSkeleton /> : <HomeBanner banners={publishedBanners} />}

                        {isLoading || member ? <MyTicket /> : <CompactEmptyState title={t("home.noMemberProfile")} />}
                        <TodayReservation />
                    </View>
                </View>
            </Screen>
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: insets.top,
                    backgroundColor: colors.background,
                }}
            />
        </View>
    );
}
