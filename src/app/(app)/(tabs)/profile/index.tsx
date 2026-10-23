import { PendingBottomSheet } from "@/design-system/components/PendingBottomSheet";
import { ProfilePreferenceRow } from "@/components/golf/profile/ProfilePreferenceRow";
import {
  CircleLoader,
  Divider,
  ErrorState,
  ListRow,
  Screen,
  type PrimaryColorPreference,
  type ThemePreference,
} from "@/design-system";
import { NativeText } from "@/design-system/components/NativeText";
import { AdaptivePanels } from "@/design-system/layout/AdaptivePanels";
import {
  getNativeButtonStyle,
  getNativeButtonTextStyle,
} from "@/design-system/utils/native-button-styles";
import { getThemeColors, useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { setAppLanguage, type AppLanguage } from "@/i18n";
import { useMemberLessonLogCount } from "@/lib/hook/useLessonLog";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { showAppToast } from "@/lib/toast/toast";
import { openStore } from "@/lib/update/app-update";
import { useAppUpdateContext } from "@/lib/update/update-context";
import { signOut } from "@/service/auth";
import type { GenderEnum } from "@/types/member.type";
import { formatType } from "@/utils/format-enum";
import {
  Button,
  Column,
  Host,
  RNHostView,
  Row,
  Spacer,
  Text,
} from "@expo/ui";
import {
  defaultMinSize,
  fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import {
  frame,
  presentationCornerRadius,
} from "@expo/ui/swift-ui/modifiers";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { Href, Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BookOpenText, Building2, ChartNoAxesColumn, ChevronRight, Download, Globe2, GraduationCap, LockKeyhole, LogOut, Moon, Palette, Phone, Smartphone, Sun, UserRound, UsersRound, X, type LucideIcon } from "lucide-react-native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const APP_VERSION = Constants.expoConfig?.version;

const isIOS = process.env.EXPO_OS === "ios";
const fullWidth = isIOS ? [frame({ maxWidth: Infinity })] : [fillMaxWidth()];
const buttonSize = isIOS
  ? [frame({ maxWidth: Infinity, minHeight: 48 })]
  : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })];
const buttonInnerSize = isIOS
  ? [frame({ maxWidth: Infinity, minHeight: 48 })]
  : [fillMaxWidth()];
const signOutButtonSize = isIOS
  ? [frame({ maxWidth: Infinity, minHeight: 56 })]
  : [fillMaxWidth(), defaultMinSize({ minHeight: 56 })];
const signOutTextSize = isIOS
  ? [frame({ maxWidth: Infinity, minHeight: 56, alignment: "center" })]
  : [fillMaxWidth()];

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

export default function ProfileScreen() {
  const {
    colors,
    fontScale: uiFontScale,
    isReady: isThemeReady,
    preference: themePreference,
    primaryColorPreference,
    setPreference: setThemePreference,
    setPrimaryColorPreference,
  } = useTheme();
  const { i18n, t } = useTranslation();
  const update = useAppUpdateContext();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSignOutSheetVisible, setIsSignOutSheetVisible] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const signOutLocked = useRef(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const {
    data: memberResponse,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useGetMemberProfile();
  const { data: lessonLogCountResponse, refetch: refetchLessonLogCount } =
    useMemberLessonLogCount();
  const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
    usePullToRefresh(() =>
      Promise.all([
        refetch({ cancelRefetch: false }),
        refetchLessonLogCount({ cancelRefetch: false }),
      ]),
    );

  const member = memberResponse?.data;
  const genderLabels: Record<GenderEnum, string> = {
    MALE: t("profile.genderMale"),
    FEMALE: t("profile.genderFemale"),
    OTHER: t("profile.genderOther"),
  };

  // Rows without a value are dropped up front so dividers never end up orphaned.
  const generalInfoRows = [
    { label: t("profile.phone"), value: member?.phoneNumber, icon: Phone },
    {
      label: t("profile.gender"),
      value: member?.gender ? (genderLabels[member.gender] ?? "-") : "-",
      icon: UserRound,
    },
  ].filter((row) => row.value);
  const schoolInfoRows = member?.grade
    ? [
        { label: t("profile.school"), value: member.grade.schoolName, icon: GraduationCap },
        { label: t("profile.schoolCode"), value: member.grade.schoolCode, icon: Building2 },
        { label: t("profile.grade"), value: member.grade.name, icon: ChartNoAxesColumn },
      ].filter((row) => row.value)
    : [];

  const handleSignOut = async () => {
    if (signOutLocked.current) return;
    signOutLocked.current = true;
    setIsSigningOut(true);

    try {
      await signOut();
      queryClient.clear();
      setIsSignOutSheetVisible(false);
    } catch {
      showAppToast({
        message: t("profile.signOutError"),
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

  const closeSignOutSheet = () => {
    if (!signOutLocked.current) setIsSignOutSheetVisible(false);
  };

  const handleLanguageChange = async (nextLanguage: AppLanguage) => {
    if (isChangingLanguage) {
      return;
    }

    setIsChangingLanguage(true);

    try {
      await setAppLanguage(nextLanguage);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  if (isLoading) {
    return <CircleLoader fullScreen />;
  }

  if (isError && !memberResponse) {
    return (
      <ErrorState
        title={t("home.couldNotLoadProfile")}
        message={t("home.checkConnection")}
        actionLabel={
          isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")
        }
        actionPending={isRefetching || isPullRefreshing}
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
      <Modal
        visible={isImageViewerVisible && Boolean(member?.profileImage)}
        presentationStyle="fullScreen"
        animationType="fade"
        onRequestClose={() => setIsImageViewerVisible(false)}
      >
        <View
          className="flex-1 gap-4 bg-black px-4"
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 8,
          }}
        >
          <StatusBar style="light" />
          <View className="items-end">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.closeTitle", {
                title: t("profile.viewProfilePhoto"),
              })}
              className="h-12 w-12 items-center justify-center rounded-full bg-white/20 active:opacity-70"
              onPress={() => setIsImageViewerVisible(false)}
            >
              <X size={24} color={colors.primaryForeground} />
            </Pressable>
          </View>
          {member?.profileImage ? (
            <Image
              source={{ uri: member.profileImage }}
              contentFit="contain"
              style={{ width: "100%", flex: 1 }}
              accessibilityLabel={t("profile.viewProfilePhoto")}
            />
          ) : null}
        </View>
      </Modal>

      <PendingBottomSheet
        isPresented={isSignOutSheetVisible}
        onDismiss={closeSignOutSheet}
        dismissDisabled={isSigningOut}
        modifiers={
          isIOS
            ? [
                presentationCornerRadius(24),
              ]
            : undefined
        }
        containerColor={colors.card}
        contentColor={colors.foreground}
        contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
      >
        <Column spacing={20} modifiers={fullWidth}>
          <Column spacing={8} modifiers={fullWidth}>
            <Text
              textStyle={{
                ...typography.h3,
                lineHeight: typography.h3.lineHeight * uiFontScale,
                color: colors.danger,
                fontSize: typography.h3.fontSize * uiFontScale,
              }}
            >
              {t("profile.logOutTitle")}
            </Text>
            <Text
              textStyle={{
                ...typography.muted,
                lineHeight: typography.muted.lineHeight * uiFontScale,
                color: colors.mutedForeground,
                fontSize: typography.muted.fontSize * uiFontScale,
              }}
            >
              {t("profile.logOutMessage")}
            </Text>
          </Column>

          <Column spacing={12} modifiers={fullWidth}>
            <Button
              variant="text"
              disabled={isSigningOut}
              onPress={() => {
                void handleSignOut();
              }}
              style={getNativeButtonStyle(
                colors,
                "filled",
                isSigningOut,
                colors.danger,
              )}
              modifiers={buttonSize}
            >
              <Row spacing={8} alignment="center" modifiers={buttonInnerSize}>
                <Spacer flexible />
                {isSigningOut ? (
                  <RNHostView matchContents>
                    <ActivityIndicator color={colors.primaryForeground} />
                  </RNHostView>
                ) : null}
                <Text
                  textStyle={{
                    textAlign: "center",
                    ...typography.label,
                    lineHeight: typography.label.lineHeight * uiFontScale,
                    fontWeight: "600",
                    color: colors.primaryForeground,
                    fontSize: typography.label.fontSize * uiFontScale,
                  }}
                >
                  {t("profile.logOutTitle")}
                </Text>
                <Spacer flexible />
              </Row>
            </Button>

            <Button
              variant="text"
              disabled={isSigningOut}
              onPress={closeSignOutSheet}
              style={getNativeButtonStyle(colors, "text", isSigningOut)}
              modifiers={buttonSize}
            >
              <Text
                modifiers={buttonInnerSize}
                textStyle={{
                  ...typography.label,
                  lineHeight: typography.label.lineHeight * uiFontScale,
                  fontWeight: "600",
                  color: colors.foreground,
                  fontSize: typography.label.fontSize * uiFontScale,
                  textAlign: "center",
                }}
              >
                {t("common.cancel")}
              </Text>
            </Button>
          </Column>
        </Column>
      </PendingBottomSheet>

      <View className="flex-col">
        <ProfileHeader
          name={member?.name}
          checkinNumber={member?.checkinNumber}
          imageUrl={member?.profileImage}
          onImagePress={() => setIsImageViewerVisible(true)}
        />
        {update.isOptionalUpdateAvailable && update.state ? (
          <View className="mt-5 gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
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
          </View>
        ) : null}
        <AdaptivePanels
          primary={
            <View className="gap-6 pt-6">
              <View className="gap-2">
                <SectionTitle title={t("profile.personalRecord")} />

                <View className="overflow-hidden rounded-xl border border-border bg-card px-3">
                  <LinkRow
                    label={t("profile.lessonLog")}
                    href="/lesson-log"
                    count={lessonLogCountResponse?.data}
                    icon={BookOpenText}
                  />
                  <Divider className="bg-border" />
                  <LinkRow
                    label={t("navigation.tabs.lessons")}
                    href="/lessons"
                    icon={UsersRound}
                  />
                </View>
              </View>

              <View className="gap-2">
                <SectionTitle title={t("profile.generalInfo")} />

                <View className="overflow-hidden rounded-xl border border-border bg-card px-3">
                  {generalInfoRows.map((row, index) => (
                    <View key={row.label}>
                      {index > 0 ? <Divider className="bg-border" /> : null}
                      <InfoRow label={row.label} value={row.value} icon={row.icon} />
                    </View>
                  ))}
                </View>
              </View>

              {schoolInfoRows.length > 0 ? (
                <View className="gap-2">
                  <SectionTitle title={t("profile.schoolInfo")} />

                  <View className="overflow-hidden rounded-xl border border-border bg-card px-3">
                    {schoolInfoRows.map((row, index) => (
                      <View key={row.label}>
                        {index > 0 ? <Divider className="bg-border" /> : null}
                        <InfoRow label={row.label} value={row.value} icon={row.icon} />
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {member?.parents && member.parents.length > 0 ? (
                <View className="gap-2">
                  <SectionTitle title={t("profile.parentsGuardians")} />

                  <View className="overflow-hidden rounded-xl border border-border bg-card px-3">
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
                </View>
              ) : null}
            </View>
          }
          secondary={
            <View className="pt-6">
              <View className="gap-6">
                <View className="gap-2">
                  <SectionTitle title={t("profile.settings")} />

                  <View className="overflow-hidden rounded-xl border border-border bg-card px-3">
                    <LinkRow
                      label={t("profile.changePassword")}
                      href="/profile/change-password"
                      icon={LockKeyhole}
                    />
                    <Divider className="bg-border" />
                    <LanguagePreferenceRow
                      currentLanguage={resolveProfileLanguage(
                        i18n.resolvedLanguage || i18n.language,
                      )}
                      disabled={isChangingLanguage}
                      onChange={handleLanguageChange}
                    />
                  </View>
                </View>

                <View className="gap-2">
                  <SectionTitle title={t("profile.appearance")} />

                  <View className="overflow-hidden rounded-xl border border-border bg-card px-3">
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
                  style={{ width: "100%" }}
                  accessibilityState={{
                    disabled: isSigningOut,
                    busy: isSigningOut,
                  }}
                >
                  <Button
                    style={{
                      ...getNativeButtonStyle(colors, "text", isSigningOut),
                      backgroundColor: colors.danger,
                      paddingHorizontal: 16,
                    }}
                    modifiers={signOutButtonSize}
                    variant="text"
                    disabled={isSigningOut}
                    onPress={confirmSignOut}
                  >
                    <Row spacing={8} alignment="center" modifiers={signOutTextSize}>
                      <Spacer flexible />
                      <RNHostView matchContents>
                        <LogOut size={18} color={colors.primaryForeground} />
                      </RNHostView>
                      <Text
                        textStyle={{
                          ...getNativeButtonTextStyle(colors, "filled", uiFontScale, colors.danger),
                          color: colors.primaryForeground,
                        }}
                      >
                        {isSigningOut
                          ? t("profile.loggingOut")
                          : t("profile.logOut")}
                      </Text>
                      <Spacer flexible />
                    </Row>
                  </Button>
                </Host>
              </View>

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("profile.viewProfilePhoto")}
          onPress={onImagePress}
        >
          <ProfileAvatar name={name} imageUrl={imageUrl} size="large" />
        </Pressable>
      ) : (
        <ProfileAvatar name={name} size="large" />
      )}

      <View className="min-w-0 flex-1 flex-col gap-3">
        <View className="flex-col gap-1">
          <NativeText variant="h2" numberOfLines={2}>
            {name || "-"}
          </NativeText>

          <NativeText variant="subtext" numberOfLines={2} textStyle={{ fontWeight: "500" }}>
            {`${t("profile.checkInNo")}: ${checkinNumber || "-"}`}
          </NativeText>
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
  const dimensionClassName = size === "large" ? "h-24 w-24" : "h-12 w-12";
  const textVariant = size === "large" ? "h1" : "h3";

  if (imageUrl) {
    return (
      <View
        className={`${dimensionClassName} shrink-0 overflow-hidden rounded-full bg-muted`}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      </View>
    );
  }

  return (
    <View
      className={`${dimensionClassName} shrink-0 items-center justify-center rounded-full bg-primary`}
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
      textStyle={{
        lineHeight: typography.subtext.lineHeight,
        fontSize: typography.subtext.fontSize,
        fontWeight: "600" as const,
        letterSpacing: 0.4,
      }}
    >
      {title}
    </NativeText>
  );
}

function InfoRow({
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
    <View className="min-h-14 flex-row items-center gap-3 py-3">
      <Icon size={20} color={colors.foreground} />
      <NativeText
        variant="body"
        style={{ flex: 1, minWidth: 0 }}
      >
        {label}
      </NativeText>

      <NativeText
        variant="body"
        align="right"
        style={{ flexShrink: 1, maxWidth: "55%" }}
        textStyle={{ fontWeight: "600" }}
      >
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
  return (
    <View className="min-h-16 flex-row items-center gap-3 py-2">
      <ProfileAvatar name={name} imageUrl={imageUrl} />

      <View className="min-w-0 flex-1 flex-col gap-1">
        <NativeText variant="body" numberOfLines={1}>
          {name}
        </NativeText>

        {phoneNumber ? (
          <NativeText
            variant="subtext"
            textStyle={{ fontWeight: "500" }}
          >
            {phoneNumber}
          </NativeText>
        ) : null}
      </View>
      {role ? (
        <View className="max-w-[38%] rounded-full bg-muted px-2.5 py-1">
          <NativeText variant="caption" align="center" wrap={false} numberOfLines={1} textStyle={{ fontWeight: "600" }}>
            {formatType(role)}
          </NativeText>
        </View>
      ) : null}
    </View>
  );
}

function LinkRow({
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
              <View className="h-6 min-w-6 items-center justify-center rounded-full bg-danger px-1.5">
                <NativeText variant="badge" color="primaryForeground" align="center" wrap={false}>
                  {String(count)}
                </NativeText>
              </View>
            ) : null}
            <ChevronRight size={18} color={colors.mutedForeground} />
          </View>
        }
        className="min-h-14 rounded-none border-0 bg-transparent px-0 py-3"
      />
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
  onChange: (value: ThemePreference) => Promise<void>;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <ProfilePreferenceRow
      title={t("profile.theme")}
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

function PrimaryColorPreferenceRow({
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
          label: t(
            value === "blue"
              ? "profile.bluePrimaryColorLabel"
              : "profile.greenPrimaryColorLabel",
          ),
          description: color.toUpperCase(),
          icon: (
            <View
              className="h-6 w-6 rounded-full"
              style={{ backgroundColor: color }}
            />
          ),
        };
      })}
    />
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
          <NativeText variant="h2" wrap={false}>
            {language.flag}
          </NativeText>
        ),
      }))}
    />
  );
}
