import GolfHeader from "@/components/golf/GolfHeader";
import MyTicket from "@/components/golf/MyTicket";
import TodayReservation from "@/components/golf/TodayReservation";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { cn } from "@/utils/cn";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function HomeScreen() {
  const {
    data: memberResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useGetMemberProfile();

  const member = memberResponse?.data;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-gray-500">Loading your profile...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-lg font-bold text-gray-900 mb-2 text-center">
          Could not load profile
        </Text>
        <Text className="text-gray-500 text-center mb-4">
          {error instanceof Error
            ? error.message
            : "Please check your connection and try again."}
        </Text>
        <Pressable
          onPress={() => refetch()}
          disabled={isRefetching}
          className={cn(
            "bg-green-600 py-3 px-5 rounded-xl",
            isRefetching && "opacity-60"
          )}
        >
          {isRefetching ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold">Try Again</Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="bg-white p-4" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 justify-between">
        <View>
          <GolfHeader />
          {member ? (
            <MyTicket member={member} />
          ) : (
            <View className="p-6 items-center">
              <Text className="text-gray-500 text-center">
                No member profile found.
              </Text>
            </View>
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