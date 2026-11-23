import type {
    Control,
    FieldValues,
    Path,
    RegisterOptions,
} from "react-hook-form";
import type { TextInputProps } from "react-native";

export type FormInputBaseProps<TFieldValues extends FieldValues> = {
    control: Control<TFieldValues>;
    name: Path<TFieldValues>;
    label: string;
    placeholder?: string;
    rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
    autoCapitalize?: TextInputProps["autoCapitalize"];
    autoComplete?: TextInputProps["autoComplete"];
    textContentType?: TextInputProps["textContentType"];
    keyboardType?: TextInputProps["keyboardType"];
    returnKeyType?: TextInputProps["returnKeyType"];
    onSubmitEditing?: TextInputProps["onSubmitEditing"];
    multiline?: boolean;
    numberOfLines?: number;
    maxLength?: TextInputProps["maxLength"];
    editable?: boolean;
    autoFocus?: boolean;
};

export function resolveTextContentType(
    autoComplete?: TextInputProps["autoComplete"],
    textContentType?: TextInputProps["textContentType"],
): TextInputProps["textContentType"] {
    if (textContentType) return textContentType;
    switch (autoComplete) {
        case "tel":
            return "telephoneNumber";
        case "current-password":
        case "password":
            return "password";
        case "new-password":
            return "newPassword";
        case "name":
            return "name";
        case "nickname":
            return "nickname";
        case "email":
            return "emailAddress";
        case "username":
            return "username";
        default:
            return undefined;
    }
}
