import type { Control, FieldValues, Path, RegisterOptions } from "react-hook-form";
import type {
    KeyboardTypeOptions,
    TextInputProps,
} from "react-native";

export type FormInputBaseProps<TFieldValues extends FieldValues> = {
    control: Control<TFieldValues>;
    name: Path<TFieldValues>;
    label: string;
    placeholder?: string;
    rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
    autoCapitalize?: TextInputProps["autoCapitalize"];
    autoComplete?: TextInputProps["autoComplete"];
    textContentType?: TextInputProps["textContentType"];
    keyboardType?: KeyboardTypeOptions;
    multiline?: boolean;
    numberOfLines?: number;
    editable?: boolean;
};
