import { CircleLoader } from "@/components/ui/CircleLoader";
import { authClient } from "@/lib/auth-client";
import { Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../../global.css";

export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession();
  const hasResolvedInitialSession = useRef(false);

  useEffect(() => {
    if (!isPending) {
      hasResolvedInitialSession.current = true;
    }
  }, [isPending]);

  if (!hasResolvedInitialSession.current && isPending) {
    return (
      <SafeAreaProvider>
        <CircleLoader fullScreen logoOnly />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
