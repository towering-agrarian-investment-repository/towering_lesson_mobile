import { FieldValues } from "react-hook-form";
import { FormTextInput } from "./FormTextInput";
import { FormInputBaseProps } from "./types";

type FormNumberInputProps<TFieldValues extends FieldValues> =
    FormInputBaseProps<TFieldValues> & {
        numericMode?: "numeric" | "phone-pad";
    };

export function FormNumberInput<TFieldValues extends FieldValues>({
    numericMode = "numeric",
    ...props
}: FormNumberInputProps<TFieldValues>) {
    return (
        <FormTextInput
            {...props}
            autoCapitalize="none"
            keyboardType={numericMode}
        />
    );
}
