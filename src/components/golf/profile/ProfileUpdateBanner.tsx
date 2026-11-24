import { ListRow } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { openStore } from "@/lib/update/app-update";
import { useAppUpdateContext } from "@/lib/update/update-context";
import { Download } from "lucide-react-native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

export function ProfileUpdateBanner() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const update = useAppUpdateContext();
    const [isOpeningStore, setIsOpeningStore] = useState(false);
    const openingStore = useRef(false);

    const handleOpenStore = async () => {
        if (openingStore.current || !update.state) return;
        openingStore.current = true;
        setIsOpeningStore(true);
        try {
            await openStore(update.state);
        } finally {
            openingStore.current = false;
            setIsOpeningStore(false);
        }
    };

    if (!update.isOptionalUpdateAvailable || !update.state) {
        return null;
    }

    return (
        <View className="mt-5 gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
            <ListRow
                accessibilityLabel={t("appUpdate.updateAvailable")}
                title={t(isOpeningStore ? "appUpdate.openingStore" : "appUpdate.updateAvailable")}
                disabled={isOpeningStore}
                accessibilityState={{ disabled: isOpeningStore, busy: isOpeningStore }}
                trailing={isOpeningStore ? <ActivityIndicator color={colors.warning} /> : undefined}
                subtitle={t("appUpdate.newVersion", {
                    version: update.state.latestVersion ?? "",
                })}
                leading={
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-warning/20">
                        <Download size={20} color={colors.warning} />
                    </View>
                }
                className="border-0 bg-transparent px-0"
                onPress={() => {
                    void handleOpenStore();
                }}
            />
        </View>
    );
}
