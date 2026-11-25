import { AnimatedPressable, Badge, ListRow, type PrimaryColorPreference, type ThemePreference } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { getThemeColors, useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import type { AppLanguage } from "@/i18n";
import { formatType } from "@/utils/format-enum";
import { Image } from "expo-image";
import { Link, type Href } from "expo-router";
import { ChevronRight, Globe2, Moon, Palette, Smartphone, Sun, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { ProfilePreferenceRow } from "./ProfilePreferenceRow";

const LANGUAGES: {
    value: AppLanguage;
    label: string;
    description: string;
    flag: string;
}[] = [
    {
        value: "en",
        label: "english",
        description: "useEnglishLanguage",
        flag: "\u{1F1EC}\u{1F1E7}",
    },
    {
        value: "ko",
        label: "korean",
        description: "useKoreanLanguage",
        flag: "\u{1F1F0}\u{1F1F7}",
    },
    {
        value: "ja",
        label: "japanese",
        description: "useJapaneseLanguage",
        flag: "\u{1F1EF}\u{1F1F5}",
    },
    {
        value: "zh",
        label: "chinese",
        description: "useChineseLanguage",
        flag: "\u{1F1E8}\u{1F1F3}",
    },
    {
        value: "km",
        label: "khmer",
        description: "useKhmerLanguage",
        flag: "\u{1F1F0}\u{1F1ED}",
    },
];

export function ProfileHeader({
    name,
    checkinNumber,
    imageUrl,
    onImagePress,
}: {
    name?: string | null;
    checkinNumber?: string | null;
    imageUrl?: string | null;
    onImagePress: () => void;
}) {
    const { t } = useTranslation();

    return (
        <View className="flex-row items-center gap-5">
            {imageUrl ? (
                <AnimatedPressable
                    accessibilityRole="button"
                    accessibilityLabel={t("profile.viewProfilePhoto")}
                    className="rounded-full"
                    haptic="selection"
                    onPress={onImagePress}
                >
                    <ProfileAvatar name={name} imageUrl={imageUrl} size="large" />
                </AnimatedPressable>
            ) : (
                <ProfileAvatar name={name} size="large" />
            )}

            <View className="min-w-0 flex-1 flex-col gap-3">
                <View className="flex-col gap-1">
                    <AppText variant="h2" numberOfLines={2}>
                        {name || "-"}
                    </AppText>

                    <AppText variant="subtext" color="mutedForeground" numberOfLines={2} tabular>
                        {`${t("profile.checkInNo")}: ${checkinNumber || "-"}`}
                    </AppText>
                </View>
            </View>
        </View>
    );
}

function ProfileAvatar({
    name,
    imageUrl,
    size = "small",
}: {
    name?: string | null;
    imageUrl?: string | null;
    size?: "small" | "large";
}) {
    const { colors } = useTheme();
    const reducedMotion = useReducedMotion();
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const dimensionClassName = size === "large" ? "h-24 w-24" : "h-12 w-12";
    const textVariant = size === "large" ? "h1" : "h3";

    if (imageUrl && failedUrl !== imageUrl) {
        return (
            <View className={`${dimensionClassName} shrink-0 overflow-hidden rounded-full bg-muted`}>
                <Image
                    source={{ uri: imageUrl }}
                    cachePolicy="memory-disk"
                    recyclingKey={imageUrl}
                    transition={reducedMotion ? 0 : 150}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    onError={() => setFailedUrl(imageUrl)}
                />
            </View>
        );
    }

    return (
        <View
            className={`${dimensionClassName} shrink-0 items-center justify-center rounded-full`}
            style={{ backgroundColor: colors.primary }}
        >
            <AppText
                variant={textVariant}
                color="primaryForeground"
                wrap={false}
                textStyle={{ fontWeight: "700" as const }}
            >
                {name?.charAt(0).toUpperCase() || "?"}
            </AppText>
        </View>
    );
}

export function SectionTitle({ title }: { title: string }) {
    return (
        <AppText
            variant="label"
            color="mutedForeground"
            wrap={false}
            textStyle={{
                lineHeight: typography.subtext.lineHeight,
                fontSize: typography.subtext.fontSize,
                fontWeight: "600" as const,
                letterSpacing: 0.4,
            }}
        >
            {title}
        </AppText>
    );
}

export function InfoRow({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string | null | undefined;
    icon: LucideIcon;
}) {
    const { colors } = useTheme();
    if (!value) {
        return null;
    }

    return (
        <View className="min-h-14 flex-row items-center gap-3 px-4 py-3">
            <Icon size={20} color={colors.foreground} />
            <AppText variant="body" style={{ flex: 1, minWidth: 0 }}>
                {label}
            </AppText>

            <AppText
                variant="body"
                align="right"
                style={{ flexShrink: 1, maxWidth: "55%" }}
                textStyle={{ fontWeight: "600" }}
            >
                {value}
            </AppText>
        </View>
    );
}

export function ParentRow({
    name,
    role,
    phoneNumber,
    imageUrl,
}: {
    name: string;
    role?: string | null;
    phoneNumber?: string | null;
    imageUrl?: string | null;
}) {
    const { t } = useTranslation();

    return (
        <View className="min-h-16 flex-row items-center gap-3 px-4 py-2">
            <ProfileAvatar name={name} imageUrl={imageUrl} />

            <View className="min-w-0 flex-1 flex-col gap-1">
                <AppText variant="body" numberOfLines={1}>
                    {name}
                </AppText>

                {phoneNumber ? (
                    <AppText variant="subtext" color="mutedForeground" tabular>
                        {phoneNumber}
                    </AppText>
                ) : null}
            </View>
            {role ? <Badge label={formatType(role, t)} size="sm" className="max-w-[38%]" /> : null}
        </View>
    );
}

export function LinkRow({
    label,
    href,
    count,
    icon: Icon,
}: {
    label: string;
    href: Href;
    count?: number;
    icon: LucideIcon;
}) {
    const { colors } = useTheme();
    return (
        <Link href={href} asChild>
            <ListRow
                title={label}
                accessibilityLabel={!count ? label : `${label}, ${count}`}
                leading={<Icon size={20} color={colors.foreground} />}
                showChevron={false}
                trailing={
                    <View className="min-h-8 flex-row items-center gap-2">
                        {count ? (
                            <View className="min-h-6 min-w-6 items-center justify-center rounded-full bg-danger px-1.5 py-0.5">
                                <AppText variant="badge" color="dangerForeground" align="center" wrap={false}>
                                    {count > 99 ? "99+" : String(count)}
                                </AppText>
                            </View>
                        ) : null}
                        <ChevronRight size={18} color={colors.mutedForeground} />
                    </View>
                }
                className="min-h-14 rounded-lg border-0 bg-transparent py-3"
            />
        </Link>
    );
}

export function ThemePreferenceRow({
    disabled,
    preference,
    onChange,
}: {
    disabled: boolean;
    preference: ThemePreference;
    onChange: (value: ThemePreference) => Promise<void>;
}) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const leadingIcon =
        preference === "dark" ? (
            <Moon size={20} color={colors.foreground} />
        ) : preference === "light" ? (
            <Sun size={20} color={colors.foreground} />
        ) : (
            <Smartphone size={20} color={colors.foreground} />
        );

    return (
        <ProfilePreferenceRow
            title={t("profile.theme")}
            leading={leadingIcon}
            accessibilityLabel={t("profile.chooseAppAppearance")}
            sheetTitle={t("profile.appearance")}
            description={t("profile.appearanceDescription")}
            value={preference}
            disabled={disabled}
            onChange={onChange}
            options={[
                {
                    value: "system",
                    label: t("profile.system"),
                    description: t("profile.followDeviceSetting"),
                    icon: <Smartphone size={22} color={colors.foreground} />,
                },
                {
                    value: "light",
                    label: t("profile.light"),
                    description: t("profile.useLightAppearance"),
                    icon: <Sun size={22} color={colors.foreground} />,
                },
                {
                    value: "dark",
                    label: t("profile.dark"),
                    description: t("profile.useDarkAppearance"),
                    icon: <Moon size={22} color={colors.foreground} />,
                },
            ]}
        />
    );
}

export function PrimaryColorPreferenceRow({
    disabled,
    preference,
    onChange,
}: {
    disabled: boolean;
    preference: PrimaryColorPreference;
    onChange: (value: PrimaryColorPreference) => void;
}) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    return (
        <ProfilePreferenceRow
            title={t("profile.primaryColorLabel")}
            leading={<Palette size={20} color={colors.foreground} />}
            accessibilityLabel={t("profile.choosePrimaryColorLabel")}
            description={t("profile.primaryColorDescriptionLabel")}
            value={preference}
            disabled={disabled}
            onChange={onChange}
            options={(["blue", "green"] as const).map((value) => {
                const color = getThemeColors("light", value).primary;
                return {
                    value,
                    label: t(value === "blue" ? "profile.bluePrimaryColorLabel" : "profile.greenPrimaryColorLabel"),
                    description: color.toUpperCase(),
                    icon: <View className="h-6 w-6 rounded-full" style={{ backgroundColor: color }} />,
                };
            })}
        />
    );
}

export function LanguagePreferenceRow({
    currentLanguage,
    disabled,
    onChange,
}: {
    currentLanguage: AppLanguage;
    disabled: boolean;
    onChange: (language: AppLanguage) => Promise<void>;
}) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    return (
        <ProfilePreferenceRow
            title={t("profile.language")}
            leading={<Globe2 size={20} color={colors.foreground} />}
            accessibilityLabel={t("profile.chooseAppLanguage")}
            description={t("profile.languageDescription")}
            value={currentLanguage}
            disabled={disabled}
            onChange={onChange}
            options={LANGUAGES.map((language) => ({
                value: language.value,
                label: t(`profile.${language.label}`),
                description: t(`profile.${language.description}`),
                icon: (
                    <AppText variant="h2" wrap={false}>
                        {language.flag}
                    </AppText>
                ),
            }))}
        />
    );
}
