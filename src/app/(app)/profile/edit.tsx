import { CircleLoader } from "@/components/ui/CircleLoader";
import { Screen } from "@/components/ui/Screen";
import { AppText as Text, Button } from "@/design-system";
import {
    FormDateInput,
    FormNumberInput,
    FormTextInput,
} from "@/components/ui/form";
import { FormFieldShell } from "@/components/ui/form/FormFieldShell";
import { ErrorState } from "@/components/ui/StateCard";
import {
    useGetMemberProfile,
    useUpdateMemberProfile,
} from "@/lib/hook/useUser";
import { GenderEnum } from "@/types/member.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    Pressable,
    View,
} from "react-native";
import { z } from "zod";

const editProfileSchema = z.object({
    name: z.string().trim().min(1, "Name is required."),
    phoneNumber: z.string().trim().min(4, "Phone number is required."),
    username: z.string().trim().min(1, "Username is required."),
    gender: z.enum(["", "MALE", "FEMALE", "OTHER"]),
    dateOfBirth: z
        .string()
        .trim()
        .refine(
            (value) => value.length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(value),
            "Date of birth must be in YYYY-MM-DD format.",
        ),
    address: z.string().trim(),
    memo: z.string().trim(),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

type EditProfileParams = {
    selectedGender?: GenderEnum | "";
};

const GENDER_OPTIONS: {
    label: string;
    value: GenderEnum;
}[] = [
        { label: "Male", value: "MALE" },
        { label: "Female", value: "FEMALE" },
        { label: "Other", value: "OTHER" },
    ];

function normalizeOptionalText(value: string) {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

export default function EditProfileScreen() {
    const router = useRouter();
    const { selectedGender } = useLocalSearchParams<EditProfileParams>();
    const {
        data: memberResponse,
        isLoading,
        isError,
        error,
    } = useGetMemberProfile();
    const {
        mutateAsync: updateProfile,
        isPending: isSubmitting,
    } = useUpdateMemberProfile();

    const member = memberResponse?.data;

    const form = useForm<EditProfileFormValues>({
        defaultValues: {
            name: "",
            phoneNumber: "",
            username: "",
            gender: "",
            dateOfBirth: "",
            address: "",
            memo: "",
        },
        resolver: zodResolver(editProfileSchema),
        mode: "onSubmit",
    });

    useEffect(() => {
        if (!member) {
            return;
        }

        form.reset({
            name: member.name ?? "",
            phoneNumber: member.phoneNumber ?? "",
            username: member.username ?? "",
            gender: member.gender ?? "",
            dateOfBirth: member.dateOfBirth ?? "",
            address: member.address ?? "",
            memo: member.memo ?? "",
        });
    }, [form, member]);

    useEffect(() => {
        if (
            selectedGender === "" ||
            selectedGender === "MALE" ||
            selectedGender === "FEMALE" ||
            selectedGender === "OTHER"
        ) {
            form.setValue("gender", selectedGender, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
            router.setParams({ selectedGender: undefined });
        }
    }, [form, router, selectedGender]);

    const onSubmit = async (values: EditProfileFormValues) => {
        await updateProfile({
            name: values.name.trim(),
            phoneNumber: normalizeOptionalText(values.phoneNumber),
            username: values.username.trim(),
            gender: values.gender || null,
            dateOfBirth: normalizeOptionalText(values.dateOfBirth),
            address: normalizeOptionalText(values.address),
            memo: normalizeOptionalText(values.memo),
        });

        router.back();
    };

    if (isLoading) {
        return <CircleLoader fullScreen label="Loading your profile..." />;
    }

    if (isError || !member) {
        return (
            <ErrorState
                title="Could not load profile"
                message={
                    error instanceof Error
                        ? error.message
                        : "Please try again."
                }
            />
        );
    }

    return (
        <Screen
            keyboardAware
            footer={
                <View className="border-t border-border bg-background px-6 pb-8 pt-4">
                    <Button
                        title={isSubmitting ? "Saving..." : "Save Changes"}
                        loading={isSubmitting}
                        className="rounded-2xl"
                        onPress={form.handleSubmit(onSubmit)}
                    />
                </View>
            }
        >
            <View className="gap-8">
                <View className="gap-6">
                    <Text className="text-lg font-semibold text-foreground">
                        Basic Information
                    </Text>

                    <FormTextInput
                        control={form.control}
                        name="name"
                        label="Full Name"
                        placeholder="Jane Member"
                    />

                    <FormTextInput
                        control={form.control}
                        name="username"
                        label="Username"
                        placeholder="jane.member"
                        autoCapitalize="none"
                    />

                    <FormNumberInput
                        control={form.control}
                        name="phoneNumber"
                        label="Phone Number"
                        placeholder="+66812345678"
                        numericMode="phone-pad"
                    />
                </View>

                <View className="gap-6">
                    <Text className="text-lg font-semibold text-foreground">
                        Personal Details
                    </Text>

                    <Controller
                        control={form.control}
                        name="gender"
                        render={({ field: { value }, fieldState }) => {
                            const selectedValue =
                                typeof value === "string" && value.length > 0 ? value : "";
                            const selectedLabel =
                                GENDER_OPTIONS.find((option) => option.value === selectedValue)
                                    ?.label ?? "Select an option";

                            return (
                                <FormFieldShell
                                    label="Gender"
                                    errorMessage={fieldState.error?.message}
                                >
                                    <View className="mt-2">
                                        <Link
                                            href={{
                                                pathname: "/profile/gender-modal",
                                                params: { currentGender: selectedValue },
                                            }}
                                            asChild
                                        >
                                            <Pressable
                                                className={`flex-row items-center border-b px-0 pb-3 pt-2 ${
                                                    fieldState.error
                                                        ? "border-danger"
                                                        : "border-border"
                                                }`}
                                                accessibilityRole="button"
                                                accessibilityLabel="Select gender"
                                            >
                                                <Text
                                                    className={`flex-1 text-base ${
                                                        selectedValue
                                                            ? "text-foreground"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {selectedLabel}
                                                </Text>

                                                <Text className="text-2xl leading-5 text-muted-foreground">
                                                    ›
                                                </Text>
                                            </Pressable>
                                        </Link>
                                    </View>
                                </FormFieldShell>
                            );
                        }}
                    />

                    <FormDateInput
                        control={form.control}
                        name="dateOfBirth"
                        label="Date of Birth"
                        placeholder="Select date of birth"
                    />

                    <FormTextInput
                        control={form.control}
                        name="address"
                        label="Address"
                        placeholder="Bangkok"
                    />

                    <FormTextInput
                        control={form.control}
                        name="memo"
                        label="Memo"
                        placeholder="Prefers evening lessons"
                        multiline
                        numberOfLines={4}
                    />
                </View>
            </View>
        </Screen>
    );
}
