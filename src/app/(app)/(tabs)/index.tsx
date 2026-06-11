import { HappyGolfLogo } from "@/components/golf/HappyLogo";
import MyTicket from "@/components/golf/MyTicket";
import TodayReservation from "@/components/golf/TodayReservation";
import { AppText as Text, CircleLoader, EmptyState, ErrorState, Screen } from "@/design-system";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  View,
} from "react-native";

export default function HomeScreen() {
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
    return <CircleLoader fullScreen label="Loading your profile..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load profile"
        message={
          error instanceof Error
            ? error.message
            : "Please check your connection and try again."
        }
        actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
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
            <Text variant="label" className="text-center text-base font-bold text-primary-foreground">
              VIEW MY RESERVATIONS
            </Text>
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
        {/* <GolfHeader /> */}
        <HappyGolfLogo width={148} height={35} />

        {member ? (
          <MyTicket member={member} />
        ) : (
          <EmptyState
            title="No member profile found"
            message="This account does not have a member profile yet."
          />
        )}

        <View className="flex-1">
          <TodayReservation />
        </View>
      </View>
    </Screen>
  );
}
