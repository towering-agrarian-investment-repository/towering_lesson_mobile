import GolfHeader from "@/components/golf/GolfHeader";
import MyTicket from "@/components/golf/MyTicket";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { globalStyles } from "@/styles/global";
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
      <View
        style={[
          globalStyles.container,
          {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          },
        ]}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12, color: "#6B7280" }}>
          Loading your profile...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={[
          globalStyles.container,
          {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          },
        ]}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Could not load profile
        </Text>

        <Text
          style={{
            color: "#6B7280",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          {error instanceof Error
            ? error.message
            : "Please check your connection and try again."}
        </Text>

        <Pressable
          onPress={() => refetch()}
          disabled={isRefetching}
          style={{
            backgroundColor: "#16A34A",
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 10,
            opacity: isRefetching ? 0.6 : 1,
          }}
        >
          {isRefetching ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
              Try Again
            </Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <View>
          <GolfHeader />

          {member ? (
            <MyTicket member={member} />
          ) : (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text style={{ color: "#6B7280", textAlign: "center" }}>
                No member profile found.
              </Text>
            </View>
          )}
        </View>

        <Link href="/reservation" style={globalStyles.link}>
          VIEW MY RESERVATIONS
        </Link>
      </View>
    </ScrollView>
  );
}