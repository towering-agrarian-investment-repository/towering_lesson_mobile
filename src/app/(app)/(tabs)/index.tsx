import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import MyTicket from "@/components/golf/MyTicket";
import TodayReservation from "@/components/golf/TodayReservation";
import {
  AppText,
  CircleLoader,
  ErrorState,
  getPressedScaleStyle,
  InlineState,
  Screen,
  triggerImpactHaptic,
  useThemeColors,
} from "@/design-system";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { getMemberReservationsQueryOptions } from "@/lib/hook/useReservation";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  View,
} from "react-native";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colors = useThemeColors();
  const { isLocked, runWithNavigationLock } = useNavigationLock();
  const [refreshing, setRefreshing] = useState(false);
  const {
    data: memberResponse,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useGetMemberProfile();

  const member = memberResponse?.data;

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        refetch(),
        queryClient.refetchQueries({ queryKey: ["member", "tickets"], type: "active" }),
        queryClient.refetchQueries({
          queryKey: ["member", "reservations", "today"],
          type: "active",
        }),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return <CircleLoader fullScreen />;
  }

  if (isError) {
    return (
      <ErrorState
        title={t("home.couldNotLoadProfile")}
        message={t("home.checkConnection")}
        actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
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
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("home.viewMyReservations")}
          disabled={isLocked}
          className="mx-6 rounded-xl bg-primary py-4 disabled:opacity-60"
          style={({ pressed }) => ({
            opacity: pressed && !isLocked ? 0.86 : 1,
            ...getPressedScaleStyle(pressed, isLocked),
          })}
          onPressIn={() => {
            if (!isLocked) {
              void queryClient.prefetchInfiniteQuery(
                getMemberReservationsQueryOptions("all"),
              );
            }
          }}
          onPress={() => {
            if (isLocked) {
              return;
            }

            triggerImpactHaptic();
            runWithNavigationLock(() => {
              router.push("/reservation");
            });
          }}
        >
          <AppText
            variant="label"
            className="text-center text-base font-bold text-primary-foreground"
          >
            {t("home.viewMyReservations")}
          </AppText>
        </Pressable>
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
      <View className="flex-1 gap-8">
        <HappyGolfLogo
          width={148}
          height={35}
          primaryColor={colors.primary}
          accentColor={colors.warning}
        />

        {member ? (
          <MyTicket member={member} />
        ) : (
          <InlineState
            title={t("home.noMemberProfile")}
          />
        )}

        <TodayReservation />
      </View>
    </Screen>
  );
}
