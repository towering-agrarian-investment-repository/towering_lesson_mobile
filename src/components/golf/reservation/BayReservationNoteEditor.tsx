import { ReservationFieldLabel } from "@/components/golf/reservation/ReservationSections";
import { FormTextInput } from "@/components/ui/form";
import { ActionButton, AnimatedPressable, triggerSuccessHaptic, useThemeColors } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { useMinuteClock } from "@/lib/hook/useMinuteClock";
import { useUpdateMemberBayReservationNotes } from "@/lib/hook/useReservation";
import Pencil from "lucide-react-native/icons/pencil";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";

export const BAY_NOTE_MAX_LENGTH = 2000;

type BayNoteFormValues = {
    memberNotes: string;
};

type EditableBayReservation = {
    id: number;
    reservationStatus?: string | null;
    startTime?: string | null;
    memberNotes?: string | null;
    canEditMemberNotes?: boolean;
};

type UseBayReservationNoteEditorOptions = {
    reservation?: EditableBayReservation | null;
    enabled: boolean;
    isOnline: boolean;
    disabled?: boolean;
    requireCanEditFlag?: boolean;
};

export function useBayReservationNoteEditor({
    reservation,
    enabled,
    isOnline,
    disabled = false,
    requireCanEditFlag = false,
}: UseBayReservationNoteEditorOptions) {
    const [isEditingNote, setIsEditingNote] = useState(false);
    const noteForm = useForm<BayNoteFormValues>({ defaultValues: { memberNotes: "" } });
    const noteSaveLocked = useRef(false);
    const { mutate: updateNotes, isPending: isSavingNote } = useUpdateMemberBayReservationNotes();

    const startTimeMs = reservation?.startTime ? Date.parse(reservation.startTime) : Number.NaN;
    const isPotentiallyEditable = Boolean(
        enabled &&
        reservation &&
        (!requireCanEditFlag || reservation.canEditMemberNotes === true) &&
        reservation.reservationStatus?.toUpperCase() === "RESERVED" &&
        Number.isFinite(startTimeMs),
    );
    const now = useMinuteClock(isPotentiallyEditable);
    const canEditNote = isPotentiallyEditable && startTimeMs > now;
    const isNoteEditorOpen = isEditingNote && canEditNote;
    const isEditTriggerDisabled = !isOnline || disabled || isSavingNote;

    const openNoteEditor = () => {
        if (!canEditNote || isEditTriggerDisabled || !reservation) return;
        noteForm.reset({ memberNotes: reservation.memberNotes ?? "" });
        setIsEditingNote(true);
    };

    const closeNoteEditor = useCallback(() => {
        if (isSavingNote) return;
        Keyboard.dismiss();
        setIsEditingNote(false);
    }, [isSavingNote]);

    const handleSaveNote = ({ memberNotes }: BayNoteFormValues) => {
        if (!(startTimeMs > Date.now())) {
            Keyboard.dismiss();
            setIsEditingNote(false);
            return;
        }
        const trimmed = (memberNotes ?? "").trim();
        const hasNoteChanged = trimmed !== (reservation?.memberNotes ?? "").trim();
        const isNoteTooLong = (memberNotes ?? "").length > BAY_NOTE_MAX_LENGTH;
        if (
            !reservation ||
            !canEditNote ||
            isEditTriggerDisabled ||
            !hasNoteChanged ||
            isNoteTooLong ||
            noteSaveLocked.current
        ) {
            return;
        }
        noteSaveLocked.current = true;
        updateNotes(
            { reservationId: reservation.id, data: { memberNotes: trimmed || null } },
            {
                onSuccess: () => {
                    Keyboard.dismiss();
                    setIsEditingNote(false);
                    triggerSuccessHaptic();
                },
                onSettled: () => {
                    noteSaveLocked.current = false;
                },
            },
        );
    };

    const submitNote = () => {
        void noteForm.handleSubmit(handleSaveNote)();
    };

    return {
        control: noteForm.control,
        initialNote: reservation?.memberNotes ?? "",
        canEditNote,
        isNoteEditorOpen,
        isSavingNote,
        isEditTriggerDisabled,
        openNoteEditor,
        closeNoteEditor,
        submitNote,
    };
}

export function BayReservationNoteRow({
    value,
    disabled,
    onPress,
    leftIcon,
}: {
    value?: string | null;
    disabled: boolean;
    onPress: () => void;
    leftIcon?: ReactNode;
}) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const trimmedValue = value?.trim();

    const body = (
        <View className={leftIcon ? "min-w-0 flex-1 flex-col gap-1" : "flex-col gap-1.5"}>
            <View className="flex-row items-center justify-between gap-2">
                {leftIcon ? (
                    <AppText variant="caption" color="mutedForeground">
                        {t("bookingConfirmation.noteLabel")}
                    </AppText>
                ) : (
                    <ReservationFieldLabel>{t("bookingConfirmation.noteLabel")}</ReservationFieldLabel>
                )}
                <View className="flex-row items-center gap-1">
                    <Pencil size={13} color={colors.primary} strokeWidth={2.25} />
                    <AppText variant="subtext" color="primary" textStyle={{ fontWeight: "600" }}>
                        {t("profile.editAction")}
                    </AppText>
                </View>
            </View>
            <AppText
                variant="body"
                color={trimmedValue ? "foreground" : "mutedForeground"}
                textStyle={trimmedValue ? { fontWeight: "600" } : undefined}
            >
                {trimmedValue || t("bookingConfirmation.notesPlaceholder")}
            </AppText>
        </View>
    );

    return (
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={`${t("bookingConfirmation.noteLabel")}, ${t("profile.editAction")}`}
            disabled={disabled}
            haptic="selection"
            onPress={onPress}
            className="min-h-12 justify-center disabled:opacity-50"
        >
            {leftIcon ? (
                <View className="flex-row items-center gap-4 py-1">
                    <View className="w-6 items-center">{leftIcon}</View>
                    {body}
                </View>
            ) : (
                body
            )}
        </AnimatedPressable>
    );
}

export function BayReservationNoteForm({
    control,
    editable,
    showDisclaimer = false,
}: {
    control: Control<BayNoteFormValues>;
    editable: boolean;
    showDisclaimer?: boolean;
}) {
    const { t } = useTranslation();

    return (
        <View className="gap-2">
            <FormTextInput
                control={control}
                name="memberNotes"
                label={t("bookingConfirmation.noteLabel")}
                labelComponent={ReservationFieldLabel}
                placeholder={t("bookingConfirmation.bayRequestPlaceholder")}
                multiline
                numberOfLines={3}
                multilineMinHeight={72}
                maxLength={BAY_NOTE_MAX_LENGTH}
                showCharacterCount
                autoFocus
                editable={editable}
                rules={{
                    maxLength: {
                        value: BAY_NOTE_MAX_LENGTH,
                        message: t("bookingConfirmation.bayRequestTooLong", {
                            count: BAY_NOTE_MAX_LENGTH,
                        }),
                    },
                }}
            />
            {showDisclaimer ? (
                <AppText variant="caption" color="mutedForeground">
                    {t("bookingConfirmation.bayRequestDisclaimer")}
                </AppText>
            ) : null}
        </View>
    );
}

export function BayReservationNoteFooter({
    control,
    initialNote,
    isSaving,
    isActionDisabled,
    onSave,
    onCancel,
}: {
    control: Control<BayNoteFormValues>;
    initialNote?: string | null;
    isSaving: boolean;
    isActionDisabled: boolean;
    onSave: () => void;
    onCancel: () => void;
}) {
    const { t } = useTranslation();
    const watchedNote = useWatch({ control, name: "memberNotes" });
    const hasNoteChanged = (watchedNote ?? "").trim() !== (initialNote ?? "").trim();
    const isNoteTooLong = (watchedNote ?? "").length > BAY_NOTE_MAX_LENGTH;
    const isSaveDisabled = isActionDisabled || !hasNoteChanged || isNoteTooLong;

    return (
        <View className="gap-2">
            <ActionButton
                label={t("profile.saveChanges")}
                loading={isSaving}
                disabled={isSaveDisabled}
                haptic="selection"
                onPress={onSave}
            />
            <ActionButton label={t("common.cancel")} appearance="text" disabled={isSaving} onPress={onCancel} />
        </View>
    );
}
