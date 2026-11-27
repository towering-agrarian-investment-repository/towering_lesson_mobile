import { useIsOnline } from "@/lib/hook/useIsOnline";
import WifiOff from "lucide-react-native/icons/wifi-off";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useTheme } from "../utils/theme";
import { AppText } from "./AppText";

/** Slim, non-blocking banner shown while React Query considers the app offline. */
export function OfflineBanner() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const isOnline = useIsOnline();

    if (isOnline) return null;

    return (
        <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            className="mb-3 flex-row items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2"
        >
            <WifiOff size={16} color={colors.warning} strokeWidth={2} />
            <AppText variant="subtext" color="warning">
                {t("common.offlineMessage")}
            </AppText>
        </View>
    );
}
