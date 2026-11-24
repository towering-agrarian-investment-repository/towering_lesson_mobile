import {
    InfoRow,
    LanguagePreferenceRow,
    LinkRow,
    ParentRow,
    PrimaryColorPreferenceRow,
    ProfileHeader,
    SectionTitle,
    ThemePreferenceRow,
} from "@/components/golf/profile/ProfileRows";
import { ProfileSignOutSheet } from "@/components/golf/profile/ProfileSignOutSheet";
import { Divider, ErrorState, ImageViewerModal, ListRow, Screen, Skeleton, triggerImpactHaptic } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { getNativeButtonStyle, getNativeButtonTextStyle } from "@/design-system/utils/native-button-styles";
import { useTheme } from "@/design-system/utils/theme";
import { resolveLanguage, setAppLanguage, type AppLanguage } from "@/i18n";
import { useMemberLessonLogCount } from "@/lib/hook/useLessonLog";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { showAppToast } from "@/design-system/components/AppToast";
import { openStore } from "@/lib/update/app-update";
import { useAppUpdateContext } from "@/lib/update/update-context";
import { signOut } from "@/service/auth";
import type { GenderEnum } from "@/types/member.type";
import { formatDateMedium } from "@/utils/time-helper";
import { Button, Host, RNHostView, Row, Spacer, Text } from "@expo/ui";
import { defaultMinSize, fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { contentShape, shapes, frame } from "@expo/ui/swift-ui/modifiers";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useIsFocused, useScrollToTop } from "expo-router";
import * as Updates from "expo-updates";
import {
    BookOpenText,
    Building2,
    ChartNoAxesColumn,
    Download,
    GraduationCap,
    LockKeyhole,
    LogOut,
    Phone,
    Ticket,
    UserRound,
    UsersRound,
} from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, RefreshControl, View, type ScrollViewInstance } from "react-native";

const APP_VERSION = Constants.expoConfig?.version;
const APP_CONTENT_DATE = Updates.createdAt;

const isIOS = process.env.EXPO_OS === "ios";
const signOutButtonSize = isIOS
    ? [frame({ maxWidth: Infinity, minHeight: 56 })]
    : [fillMaxWidth(), defaultMinSize({ minHeight: 56 })];
const signOutTextSize = isIOS
    ? [frame({ maxWidth: Infinity, minHeight: 56, alignment: "center" }), contentShape(shapes.rectangle())]
    : [fillMaxWidth()];

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
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isSignOutSheetVisible, setIsSignOutSheetVisible] = useState(false);
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const signOutLocked = useRef(false);
    const openingStore = useRef(false);
    const scrollRef = useRef<ScrollViewInstance>(null);
    useScrollToTop(scrollRef);
    const [isOpeningStore, setIsOpeningStore] = useState(false);
    const [isChangingLanguage, setIsChangingLanguage] = useState(false);

    const isFocused = useIsFocused();
    const [hasVisited, setHasVisited] = useState(false);
    useFocusEffect(
        useCallback(() => {
            setHasVisited(true);
        }, []),
    );

    const { data: memberResponse, isLoading, isError, refetch, isRefetching } = useGetMemberProfile();
    const { data: lessonLogCountResponse, refetch: refetchLessonLogCount } = useMemberLessonLogCount(
        isFocused || hasVisited,
    );
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        Promise.all([refetch({ cancelRefetch: false }), refetchLessonLogCount({ cancelRefetch: false })]),
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

    const handleSignOut = async () => {
        if (signOutLocked.current) return;
        triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
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
        } catch {
            showAppToast({
                message: t("common.requestError"),
                type: "error",
            });
        } finally {
            setIsChangingLanguage(false);
        }
    };

    if (isLoading) {
        return (
            <Screen scrollRef={scrollRef} bottomSafeArea={process.env.EXPO_OS === "ios"} contentClassName="gap-6">
                <View className="flex-row items-center gap-5">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <View className="min-w-0 flex-1 gap-2.5">
                        <Skeleton className="h-6 w-40 rounded-md" />
                        <Skeleton className="h-4 w-28 rounded-md" />
                    </View>
                </View>
                <View className="gap-3">
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                    ))}
                </View>
            </Screen>
        );
    }

    if (isError && !memberResponse) {
        return (
            <Screen
                scrollRef={scrollRef}
                contentClassName="grow"
                bottomPadding={16}
                bottomSafeArea={process.env.EXPO_OS === "ios"}
                refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
            >
                <ErrorState
                    title={t("home.couldNotLoadProfile")}
                    message={t("home.checkConnection")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </Screen>
        );
    }

    return (
        <>
            <Screen
                scrollRef={scrollRef}
                bottomSafeArea={process.env.EXPO_OS === "ios"}
                refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
            >
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
                    ) : null}
                    <View className="gap-6 pt-6">
                        <View className="gap-6">
                            <View className="gap-2">
                                <SectionTitle title={t("profile.personalRecord")} />

                                <View className="overflow-hidden rounded-2xl border border-border bg-card px-4">
                                    <LinkRow
                                        label={t("profile.lessonLog")}
                                        href="/lesson-log"
                                        count={lessonLogCountResponse?.data}
                                        icon={BookOpenText}
                                    />
                                    <Divider className="bg-border" />
                                    <LinkRow label={t("navigation.tabs.lessons")} href="/lessons" icon={UsersRound} />
                                    <Divider className="bg-border" />
                                    <LinkRow label={t("tickets.historyTitle")} href="/ticket-history" icon={Ticket} />
                                </View>
                            </View>

                            <View className="gap-2">
                                <SectionTitle title={t("profile.generalInfo")} />

                                <View className="overflow-hidden rounded-2xl border border-border bg-card px-4">
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

                                    <View className="overflow-hidden rounded-2xl border border-border bg-card px-4">
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

                                    <View className="overflow-hidden rounded-2xl border border-border bg-card px-4">
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
                        <View>
                            <View className="gap-6">
                                <View className="gap-2">
                                    <SectionTitle title={t("profile.settings")} />

                                    <View className="overflow-hidden rounded-2xl border border-border bg-card px-4">
                                        <LinkRow
                                            label={t("profile.changePassword")}
                                            href="/profile/change-password"
                                            icon={LockKeyhole}
                                        />
                                        <Divider className="bg-border" />
                                        <LanguagePreferenceRow
                                            currentLanguage={resolveLanguage(i18n.resolvedLanguage || i18n.language)}
                                            disabled={isChangingLanguage}
                                            onChange={handleLanguageChange}
                                        />
                                    </View>
                                </View>

                                <View className="gap-2">
                                    <SectionTitle title={t("profile.appearance")} />

                                    <View className="overflow-hidden rounded-2xl border border-border bg-card px-4">
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
                                        }}
                                        modifiers={signOutButtonSize}
                                        variant="text"
                                        disabled={isSigningOut}
                                        onPress={confirmSignOut}
                                    >
                                        <Row
                                            spacing={8}
                                            alignment="center"
                                            style={{ paddingHorizontal: 16 }}
                                            modifiers={signOutTextSize}
                                        >
                                            <Spacer flexible />
                                            <RNHostView matchContents>
                                                <LogOut size={18} color={colors.primaryForeground} />
                                            </RNHostView>
                                            <Text
                                                textStyle={{
                                                    ...getNativeButtonTextStyle(
                                                        colors,
                                                        "filled",
                                                        uiFontScale,
                                                        colors.danger,
                                                    ),
                                                    color: colors.primaryForeground,
                                                }}
                                            >
                                                {isSigningOut ? t("profile.loggingOut") : t("profile.logOut")}
                                            </Text>
                                            <Spacer flexible />
                                        </Row>
                                    </Button>
                                </Host>
                            </View>

                            {APP_VERSION ? (
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
                            ) : null}
                        </View>
                    </View>
                </View>
            </Screen>

            <ImageViewerModal
                visible={isImageViewerVisible}
                imageUri={member?.profileImage ?? null}
                accessibilityLabel={t("profile.viewProfilePhoto")}
                onClose={() => setIsImageViewerVisible(false)}
            />

            <ProfileSignOutSheet
                isPresented={isSignOutSheetVisible}
                isSigningOut={isSigningOut}
                onDismiss={closeSignOutSheet}
                onConfirm={handleSignOut}
            />
        </>
    );
}
