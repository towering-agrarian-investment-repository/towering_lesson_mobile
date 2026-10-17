import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { NativeText } from "@/design-system/components/NativeText";
import {
    getNativeButtonStyle,
    getNativeButtonTextStyle,
} from "@/design-system/utils/native-button-styles";
import {
    CircleLoader,
    Divider,
    ErrorState,
    ListRow,
    Screen,
    type PrimaryColorPreference,
    type ThemePreference,
} from "@/design-system";
import { AdaptivePanels } from "@/design-system/layout/AdaptivePanels";
import { cn } from "@/design-system/utils/cn";
import { getThemeColors, useTheme } from "@/design-system/utils/theme";
import { ProfilePreferenceRow } from "@/components/golf/profile/ProfilePreferenceRow";
import { typography } from "@/design-system/utils/typography";
import { setAppLanguage, type AppLanguage } from "@/i18n";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { showAppToast } from "@/lib/toast/toast";
import { openStore } from "@/lib/update/app-update";
import { useAppUpdateContext } from "@/lib/update/update-context";
import { signOut } from "@/service/auth";
import type { GenderEnum } from "@/types/member.type";
import { formatType } from "@/utils/format-enum";
import { BottomSheet, Button, Column, Host, RNHostView, Row, Text, Spacer } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame, interactiveDismissDisabled, presentationCornerRadius } from "@expo/ui/swift-ui/modifiers";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { Href, Link } from "expo-router";
import { Download, Moon, Smartphone, Sun } from "lucide-react-native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, RefreshControl, View } from "react-native";
const APP_VERSION = Constants.expoConfig?.version;

export default function ProfileScreen() {
    const {
        colors,
        fontScale: uiFontScale,
        isReady: isThemeReady,
        preference: themePreference,
        setPreference: setThemePreference,
        primaryColorPreference,
        setPrimaryColorPreference,
    } = useTheme();
    const { i18n, t } = useTranslation();
    const update = useAppUpdateContext();
    const queryClient = useQueryClient();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isSignOutSheetVisible, setIsSignOutSheetVisible] = useState(false);
    const signOutLocked = useRef(false);
    const [isChangingLanguage, setIsChangingLanguage] = useState(false);

    const {
        data: memberResponse,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useGetMemberProfile();
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => refetch({ cancelRefetch: false }));

    const member = memberResponse?.data;
    const genderLabels: Record<GenderEnum, string> = {
        MALE: t("profile.genderMale"),
        FEMALE: t("profile.genderFemale"),
        OTHER: t("profile.genderOther"),
    };
    const handleSignOut = async () => {
        if (signOutLocked.current) return;
        signOutLocked.current = true;
        setIsSigningOut(true);

        try {
            await signOut();
            queryClient.clear();
            setIsSignOutSheetVisible(false);
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
            signOutLocked.current = false;
        }
    };

    const confirmSignOut = () => {
        if (isSigningOut) {
            return;
        }

        setIsSignOutSheetVisible(true);
    };

    const closeSignOutSheet = () => { if (!signOutLocked.current) setIsSignOutSheetVisible(false); };

    if (isLoading) {
        return <CircleLoader fullScreen />;
    }

    if (isError && !memberResponse) {
        return (
            <ErrorState
                title={t("home.couldNotLoadProfile")}
                message={t("home.checkConnection")}
                actionLabel={
                    isRefetching
                        ? t("common.refreshing")
                        : t("common.refreshTryAgain")
                }
                onAction={handlePullRefresh}
            />
        );
    }

    return (
        <Screen
            refreshControl={
                <RefreshControl
                    refreshing={isPullRefreshing}
                    onRefresh={handlePullRefresh}
                />
            }
        >
            <BottomSheet
                isPresented={isSignOutSheetVisible}
                onDismiss={closeSignOutSheet}
                shouldDismissOnBackPress={!isSigningOut}
                shouldDismissOnClickOutside={!isSigningOut}
                modifiers={process.env.EXPO_OS === "ios" ? [interactiveDismissDisabled(isSigningOut), presentationCornerRadius(24)] : undefined}
                containerColor={colors.card}
                contentColor={colors.foreground}
                contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
            >
                <Column spacing={20} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity })] : [fillMaxWidth()]}>
                    <Column spacing={8} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity })] : [fillMaxWidth()]}>
                        <Text textStyle={{ ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale, color: colors.danger, fontSize: typography.h3.fontSize * uiFontScale }}>{t("profile.logOutTitle")}</Text>
                        <Text textStyle={{ ...typography.muted, lineHeight: typography.muted.lineHeight * uiFontScale, color: colors.mutedForeground, fontSize: typography.muted.fontSize * uiFontScale }}>{t("profile.logOutMessage")}</Text>
                    </Column>
                    <Column spacing={12} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity })] : [fillMaxWidth()]}>
                        <Button variant="text" disabled={isSigningOut} onPress={() => { void handleSignOut(); }} style={getNativeButtonStyle(colors, "filled", isSigningOut, colors.danger)} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })]}>
                            <Row spacing={8} alignment="center" modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth()]}>
                                <Spacer flexible />
                                {isSigningOut ? <RNHostView matchContents><ActivityIndicator color={colors.primaryForeground} /></RNHostView> : null}
                                <Text textStyle={{ textAlign: "center", ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale, fontWeight: "600", color: colors.primaryForeground, fontSize: typography.label.fontSize * uiFontScale }}>{t("profile.logOutTitle")}</Text>
                                <Spacer flexible />
                            </Row>
                        </Button>
                        <Button variant="text" disabled={isSigningOut} onPress={closeSignOutSheet} style={getNativeButtonStyle(colors, "text", isSigningOut)} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })]}>
                            <Text modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth()]} textStyle={{ ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale, fontWeight: "600", color: colors.foreground, fontSize: typography.label.fontSize * uiFontScale, textAlign: "center" }}>{t("common.cancel")}</Text>
                        </Button>
                    </Column>
                </Column>
            </BottomSheet>
            <View className="flex-col gap-0">
                <ProfileHeader
                    name={member?.name}
                    checkinNumber={member?.checkinNumber}
                    imageUrl={member?.profileImage}
                />
                {update.isOptionalUpdateAvailable && update.state ? (
                    <View
                        className={cn(
                            "rounded-xl border border-border bg-card p-5",
                            "gap-3 border-warning/30 bg-warning/10 p-4",
                        )}
                    >
                        <ListRow
                            accessibilityLabel={t("appUpdate.updateAvailable")}
                            title={t("appUpdate.updateAvailable")}
                            subtitle={t("appUpdate.newVersion", {
                                version: update.state.latestVersion ?? "",
                            })}
                            leading={
                                <View className="h-10 w-10 items-center justify-center rounded-xl bg-warning/20">
                                    <Download
                                        size={20}
                                        color={colors.warning}
                                    />
                                </View>
                            }
                            className="border-0 bg-transparent px-0"
                            onPress={() => {
                                void openStore(update.state!);
                            }}
                        />
                    </View>
                ) : null}
                <AdaptivePanels
                    primary={
                        <View>
                            <View
                                className={cn(
                                    "rounded-xl border border-border bg-card p-5",
                                    "gap-3 rounded-none border-0 bg-transparent p-0 pt-5 pb-3",
                                )}
                            >
                                <SectionTitle
                                    title={t("profile.personalRecord")}
                                />
                                <LinkRow
                                    label={t("navigation.tabs.lessons")}
                                    href="/lessons"
                                />
                                <LinkRow
                                    label={t("profile.lessonLog")}
                                    href="/lesson-log"
                                />
                            </View>
                            <View
                                className={cn(
                                    "rounded-xl border border-border bg-card p-5",
                                    "gap-4 rounded-none border-0 bg-transparent p-0 py-3",
                                )}
                            >
                                <SectionTitle
                                    title={t("profile.generalInfo")}
                                />

                                <View className="flex-col">
                                    <InfoRow
                                        label={t("profile.phone")}
                                        value={member?.phoneNumber}
                                    />
                                    <Divider className="bg-border" />
                                    <InfoRow
                                        label={t("profile.gender")}
                                        value={
                                            member?.gender
                                                ? (genderLabels[
                                                    member.gender
                                                ] ?? "-")
                                                : "-"
                                        }
                                    />
                                </View>
                            </View>
                            {member?.grade ? (
                                <View
                                    className={cn(
                                        "rounded-xl border border-border bg-card p-5",
                                        "gap-4 rounded-none border-0 bg-transparent p-0 py-3",
                                    )}
                                >
                                    <SectionTitle
                                        title={t("profile.schoolInfo")}
                                    />

                                    <View className="flex-col">
                                        <InfoRow
                                            label={t("profile.school")}
                                            value={member.grade.schoolName}
                                        />
                                        <Divider className="bg-border" />
                                        <InfoRow
                                            label={t("profile.schoolCode")}
                                            value={member.grade.schoolCode}
                                        />
                                        <Divider className="bg-border" />
                                        <InfoRow
                                            label={t("profile.grade")}
                                            value={member.grade.name}
                                        />
                                    </View>
                                </View>
                            ) : null}
                            {member?.parents && member.parents.length > 0 ? (
                                <View
                                    className={cn(
                                        "rounded-xl border border-border bg-card p-5",
                                        "gap-4 rounded-none border-0 bg-transparent p-0 py-3",
                                    )}
                                >
                                    <SectionTitle
                                        title={t("profile.parentsGuardians")}
                                    />

                                    <View className="flex-col">
                                        {member.parents.map((parent, index) => (
                                            <View key={parent.id}>
                                                {index > 0 ? (
                                                    <Divider className="bg-border" />
                                                ) : null}
                                                <ParentRow
                                                    name={parent.name}
                                                    role={parent.role}
                                                    phoneNumber={
                                                        parent.phoneNumber
                                                    }
                                                    imageUrl={
                                                        parent.profileImage
                                                    }
                                                />
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ) : null}
                        </View>
                    }
                    secondary={
                        <View>
                            <View
                                className={cn(
                                    "rounded-xl border border-border bg-card p-5",
                                    "gap-4 rounded-none border-0 bg-transparent p-0 py-3",
                                )}
                            >
                                <SectionTitle title={t("profile.settings")} />

                                <View className="flex-col">
                                    <LinkRow
                                        label={t(
                                            "profile.editPersonalInformation",
                                        )}
                                        href="/profile/edit"
                                    />
                                    <Divider className="bg-border" />
                                    <LinkRow
                                        label={t("profile.changePassword")}
                                        href="/profile/change-password"
                                    />
                                    <Divider className="bg-border" />
                                    <LanguagePreferenceRow
                                        currentLanguage={resolveProfileLanguage(
                                            i18n.resolvedLanguage ||
                                            i18n.language,
                                        )}
                                        disabled={isChangingLanguage}
                                        onChange={async (nextLanguage) => {
                                            if (isChangingLanguage) {
                                                return;
                                            }

                                            setIsChangingLanguage(true);

                                            try {
                                                await setAppLanguage(
                                                    nextLanguage,
                                                );
                                            } finally {
                                                setIsChangingLanguage(false);
                                            }
                                        }}
                                    />
                                </View>
                            </View>
                            <View
                                className={cn(
                                    "rounded-xl border border-border bg-card p-5",
                                    "gap-4 rounded-none border-0 bg-transparent p-0 py-3",
                                )}
                            >
                                <SectionTitle title={t("profile.appearance")} />

                                <View className="flex-col">
                                    <PrimaryColorPreferenceRow
                                        preference={primaryColorPreference}
                                        disabled={!isThemeReady}
                                        onChange={setPrimaryColorPreference}
                                    />
                                    <Divider className="bg-border" />
                                    <ThemePreferenceRow
                                        preference={themePreference}
                                        disabled={!isThemeReady}
                                        onChange={setThemePreference}
                                    />
                                </View>
                            </View>
                            <Host
                                matchContents={{ vertical: true }}
                                ignoreSafeArea="all"
                                seedColor={colors.danger}
                                style={{ width: "100%", marginTop: 20 }}
                                accessibilityState={{
                                    disabled: isSigningOut,
                                    busy: isSigningOut,
                                }}
                            >
                                <Button style={{ ...getNativeButtonStyle(colors, "text", isSigningOut), backgroundColor: colors.danger + "1a", borderWidth: 1, borderColor: colors.danger + "33", paddingHorizontal: 16 }}
                                    modifiers={
                                        process.env.EXPO_OS === "ios"
                                            ? [
                                                frame({
                                                    maxWidth: Infinity,
                                                    minHeight: 56,
                                                }),
                                            ]
                                            : [
                                                fillMaxWidth(),
                                                defaultMinSize({
                                                    minHeight: 56,
                                                }),
                                            ]
                                    }
                                    variant="text"
                                    disabled={isSigningOut}
                                    onPress={confirmSignOut}
                                >
                                    <Text
                                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 56, alignment: "leading" })] : [fillMaxWidth()]}
                                        textStyle={{ ...getNativeButtonTextStyle(colors, "outlined", uiFontScale, colors.danger), fontWeight: "500", textAlign: "left" }}
                                    >
                                        {isSigningOut
                                            ? t("profile.loggingOut")
                                            : t("profile.logOut")}
                                    </Text>
                                </Button>
                            </Host>
                            {APP_VERSION ? (
                                <NativeText
                                    variant="caption"
                                    color="mutedForeground"
                                    align="center"
                                    style={{ marginTop: 16, paddingBottom: 16 }}
                                >
                                    {"v " + APP_VERSION}
                                </NativeText>
                            ) : null}
                        </View>
                    }
                />
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
    const { colors: uiColors } = useTheme();
    const { t } = useTranslation();

    return (
        <View className="flex-row items-center gap-5">
            <ProfileAvatar name={name} imageUrl={imageUrl} size="large" />

            <View className="min-w-0 flex-1 flex-col gap-3">
                <View className="flex-col gap-1">
                    <NativeText variant="h2" numberOfLines={2}>
                        {name || "-"}
                    </NativeText>

                    <View className="flex-row items-center gap-1">
                        <NativeText variant="caption" wrap={false} textStyle={{ color: uiColors.foreground + "99" }}>
                            {t("profile.checkInNo") + ":"}
                        </NativeText>
                        <NativeText
                            variant="subtext"
                            wrap={false}
                            numberOfLines={1}
                            textStyle={{ color: uiColors.foreground + "cc" }}
                        >
                            {checkinNumber || "-"}
                        </NativeText>
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
        size === "large" ? "h-24 w-24 bg-primary" : "h-12 w-12 bg-primary";
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
            <NativeText
                variant={textVariant}
                color="primaryForeground"
                wrap={false}
                textStyle={{ fontWeight: "700" as const }}
            >
                {name?.charAt(0).toUpperCase() || "?"}
            </NativeText>
        </View>
    );
}

function SectionTitle({ title }: { title: string }) {

    return (
        <NativeText
            variant="label"
            color="mutedForeground"
            wrap={false}
            textStyle={{ lineHeight: typography.subtext.lineHeight, fontSize: typography.subtext.fontSize, fontWeight: "600" as const, letterSpacing: 0.4 }}
        >
            {title}
        </NativeText>
    );
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    const { colors: uiColors } = useTheme();
    if (!value) {
        return null;
    }

    return (
        <View className="flex-row items-start justify-between gap-4 py-4">
            <NativeText
                variant="meta"
                wrap={false}
                style={{ minWidth: 104 }}
                textStyle={{ color: uiColors.foreground + "bf" }}
            >
                {label}
            </NativeText>

            <NativeText variant="body" align="right" style={{ flex: 1, minWidth: 0 }}>
                {value}
            </NativeText>
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
    const { colors: uiColors } = useTheme();
    return (
        <View className="flex-row items-center gap-4 py-4">
            <ProfileAvatar name={name} imageUrl={imageUrl} />

            <View className="min-w-0 flex-1 flex-col gap-1">
                <View className="flex-row items-center justify-between gap-2">
                    <NativeText variant="body" numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
                        {name}
                    </NativeText>

                    {role ? (
                        <NativeText
                            variant="caption"
                            color="mutedForeground"
                            align="right"
                            wrap={false}
                            numberOfLines={1}
                            style={{ flexShrink: 0 }}
                        >
                            {formatType(role)}
                        </NativeText>
                    ) : null}
                </View>

                {phoneNumber ? (
                    <NativeText variant="subtext" textStyle={{ color: uiColors.foreground + "cc" }}>
                        {phoneNumber}
                    </NativeText>
                ) : null}
            </View>
        </View>
    );
}

function LinkRow({ label, href }: { label: string; href: Href }) {
    return (
        <Link href={href} asChild>
            <ListRow
                title={label}
                className="px-0 py-3 border-0 bg-transparent"
            />
        </Link>
    );
}

function ThemePreferenceRow({ disabled, preference, onChange }: {
    disabled: boolean;
    preference: ThemePreference;
    onChange: (value: ThemePreference) => void;
}) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    return <ProfilePreferenceRow
        title={t("profile.theme")}
        accessibilityLabel={t("profile.chooseAppAppearance")}
        sheetTitle={t("profile.appearance")}
        description={t("profile.appearanceDescription")}
        value={preference}
        disabled={disabled}
        onChange={onChange}
        options={[
            { value: "system", label: t("profile.system"), description: t("profile.followDeviceSetting"), icon: <Smartphone size={22} color={colors.foreground} /> },
            { value: "light", label: t("profile.light"), description: t("profile.useLightAppearance"), icon: <Sun size={22} color={colors.foreground} /> },
            { value: "dark", label: t("profile.dark"), description: t("profile.useDarkAppearance"), icon: <Moon size={22} color={colors.foreground} /> },
        ]}
    />;
}

function PrimaryColorPreferenceRow({ disabled, preference, onChange }: {
    disabled: boolean;
    preference: PrimaryColorPreference;
    onChange: (value: PrimaryColorPreference) => void;
}) {
    const { t } = useTranslation();
    return <ProfilePreferenceRow
        title={t("profile.primaryColorLabel")}
        accessibilityLabel={t("profile.choosePrimaryColorLabel")}
        description={t("profile.primaryColorDescriptionLabel")}
        value={preference}
        disabled={disabled}
        onChange={onChange}
        options={(["blue", "green"] as const).map((value) => {
            const color = getThemeColors("light", value).primary;
            return { value, label: t(value === "blue" ? "profile.bluePrimaryColorLabel" : "profile.greenPrimaryColorLabel"), description: color.toUpperCase(), icon: <View className="h-6 w-6 rounded-full" style={{ backgroundColor: color }} /> };
        })}
    />;
}

function LanguagePreferenceRow({ currentLanguage, disabled, onChange }: {
    currentLanguage: AppLanguage;
    disabled: boolean;
    onChange: (language: AppLanguage) => Promise<void>;
}) {
    const { t } = useTranslation();
    const { fontScale, colors } = useTheme();
    const languages: { value: AppLanguage; label: string; description: string; flag: string }[] = [
        { value: "en", label: "english", description: "useEnglishLanguage", flag: "\u{1F1EC}\u{1F1E7}" },
        { value: "ko", label: "korean", description: "useKoreanLanguage", flag: "\u{1F1F0}\u{1F1F7}" },
        { value: "ja", label: "japanese", description: "useJapaneseLanguage", flag: "\u{1F1EF}\u{1F1F5}" },
        { value: "zh", label: "chinese", description: "useChineseLanguage", flag: "\u{1F1E8}\u{1F1F3}" },
        { value: "km", label: "khmer", description: "useKhmerLanguage", flag: "\u{1F1F0}\u{1F1ED}" },
    ];
    return <ProfilePreferenceRow
        title={t("profile.language")}
        accessibilityLabel={t("profile.chooseAppLanguage")}
        description={t("profile.languageDescription")}
        value={currentLanguage}
        disabled={disabled}
        onChange={onChange}
        options={languages.map((language) => ({
            value: language.value,
            label: t(`profile.${language.label}`),
            description: t(`profile.${language.description}`),
            icon: <Host matchContents ignoreSafeArea="all"><Text textStyle={{ fontSize: typography.h2.fontSize * fontScale, color: colors.foreground }}>{language.flag}</Text></Host>,
        }))}
    />;
}
