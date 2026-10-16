import type { TextInputProps } from "@expo/ui";
import type {
    Control,
    FieldValues,
    Path,
    RegisterOptions,
} from "react-hook-form";

export type FormInputBaseProps<TFieldValues extends FieldValues> = {
    control: Control<TFieldValues>;
    name: Path<TFieldValues>;
    label: string;
    placeholder?: string;
    rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
    autoCapitalize?: TextInputProps["autoCapitalize"];
    autoComplete?: TextInputProps["autoComplete"];
    keyboardType?: TextInputProps["keyboardType"];
    multiline?: boolean;
    numberOfLines?: number;
    editable?: boolean;
};
