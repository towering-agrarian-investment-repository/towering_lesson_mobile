import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import MyTicket from "@/components/golf/MyTicket";
import TodayReservation from "@/components/golf/TodayReservation";
import { AppText, CircleLoader, ErrorState, InlineState, Screen } from "@/design-system";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  View,
} from "react-native";

export default function HomeScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const {
    data: memberResponse,
    isLoading,
    isError,
    error,
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
    return <CircleLoader fullScreen label={t("home.loadingProfile")} />;
  }

  if (isError) {
    return (
      <ErrorState
        title={t("home.couldNotLoadProfile")}
        message={
          error instanceof Error
            ? error.message
            : t("home.checkConnection")
        }
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
        <Link href="/reservation" push asChild>
          <Pressable className="mx-6 rounded-xl bg-primary py-4 active:opacity-80">
            <AppText
              variant="label"
              className="text-center text-base font-bold text-primary-foreground"
            >
              {t("home.viewMyReservations")}
            </AppText>
          </Pressable>
        </Link>
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
        <HappyGolfLogo width={148} height={35} />

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
