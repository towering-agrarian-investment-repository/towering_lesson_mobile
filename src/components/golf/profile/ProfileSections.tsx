import {
    InfoRow,
    LanguagePreferenceRow,
    LinkRow,
    ParentRow,
    PrimaryColorPreferenceRow,
    SectionTitle,
    ThemePreferenceRow,
} from "@/components/golf/profile/ProfileRows";
import { Divider } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import type { AppLanguage } from "@/i18n";
import type { GenderEnum, MemberSelfResponse } from "@/types/member.type";
import BookOpenText from "lucide-react-native/icons/book-open-text";
import Building2 from "lucide-react-native/icons/building-2";
import ChartNoAxesColumn from "lucide-react-native/icons/chart-no-axes-column";
import GraduationCap from "lucide-react-native/icons/graduation-cap";
import LockKeyhole from "lucide-react-native/icons/lock-keyhole";
import Phone from "lucide-react-native/icons/phone";
import Ticket from "lucide-react-native/icons/ticket";
import UserRound from "lucide-react-native/icons/user-round";
import UsersRound from "lucide-react-native/icons/users-round";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const GENDER_LABEL_KEYS: Record<GenderEnum, string> = {
    MALE: "profile.genderMale",
    FEMALE: "profile.genderFemale",
    OTHER: "profile.genderOther",
};

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View className="gap-2">
            <SectionTitle title={title} />
            <View className="overflow-hidden rounded-2xl border border-border bg-card">{children}</View>
        </View>
    );
}

export function ProfilePersonalRecordSection({ lessonLogCount }: { lessonLogCount?: number }) {
    const { t } = useTranslation();

    return (
        <ProfileSection title={t("profile.personalRecord")}>
            <LinkRow label={t("profile.lessonLog")} href="/lesson-log" count={lessonLogCount} icon={BookOpenText} />
            <Divider className="mx-4 w-auto" />
            <LinkRow label={t("navigation.tabs.lessons")} href="/lessons" icon={UsersRound} />
            <Divider className="mx-4 w-auto" />
            <LinkRow label={t("tickets.historyTitle")} href="/ticket-history" icon={Ticket} />
        </ProfileSection>
    );
}

export function ProfileGeneralInfoSection({ member }: { member?: MemberSelfResponse }) {
    const { t } = useTranslation();

    // Rows without a value are dropped up front so dividers never end up orphaned.
    const rows = [
        { label: t("profile.phone"), value: member?.phoneNumber, icon: Phone },
        {
            label: t("profile.gender"),
            value: member?.gender ? t(GENDER_LABEL_KEYS[member.gender]) : "-",
            icon: UserRound,
        },
    ].filter((row) => row.value);

    return (
        <ProfileSection title={t("profile.generalInfo")}>
            {rows.map((row, index) => (
                <View key={row.label}>
                    {index > 0 ? <Divider className="mx-4 w-auto" /> : null}
                    <InfoRow label={row.label} value={row.value} icon={row.icon} />
                </View>
            ))}
        </ProfileSection>
    );
}

export function ProfileSchoolInfoSection({ member }: { member?: MemberSelfResponse }) {
    const { t } = useTranslation();
    const grade = member?.grade;

    const rows = grade
        ? [
              { label: t("profile.school"), value: grade.schoolName, icon: GraduationCap },
              { label: t("profile.schoolCode"), value: grade.schoolCode, icon: Building2 },
              { label: t("profile.grade"), value: grade.name, icon: ChartNoAxesColumn },
          ].filter((row) => row.value)
        : [];

    if (rows.length === 0) {
        return null;
    }

    return (
        <ProfileSection title={t("profile.schoolInfo")}>
            {rows.map((row, index) => (
                <View key={row.label}>
                    {index > 0 ? <Divider className="mx-4 w-auto" /> : null}
                    <InfoRow label={row.label} value={row.value} icon={row.icon} />
                </View>
            ))}
        </ProfileSection>
    );
}

export function ProfileParentsSection({ parents }: { parents?: MemberSelfResponse["parents"] }) {
    const { t } = useTranslation();

    if (!parents || parents.length === 0) {
        return null;
    }

    return (
        <ProfileSection title={t("profile.parentsGuardians")}>
            {parents.map((parent, index) => (
                <View key={parent.id}>
                    {index > 0 ? <Divider className="mx-4 w-auto" /> : null}
                    <ParentRow
                        name={parent.name}
                        role={parent.role}
                        phoneNumber={parent.phoneNumber}
                        imageUrl={parent.profileImage}
                    />
                </View>
            ))}
        </ProfileSection>
    );
}

export function ProfileSettingsSection({
    currentLanguage,
    isChangingLanguage,
    onChangeLanguage,
}: {
    currentLanguage: AppLanguage;
    isChangingLanguage: boolean;
    onChangeLanguage: (language: AppLanguage) => Promise<void>;
}) {
    const { t } = useTranslation();

    return (
        <ProfileSection title={t("profile.settings")}>
            <LinkRow label={t("profile.changePassword")} href="/profile/change-password" icon={LockKeyhole} />
            <Divider className="mx-4 w-auto" />
            <LanguagePreferenceRow
                currentLanguage={currentLanguage}
                disabled={isChangingLanguage}
                onChange={onChangeLanguage}
            />
        </ProfileSection>
    );
}

export function ProfileAppearanceSection() {
    const { t } = useTranslation();
    const { preference, primaryColorPreference, isReady, setPreference, setPrimaryColorPreference } = useTheme();

    return (
        <ProfileSection title={t("profile.appearance")}>
            <PrimaryColorPreferenceRow
                preference={primaryColorPreference}
                disabled={!isReady}
                onChange={setPrimaryColorPreference}
            />
            <Divider className="mx-4 w-auto" />
            <ThemePreferenceRow preference={preference} disabled={!isReady} onChange={setPreference} />
        </ProfileSection>
    );
}
