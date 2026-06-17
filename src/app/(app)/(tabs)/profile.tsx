import {
    ActionSheet,
    AppText,
    CircleLoader,
    ConfirmSheet,
    ErrorState,
    ListRow,
    Screen,
    type ThemePreference,
    useThemeColors,
    useThemePreference,
} from "@/design-system";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { showAppToast } from "@/lib/toast/toast";
import { signOut } from "@/service/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Href, Link } from "expo-router";
import { Moon, Smartphone, Sun } from "lucide-react-native";
import { useState } from "react";
import { Pressable, RefreshControl, View } from "react-native";

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
    { label: "System", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
];

export default function ProfileScreen() {
    const queryClient = useQueryClient();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isSignOutSheetVisible, setIsSignOutSheetVisible] = useState(false);
    const { isThemeReady, themePreference, setThemePreference } = useThemePreference();

    const {
        data: memberResponse,
        isLoading,
        isError,
        error,
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
                        : "Could not sign out. Please try again.",
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
        return <CircleLoader fullScreen label="Loading your profile..." />;
    }

    if (isError) {
        return (
            <ErrorState
                title="Could not load profile"
                message={error instanceof Error ? error.message : "Please try again."}
                actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
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
                title="Log Out"
                message="Are you sure you want to log out of this account?"
                confirmLabel="Log Out"
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

            <View className="flex-col gap-8">
                <ProfileHeader
                    name={member?.name}
                    username={member?.username}
                    imageUrl={member?.profileImage}
                    isActive={member?.isActive}
                />

                <View className="flex-col gap-2">
                    <SectionTitle title="Personal Record" />
                    <LinkRow label="Lesson Log" href="/lesson-log" />
                </View>

                <View className="flex-col gap-2">
                    <SectionTitle title="General Info" />

                    <View className="flex-col">
                        <InfoRow label="Check-in No." value={member?.checkinNumber} />
                        <InfoRow label="Phone" value={member?.phoneNumber} />
                        <InfoRow label="Gender" value={member?.gender} />
                        <InfoRow label="Date of Birth" value={member?.dateOfBirth} />
                        <InfoRow label="Address" value={member?.address} />
                        {member?.memo ? (
                            <InfoRow label="Memo" value={member.memo} />
                        ) : null}
                    </View>
                </View>

                {member?.grade ? (
                    <View className="flex-col gap-2">
                        <SectionTitle title="School Info" />

                        <View className="flex-col">
                            <InfoRow label="School" value={member.grade.schoolName} />
                            <InfoRow
                                label="School Code"
                                value={member.grade.schoolCode}
                            />
                            <InfoRow label="Grade" value={member.grade.name} />
                        </View>
                    </View>
                ) : null}

                {member?.parents && member.parents.length > 0 ? (
                    <View className="flex-col gap-2">
                        <SectionTitle title="Parents / Guardians" />

                        <View className="flex-col">
                            {member.parents.map((parent, index) => (
                                <ParentRow
                                    key={parent.id}
                                    name={parent.name}
                                    phoneNumber={parent.phoneNumber}
                                    imageUrl={parent.profileImage}
                                    isActive={parent.isActive}
                                    childrenCount={parent.childrenCount}
                                    showDivider={index < member.parents.length - 1}
                                />
                            ))}
                        </View>
                    </View>
                ) : null}


                <View className="flex-col gap-3">
                    <SectionTitle title="Settings" />

                    <LinkRow
                        label="Edit Personal Information"
                        href="/profile/edit"
                    />
                    <LinkRow
                        label="Change Password"
                        href="/profile/change-password"
                    />

                    <SignOutButton
                        isSigningOut={isSigningOut}
                        onPress={confirmSignOut}
                    />
                </View>

                <View className="flex-col gap-3">
                    <SectionTitle title="Appearance" />

                    <ThemePreferenceRow
                        preference={themePreference}
                        disabled={!isThemeReady}
                        onChange={(nextPreference) => {
                            void setThemePreference(nextPreference);
                        }}
                    />
                </View>
            </View>
        </Screen>
    );
}

function ProfileHeader({
    name,
    username,
    imageUrl,
    isActive,
}: {
    name?: string | null;
    username?: string | null;
    imageUrl?: string | null;
    isActive?: boolean;
}) {
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

                    <AppText
                        selectable
                        variant="subtext"
                        className="text-foreground/80"
                        numberOfLines={1}
                    >
                        @{username || "-"}
                    </AppText>
                </View>

                <StatusBadge isActive={isActive} />
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
    const imageSize = size === "large" ? 112 : 48;
    const containerClassName =
        size === "large"
            ? "h-28 w-28 bg-primary"
            : "h-12 w-12 bg-secondary-foreground";
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
            <AppText variant={textVariant} className="text-primary-foreground">
                {name?.charAt(0).toUpperCase() || "?"}
            </AppText>
        </View>
    );
}

function StatusBadge({ isActive }: { isActive?: boolean }) {
    return (
        <View
            className={`self-start rounded-md px-3.5 py-1 ${isActive ? "bg-success/10" : "bg-danger/10"
                }`}
        >
            <AppText
                variant="badge"
                className={isActive ? "text-success" : "text-danger"}
            >
                {isActive ? "Active" : "Inactive"}
            </AppText>
        </View>
    );
}

function SectionTitle({ title }: { title: string }) {
    return (
        <AppText
            variant="label"
            className="text-foreground"
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
        <View className="flex-row items-start justify-between gap-4 border-b border-border py-4">
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
    phoneNumber,
    imageUrl,
    isActive,
    childrenCount,
    showDivider,
}: {
    name: string;
    phoneNumber?: string | null;
    imageUrl?: string | null;
    isActive?: boolean;
    childrenCount: number;
    showDivider: boolean;
}) {
    return (
        <View
            className={`flex-row items-center gap-4 py-4 ${showDivider ? "border-b border-border" : ""
                }`}
        >
            <ProfileAvatar name={name} imageUrl={imageUrl} />

            <View className="min-w-0 flex-1 flex-col gap-1">
                <View className="flex-row items-center gap-2">
                    <AppText
                        selectable
                        variant="body"
                        className="min-w-0 flex-1"
                        numberOfLines={1}
                    >
                        {name}
                    </AppText>

                    <StatusBadge isActive={isActive} />
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

                <AppText
                    selectable
                    variant="count"
                    className="text-foreground/75"
                    style={{ fontVariant: ["tabular-nums"] }}
                >
                    {childrenCount} child{childrenCount !== 1 ? "ren" : ""}
                </AppText>
            </View>
        </View>
    );
}

function LinkRow({ label, href }: { label: string; href: Href }) {
    return (
        <Link href={href} asChild>
            <ListRow title={label} />
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
    const colors = useThemeColors();
    const [isThemeSheetVisible, setIsThemeSheetVisible] = useState(false);
    const selectedLabel =
        THEME_OPTIONS.find((option) => option.value === preference)?.label ?? "System";

    return (
        <>
            <ListRow
                accessibilityRole="button"
                accessibilityLabel="Choose app appearance"
                disabled={disabled}
                onPress={() => {
                    if (!disabled) {
                        setIsThemeSheetVisible(true);
                    }
                }}
                title="Theme"
                meta={selectedLabel}
            />

            <ThemePreferenceSheet
                visible={isThemeSheetVisible}
                preference={preference}
                colors={colors}
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

function ThemePreferenceSheet({
    visible,
    preference,
    colors,
    onClose,
    onSelect,
}: {
    visible: boolean;
    preference: ThemePreference;
    colors: ReturnType<typeof useThemeColors>;
    onClose: () => void;
    onSelect: (preference: ThemePreference) => void;
}) {
    return (
        <ActionSheet
            visible={visible}
            title="Appearance"
            description="Choose how the app should look."
            onClose={onClose}
            options={[
                {
                    key: "system",
                    title: "System",
                    description: "Follow your device setting",
                    icon: <Smartphone size={22} color={colors.foreground} />,
                    selected: preference === "system",
                    onPress: () => {
                        onSelect("system");
                    },
                },
                {
                    key: "light",
                    title: "Light",
                    description: "Use the light appearance",
                    icon: <Sun size={22} color={colors.foreground} />,
                    selected: preference === "light",
                    onPress: () => {
                        onSelect("light");
                    },
                },
                {
                    key: "dark",
                    title: "Dark",
                    description: "Use the dark appearance",
                    icon: <Moon size={22} color={colors.foreground} />,
                    selected: preference === "dark",
                    onPress: () => {
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
    return (
        <Pressable
            onPress={onPress}
            disabled={isSigningOut}
            className={`rounded-xl border border-danger/20 bg-danger/10 px-4 py-4 ${
                isSigningOut ? "" : "active:opacity-80"
            }`}
        >
            <AppText variant="label" className="text-danger">
                {isSigningOut ? "Logging Out..." : "Log Out"}
            </AppText>
        </Pressable>
    );
}
