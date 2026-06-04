import { CircleLoader } from "@/components/ui/CircleLoader";
import { authClient } from "@/lib/auth-client";
import { ThemeProvider } from "@/design-system/utils/theme";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession();
  const [hasResolvedInitialSession, setHasResolvedInitialSession] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setHasResolvedInitialSession(true);
    }
  }, [isPending]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <View className="flex-1 bg-background">
          <Stack>
            <Stack.Protected guard={!session}>
              <Stack.Screen
                name="login"
                options={{
                  headerShown: false,
                }}
              />
            </Stack.Protected>

            <Stack.Protected guard={!!session}>
              <Stack.Screen
                name="(app)"
                options={{
                  headerShown: false,
                }}
              />
            </Stack.Protected>
          </Stack>

          {!hasResolvedInitialSession && isPending ? (
            <View className="absolute inset-0 items-center justify-center bg-background/95">
              <CircleLoader logoOnly />
            </View>
          ) : null}
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
