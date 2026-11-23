import { AnimatedPressable } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function ProfileImageViewer({
  imageUri,
  onClose,
}: {
  imageUri: string | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  return (
    <View
      className="flex-1 gap-4 bg-black"
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 8,
        paddingLeft: Math.max(insets.left, 16),
        paddingRight: Math.max(insets.right, 16),
      }}
    >
      <StatusBar style="light" />
      <View className="items-end">
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={t("common.closeTitle", {
            title: t("profile.viewProfilePhoto"),
          })}
          haptic="selection"
          className="h-12 w-12 items-center justify-center rounded-full bg-white/20"
          onPress={onClose}
        >
          <X size={24} color={colors.primaryForeground} />
        </AnimatedPressable>
      </View>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          cachePolicy="memory-disk"
          recyclingKey={imageUri}
          contentFit="contain"
          transition={reducedMotion ? 0 : 150}
          style={{ width: "100%", flex: 1 }}
          accessibilityLabel={t("profile.viewProfilePhoto")}
        />
      ) : null}
    </View>
  );
}
