import GolfHeader from "@/components/golf/GolfHeader";
import MyTicket from "@/components/golf/MyTicket";
import TodayReservation from "@/components/golf/TodayReservation";
import { CircleLoader } from "@/components/ui/CircleLoader";
import { EmptyState, ErrorState } from "@/components/ui/StateCard";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/utils/cn";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
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
        queryClient.invalidateQueries({ queryKey: ["member", "tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["member", "reservations", "today"] }),
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
    <ScrollView
      className="bg-white p-4"
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      }
    >
      <View className="flex-1 justify-between">
        <View>
          <GolfHeader />
          {member ? (
            <MyTicket member={member} />
          ) : (
            <EmptyState
              title="No member profile found"
              message="This account does not have a member profile yet."
            />
          )}
          <TodayReservation />
        </View>

        <Link href="/reservation" asChild>
          <Pressable className="mt-4 rounded-2xl bg-green-600 py-4 active:bg-green-700">
            <Text className="text-center text-base font-bold text-white">
              VIEW MY RESERVATIONS
            </Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}
