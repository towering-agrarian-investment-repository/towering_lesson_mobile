import { FormTextInput } from "@/components/ui/form";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { Control } from "react-hook-form";

type HomeworkMemoFormValues = {
    memo: string;
};

export const HomeworkMemoSection = memo(function HomeworkMemoSection({
    control,
    editable,
}: {
    control: Control<HomeworkMemoFormValues>;
    editable: boolean;
}) {
    const { t } = useTranslation();

    return (
        <FormTextInput
            control={control}
            name="memo"
            label={t("homework.memo")}
            placeholder={t("homework.noteForCoach")}
            editable={editable}
            multiline
            numberOfLines={3}
            maxLength={500}
            showCharacterCount
        />
    );
});
