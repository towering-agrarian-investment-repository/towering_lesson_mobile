import { useTheme } from "@/design-system/utils/theme";
import {
    getNativeButtonStyle,
    getNativeButtonTextStyle,
} from "@/design-system/utils/native-button-styles";
import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import { HomeBanner } from "@/components/golf/HomeBanner";
import MyTicket from "@/components/golf/MyTicket";
import TodayReservation from "@/components/golf/TodayReservation";
import {
    CircleLoader,
    ErrorState,
    InlineState,
    Screen,
} from "@/design-system";
import { usePublishedBanners } from "@/lib/hook/useBanner";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { getMemberReservationsQueryOptions } from "@/lib/hook/useReservation";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { Button, Host, Text } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

export default function HomeScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { colors, fontScale: uiFontScale } = useTheme();
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
        return <CircleLoader fullScreen />;
    }

    if (isError && !memberResponse) {
        return (
            <ErrorState
                title={t("home.couldNotLoadProfile")}
                message={t("home.checkConnection")}
                actionLabel={
                    isRefetching
                        ? t("common.refreshing")
                        : t("common.refreshTryAgain")
                }
                actionPending={isRefetching}
                onAction={() => {
                    void refetch();
                }}
            />
        );
    }

    return (
        <Screen
            headerShown={false}
            contentClassName="flex-grow"
            footerSafeArea={process.env.EXPO_OS === "ios"}
            footer={
                <View className="py-3">
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        seedColor={colors.primary}
                        style={{ width: "100%" }}>
                        <Button
                            variant="text"
                            style={getNativeButtonStyle(
                                colors,
                                "filled",
                                isLocked,
                                colors.primary,
                            )}
                            modifiers={
                                process.env.EXPO_OS === "ios"
                                    ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                                    : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })]
                            }
                            disabled={isLocked}
                            onPress={() => {
                                if (isLocked) return;
                                void queryClient.prefetchInfiniteQuery(
                                    getMemberReservationsQueryOptions("all"),
                                );
                                runWithNavigationLock(() =>
                                    router.push("/reservation"),
                                );
                            }}
                        >
                            <Text
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth()]}
                                textStyle={getNativeButtonTextStyle(
                                    colors,
                                    "filled",
                                    uiFontScale,
                                    colors.primary,
                                )}
                            >
                                {t("home.viewMyReservations")}
                            </Text>
                        </Button>
                    </Host>
                </View>
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
                        <MyTicket member={member} />
                    ) : (
                        <InlineState title={t("home.noMemberProfile")} />
                    )}
                    <TodayReservation />
                </View>
            </View>
        </Screen>
    );
}
