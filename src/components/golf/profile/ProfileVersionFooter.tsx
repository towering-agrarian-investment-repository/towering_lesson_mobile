import { AppText } from "@/design-system/components/AppText";
import { formatDateMedium } from "@/utils/time-helper";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const APP_VERSION = Constants.expoConfig?.version;
const APP_CONTENT_DATE = Updates.createdAt;

export function ProfileVersionFooter() {
    const { t } = useTranslation();

    if (!APP_VERSION) {
        return null;
    }

    return (
        <View className="items-center gap-1 pt-4 pb-4">
            <AppText variant="caption" color="mutedForeground" align="center">
                {"v " + APP_VERSION}
            </AppText>
            {APP_CONTENT_DATE ? (
                <AppText variant="caption" color="mutedForeground" align="center">
                    {t("appUpdate.currentContentDate", {
                        date: formatDateMedium(APP_CONTENT_DATE),
                    })}
                </AppText>
            ) : null}
        </View>
    );
}
