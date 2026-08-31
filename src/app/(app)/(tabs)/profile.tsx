import {
    ActionSheet,
    AppText,
    CircleLoader,
    ConfirmSheet,
    Divider,
    ErrorState,
    getPressedScaleStyle,
    ListRow,
    Screen,
    Card,
    Button,
    triggerSelectionHaptic,
    type PrimaryColorPreference,
    type ThemePreference,
    useThemeColors,
    useThemePreference,
} from "@/design-system";
import { setAppLanguage, type AppLanguage } from "@/i18n";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { useAppUpdateContext } from "@/lib/update/update-context";
import { openStore } from "@/lib/update/app-update";
import { showAppToast } from "@/lib/toast/toast";
import { signOut } from "@/service/auth";
import { formatType } from "@/utils/format-enum";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import Constants from "expo-constants";
import { Href, Link } from "expo-router";
import { Download, Languages, Moon, Smartphone, Sun } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, View } from "react-native";
const APP_VERSION = Constants.expoConfig?.version;

export default function ProfileScreen() {
    const { i18n, t } = useTranslation();
    const colors = useThemeColors();
    const update = useAppUpdateContext();
    const queryClient = useQueryClient();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isSignOutSheetVisible, setIsSignOutSheetVisible] = useState(false);
    const [isChangingLanguage, setIsChangingLanguage] = useState(false);
    const {
        isThemeReady,
        themePreference,
        setThemePreference,
        primaryColorPreference,
        setPrimaryColorPreference,
    } = useThemePreference();

    const {
        data: memberResponse,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useGetMemberProfile();

    const member = memberResponse?.data;
    const handleSignOut = async () => {
        if (isSigningOut) {
            return;
        }

        setIsSigningOut(true);

        try {
            await signOut();
            queryClient.clear();
        } catch (error) {
            showAppToast({
                message:
                    error instanceof Error
                        ? error.message
                        : t("profile.signOutError"),
                type: "error",
            });
        } finally {
            setIsSigningOut(false);
        }
    };

    const confirmSignOut = () => {
        if (isSigningOut) {
            return;
        }

        setIsSignOutSheetVisible(true);
    };

    if (isLoading) {
        return <CircleLoader fullScreen />;
    }

    if (isError) {
        return (
            <ErrorState
                title={t("home.couldNotLoadProfile")}
                message={t("home.checkConnection")}
                actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                onAction={() => {
                    void refetch();
                }}
            />
        );
    }

    return (
        <Screen
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={() => {
                        void refetch();
                    }}
                />
            }
        >
            <ConfirmSheet
                visible={isSignOutSheetVisible}
                title={t("profile.logOutTitle")}
                message={t("profile.logOutMessage")}
                confirmLabel={t("profile.logOutTitle")}
                variant="danger"
                loading={isSigningOut}
                onClose={() => {
                    if (!isSigningOut) {
                        setIsSignOutSheetVisible(false);
                    }
                }}
                onConfirm={() => {
                    void handleSignOut();
                }}
            />

            <View className="flex-col gap-0">
                <ProfileHeader
                    name={member?.name}
                    checkinNumber={member?.checkinNumber}
                    imageUrl={member?.profileImage}
                />

                {update.isOptionalUpdateAvailable && update.state ? (
                    <Card className="gap-3 border-warning/30 bg-warning/10 p-4">
                        <ListRow
                            accessibilityLabel={t("appUpdate.updateAvailable")}
                            title={t("appUpdate.updateAvailable")}
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
                                void openStore(update.state!);
                            }}
                        />
                    </Card>
                ) : null}

                <Card className="gap-3 rounded-none border-0 bg-transparent p-0 pt-5 pb-3">
                    <SectionTitle title={t("profile.personalRecord")} />
                    <LinkRow label={t("navigation.tabs.lessons")} href="/(app)/(tabs)/lessons" />
                    <LinkRow label={t("profile.lessonLog")} href="/lesson-log" />
                </Card>

                <Card className="gap-4 rounded-none border-0 bg-transparent p-0 py-3">
                    <SectionTitle title={t("profile.generalInfo")} />

                    <View className="flex-col">
                        <InfoRow label={t("profile.phone")} value={member?.phoneNumber} />
                        <Divider className="bg-border" />
                        <InfoRow label={t("profile.gender")} value={formatType(member?.gender)} />
                    </View>
                </Card>

                {member?.grade ? (
                    <Card className="gap-4 rounded-none border-0 bg-transparent p-0 py-3">
                        <SectionTitle title={t("profile.schoolInfo")} />

                        <View className="flex-col">
                            <InfoRow label={t("profile.school")} value={member.grade.schoolName} />
                            <Divider className="bg-border" />
                            <InfoRow
                                label={t("profile.schoolCode")}
                                value={member.grade.schoolCode}
                            />
                            <Divider className="bg-border" />
                            <InfoRow label={t("profile.grade")} value={member.grade.name} />
                        </View>
                    </Card>
                ) : null}

                {member?.parents && member.parents.length > 0 ? (
                    <Card className="gap-4 rounded-none border-0 bg-transparent p-0 py-3">
                        <SectionTitle title={t("profile.parentsGuardians")} />

                        <View className="flex-col">
                            {member.parents.map((parent, index) => (
                                <View key={parent.id}>
                                    {index > 0 ? <Divider className="bg-border" /> : null}
                                    <ParentRow
                                        name={parent.name}
                                        role={parent.role}
                                        phoneNumber={parent.phoneNumber}
                                        imageUrl={parent.profileImage}
                                    />
                                </View>
                            ))}
                        </View>
                    </Card>
                ) : null}


                <Card className="gap-4 rounded-none border-0 bg-transparent p-0 py-3">
                    <SectionTitle title={t("profile.settings")} />

                    <View className="flex-col">
                        <LinkRow
                            label={t("profile.editPersonalInformation")}
                            href="/profile/edit"
                        />
                        <Divider className="bg-border" />
                        <LinkRow
                            label={t("profile.changePassword")}
                            href="/profile/change-password"
                        />
                        <Divider className="bg-border" />
                        <LanguagePreferenceRow
                            currentLanguage={resolveProfileLanguage(i18n.resolvedLanguage || i18n.language)}
                            disabled={isChangingLanguage}
                            onChange={async (nextLanguage) => {
                                if (isChangingLanguage) {
                                    return;
                                }

                                setIsChangingLanguage(true);

                                try {
                                    await setAppLanguage(nextLanguage);
                                } catch (error) {
                                    showAppToast({
                                        message:
                                            error instanceof Error
                                                ? error.message
                                                : t("common.refreshTryAgain"),
                                        type: "error",
                                    });
                                } finally {
                                    setIsChangingLanguage(false);
                                }
                            }}
                        />
                    </View>
                </Card>

                <Card className="gap-4 rounded-none border-0 bg-transparent p-0 py-3">
                    <SectionTitle title={t("profile.appearance")} />

                    <View className="flex-col">
                        <PrimaryColorPreferenceRow
                            preference={primaryColorPreference}
                            disabled={!isThemeReady}
                            onChange={(nextPreference) => {
                                void setPrimaryColorPreference(nextPreference);
                            }}
                        />
                        <Divider className="bg-border" />
                        <ThemePreferenceRow
                            preference={themePreference}
                            disabled={!isThemeReady}
                            onChange={(nextPreference) => {
                                void setThemePreference(nextPreference);
                            }}
                        />
                    </View>
                </Card>

                <SignOutButton
                    isSigningOut={isSigningOut}
                    onPress={confirmSignOut}
                />

                {APP_VERSION ? (
                    <AppText
                        selectable
                        variant="caption"
                        className="mt-4 pb-4 text-center text-muted-foreground"
                    >
                        v {APP_VERSION}
                    </AppText>
                ) : null}
            </View>
        </Screen>
    );
}

function resolveProfileLanguage(language: string | undefined): AppLanguage {
    const normalizedLanguage = language?.toLowerCase();

    if (normalizedLanguage?.startsWith("ko")) {
        return "ko";
    }

    if (normalizedLanguage?.startsWith("ja")) {
        return "ja";
    }

    if (normalizedLanguage?.startsWith("zh")) {
        return "zh";
    }

    if (normalizedLanguage?.startsWith("km")) {
        return "km";
    }

    return "en";
}

function ProfileHeader({
    name,
    checkinNumber,
    imageUrl,
}: {
    name?: string | null;
    checkinNumber?: string | null;
    imageUrl?: string | null;
}) {
    const { t } = useTranslation();

    return (
        <View className="flex-row items-center gap-5">
            <ProfileAvatar name={name} imageUrl={imageUrl} size="large" />

            <View className="min-w-0 flex-1 flex-col gap-3">
                <View className="flex-col gap-1">
                    <AppText
                        selectable
                        variant="h2"
                        numberOfLines={2}
                    >
                        {name || "-"}
                    </AppText>

                    <View className="flex-row items-center gap-1">
                        <AppText variant="caption" className="text-foreground/60">
                            {t("profile.checkInNo")}:
                        </AppText>
                        <AppText
                            selectable
                            variant="subtext"
                            className="text-foreground/80"
                            numberOfLines={1}
                        >
                            {checkinNumber || "-"}
                        </AppText>
                    </View>
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
    const imageSize = size === "large" ? 96 : 48;
    const containerClassName =
    size === "large"
            ? "h-24 w-24 bg-primary"
            : "h-12 w-12 bg-primary";
    const textVariant = size === "large" ? "h1" : "h3";

    if (imageUrl) {
        return (
            <Image
                source={{ uri: imageUrl }}
                style={{
                    width: imageSize,
                    height: imageSize,
                    borderRadius: 999,
                }}
                contentFit="cover"
            />
        );
    }

    return (
        <View
            className={`shrink-0 items-center justify-center rounded-full ${containerClassName}`}
        >
            <AppText variant={textVariant} className="font-bold text-primary-foreground">
                {name?.charAt(0).toUpperCase() || "?"}
            </AppText>
        </View>
    );
}

function SectionTitle({ title }: { title: string }) {
    return (
        <AppText
            variant="label"
            className="text-sm font-semibold tracking-wide text-muted-foreground"
        >
            {title}
        </AppText>
    );
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    if (!value) {
        return null;
    }

    return (
        <View className="flex-row items-start justify-between gap-4 py-4">
            <AppText
                selectable
                variant="meta"
                className="min-w-[104px] text-foreground/75"
            >
                {label}
            </AppText>

            <AppText
                selectable
                variant="body"
                className="min-w-0 flex-1 text-right text-foreground"
            >
                {value}
            </AppText>
        </View>
    );
}

function ParentRow({
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
    return (
        <View className="flex-row items-center gap-4 py-4">
            <ProfileAvatar name={name} imageUrl={imageUrl} />

            <View className="min-w-0 flex-1 flex-col gap-1">
                <View className="flex-row items-center justify-between gap-2">
                    <AppText
                        selectable
                        variant="body"
                        className="min-w-0 flex-1"
                        numberOfLines={1}
                    >
                        {name}
                    </AppText>

                    {role ? (
                        <AppText
                            selectable
                            variant="caption"
                            className="shrink-0 text-right text-muted-foreground"
                            numberOfLines={1}
                        >
                            {formatType(role)}
                        </AppText>
                    ) : null}
                </View>

                {phoneNumber ? (
                    <AppText
                        selectable
                        variant="subtext"
                        className="text-foreground/80"
                    >
                        {phoneNumber}
                    </AppText>
                ) : null}

                {/* <AppText
                    selectable
                    variant="count"
                    className="text-foreground/75"
                    style={{ fontVariant: ["tabular-nums"] }}
                >
                    {t("profile.childCount", { count: childrenCount })}
                </AppText> */}
            </View>
        </View>
    );
}

function LinkRow({ label, href }: { label: string; href: Href }) {
    return (
        <Link href={href} asChild>
            <ListRow title={label} className="px-0 py-3 border-0 bg-transparent" />
        </Link>
    );
}

function ThemePreferenceRow({
    disabled,
    preference,
    onChange,
}: {
    disabled: boolean;
    preference: ThemePreference;
    onChange: (preference: ThemePreference) => void;
}) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const [isThemeSheetVisible, setIsThemeSheetVisible] = useState(false);
    const themeOptions: { label: string; value: ThemePreference }[] = [
        { label: t("profile.system"), value: "system" },
        { label: t("profile.light"), value: "light" },
        { label: t("profile.dark"), value: "dark" },
    ];
    const selectedLabel =
        themeOptions.find((option) => option.value === preference)?.label ?? t("profile.system");

    return (
        <>
            <ListRow
                accessibilityRole="button"
                accessibilityLabel={t("profile.chooseAppAppearance")}
                disabled={disabled}
                className="border-0 bg-transparent px-0 py-3"
                onPress={() => {
                    if (!disabled) {
                        setIsThemeSheetVisible(true);
                    }
                }}
                title={t("profile.theme")}
                meta={selectedLabel}
            />

            <ThemePreferenceSheet
                visible={isThemeSheetVisible}
                preference={preference}
                colors={colors}
                t={t}
                onClose={() => {
                    setIsThemeSheetVisible(false);
                }}
                onSelect={(nextPreference) => {
                    onChange(nextPreference);
                }}
            />
        </>
    );
}

function PrimaryColorPreferenceRow({
    disabled,
    preference,
    onChange,
}: {
    disabled: boolean;
    preference: PrimaryColorPreference;
    onChange: (preference: PrimaryColorPreference) => void;
}) {
    const { t } = useTranslation();
    const [isSheetVisible, setIsSheetVisible] = useState(false);
    const selectedLabel = preference === "green"
        ? t("profile.greenPrimaryColorLabel")
        : t("profile.bluePrimaryColorLabel");

    return (
        <>
            <ListRow
                accessibilityRole="button"
                accessibilityLabel={t("profile.choosePrimaryColorLabel")}
                disabled={disabled}
                className="border-0 bg-transparent px-0 py-3"
                onPress={() => {
                    if (!disabled) {
                        setIsSheetVisible(true);
                    }
                }}
                title={t("profile.primaryColorLabel")}
                meta={selectedLabel}
            />

            <ActionSheet
                visible={isSheetVisible}
                title={t("profile.primaryColorLabel")}
                description={t("profile.primaryColorDescriptionLabel")}
                onClose={() => setIsSheetVisible(false)}
                options={[
                    {
                        key: "blue",
                        title: t("profile.bluePrimaryColorLabel"),
                        description: "#00AEEF",
                        icon: <View className="h-6 w-6 rounded-full bg-[#00AEEF]" />,
                        selected: preference === "blue",
                        onPress: () => {
                            triggerSelectionHaptic();
                            onChange("blue");
                            setIsSheetVisible(false);
                        },
                    },
                    {
                        key: "green",
                        title: t("profile.greenPrimaryColorLabel"),
                        description: "#00BC7D",
                        icon: <View className="h-6 w-6 rounded-full bg-[#00BC7D]" />,
                        selected: preference === "green",
                        onPress: () => {
                            triggerSelectionHaptic();
                            onChange("green");
                            setIsSheetVisible(false);
                        },
                    },
                ]}
            />
        </>
    );
}

function LanguagePreferenceRow({
    currentLanguage,
    disabled,
    onChange,
}: {
    currentLanguage: AppLanguage;
    disabled: boolean;
    onChange: (language: AppLanguage) => Promise<void>;
}) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const [isLanguageSheetVisible, setIsLanguageSheetVisible] = useState(false);
    const languageOptions: { label: string; value: AppLanguage }[] = [
        { label: t("profile.english"), value: "en" },
        { label: t("profile.korean"), value: "ko" },
        { label: t("profile.japanese"), value: "ja" },
        { label: t("profile.chinese"), value: "zh" },
        { label: t("profile.khmer"), value: "km" },
    ];
    const selectedLabel =
        languageOptions.find((option) => option.value === currentLanguage)?.label ??
        t("profile.english");

    return (
        <>
            <ListRow
                accessibilityRole="button"
                accessibilityLabel={t("profile.chooseAppLanguage")}
                disabled={disabled}
                className="border-0 bg-transparent px-0 py-3"
                onPress={() => {
                    if (!disabled) {
                        setIsLanguageSheetVisible(true);
                    }
                }}
                title={t("profile.language")}
                meta={selectedLabel}
            />

            <ActionSheet
                visible={isLanguageSheetVisible}
                title={t("profile.language")}
                description={t("profile.languageDescription")}
                onClose={() => {
                    if (!disabled) {
                        setIsLanguageSheetVisible(false);
                    }
                }}
                options={[
                    {
                        key: "en",
                        title: t("profile.english"),
                        description: t("profile.useEnglishLanguage"),
                        icon: <AppText className="text-2xl">🇬🇧</AppText>,
                        selected: currentLanguage === "en",
                        onPress: () => {
                            triggerSelectionHaptic();
                            void onChange("en");
                            setIsLanguageSheetVisible(false);
                        },
                    },
                    {
                        key: "ko",
                        title: t("profile.korean"),
                        description: t("profile.useKoreanLanguage"),
                        icon: <AppText className="text-2xl">🇰🇷</AppText>,
                        selected: currentLanguage === "ko",
                        onPress: () => {
                            triggerSelectionHaptic();
                            void onChange("ko");
                            setIsLanguageSheetVisible(false);
                        },
                    },
                    {
                        key: "ja",
                        title: t("profile.japanese"),
                        description: t("profile.useJapaneseLanguage"),
                        icon: <AppText className="text-2xl">🇯🇵</AppText>,
                        selected: currentLanguage === "ja",
                        onPress: () => {
                            triggerSelectionHaptic();
                            void onChange("ja");
                            setIsLanguageSheetVisible(false);
                        },
                    },
                    {
                        key: "zh",
                        title: t("profile.chinese"),
                        description: t("profile.useChineseLanguage"),
                        icon: <AppText className="text-2xl">🇨🇳</AppText>,
                        selected: currentLanguage === "zh",
                        onPress: () => {
                            triggerSelectionHaptic();
                            void onChange("zh");
                            setIsLanguageSheetVisible(false);
                        },
                    },
                    {
                        key: "km",
                        title: t("profile.khmer"),
                        description: t("profile.useKhmerLanguage"),
                        icon: <AppText className="text-2xl">🇰🇭</AppText>,
                        selected: currentLanguage === "km",
                        onPress: () => {
                            triggerSelectionHaptic();
                            void onChange("km");
                            setIsLanguageSheetVisible(false);
                        },
                    },
                ]}
            />
        </>
    );
}

function ThemePreferenceSheet({
    visible,
    preference,
    colors,
    t,
    onClose,
    onSelect,
}: {
    visible: boolean;
    preference: ThemePreference;
    colors: ReturnType<typeof useThemeColors>;
    t: (key: string) => string;
    onClose: () => void;
    onSelect: (preference: ThemePreference) => void;
}) {
    return (
        <ActionSheet
            visible={visible}
            title={t("profile.appearance")}
            description={t("profile.appearanceDescription")}
            onClose={onClose}
            options={[
                {
                    key: "system",
                    title: t("profile.system"),
                    description: t("profile.followDeviceSetting"),
                    icon: <Smartphone size={22} color={colors.foreground} />,
                    selected: preference === "system",
                    onPress: () => {
                        triggerSelectionHaptic();
                        onSelect("system");
                    },
                },
                {
                    key: "light",
                    title: t("profile.light"),
                    description: t("profile.useLightAppearance"),
                    icon: <Sun size={22} color={colors.foreground} />,
                    selected: preference === "light",
                    onPress: () => {
                        triggerSelectionHaptic();
                        onSelect("light");
                    },
                },
                {
                    key: "dark",
                    title: t("profile.dark"),
                    description: t("profile.useDarkAppearance"),
                    icon: <Moon size={22} color={colors.foreground} />,
                    selected: preference === "dark",
                    onPress: () => {
                        triggerSelectionHaptic();
                        onSelect("dark");
                    },
                },
            ]}
        />
    );
}

function SignOutButton({
    isSigningOut,
    onPress,
}: {
    isSigningOut: boolean;
    onPress: () => void;
}) {
    const { t } = useTranslation();
    return (
        <Pressable
            onPress={onPress}
            disabled={isSigningOut}
            className="mt-5 rounded-xl border border-danger/20 bg-danger/10 px-4 py-4"
            style={({ pressed }) => getPressedScaleStyle(pressed, isSigningOut, 0.992)}
        >
            <AppText variant="label" className="text-danger">
                {isSigningOut ? t("profile.loggingOut") : t("profile.logOut")}
            </AppText>
        </Pressable>
    );
}
