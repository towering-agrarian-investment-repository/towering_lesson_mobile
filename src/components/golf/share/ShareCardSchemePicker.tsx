import { AnimatedPressable, AppText, cn, getThemeColors, triggerSelectionHaptic } from "@/design-system";
import type { PrimaryColorPreference } from "@/design-system/utils/theme";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const POSTER_SCHEMES = ["light", "dark"] as const;

type ShareCardSchemePickerProps = {
    posterScheme: (typeof POSTER_SCHEMES)[number];
    isBusy: boolean;
    primaryColorPreference: PrimaryColorPreference;
    onSelect: (scheme: (typeof POSTER_SCHEMES)[number]) => void;
};

export function ShareCardSchemePicker({
    posterScheme,
    isBusy,
    primaryColorPreference,
    onSelect,
}: ShareCardSchemePickerProps) {
    const { t } = useTranslation();

    return (
        <View className="flex-row items-center justify-center gap-5">
            {POSTER_SCHEMES.map((schemeOption) => {
                const isSelected = posterScheme === schemeOption;
                const swatchColors = getThemeColors(schemeOption, primaryColorPreference);
                const schemeLabel = t(`profile.${schemeOption}`);
                return (
                    <AnimatedPressable
                        key={schemeOption}
                        accessibilityRole="button"
                        accessibilityLabel={schemeLabel}
                        accessibilityState={{
                            selected: isSelected,
                            disabled: isBusy,
                        }}
                        disabled={isBusy}
                        onPress={() => {
                            if (isBusy || isSelected) {
                                return;
                            }
                            triggerSelectionHaptic();
                            onSelect(schemeOption);
                        }}
                        className="min-h-12 items-center gap-1.5 px-2 disabled:opacity-60"
                    >
                        <View
                            className={cn(
                                "h-9 w-9 items-center justify-center rounded-full border-2 p-0.5",
                                isSelected ? "border-primary" : "border-border",
                            )}
                        >
                            <View
                                className="h-full w-full flex-row overflow-hidden rounded-full"
                                style={{
                                    transform: [
                                        {
                                            rotate: "-35deg",
                                        },
                                    ],
                                }}
                            >
                                <View
                                    className="flex-1"
                                    style={{
                                        backgroundColor: swatchColors.card,
                                    }}
                                />
                                <View
                                    className="flex-1"
                                    style={{
                                        backgroundColor: swatchColors.primary,
                                    }}
                                />
                            </View>
                        </View>
                        <AppText
                            variant="badge"
                            color={isSelected ? "foreground" : "mutedForeground"}
                            wrap={false}
                            textStyle={{
                                fontWeight: isSelected ? "700" : "500",
                            }}
                        >
                            {schemeLabel}
                        </AppText>
                    </AnimatedPressable>
                );
            })}
        </View>
    );
}
