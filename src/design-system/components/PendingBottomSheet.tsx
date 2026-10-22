import { BottomSheet, type BottomSheetProps } from "@expo/ui";
import { interactiveDismissDisabled } from "@expo/ui/swift-ui/modifiers";

export type PendingBottomSheetProps = Pick<BottomSheetProps,
    "children" | "isPresented" | "onDismiss" | "modifiers" |
    "containerColor" | "contentColor" | "contentPadding"
> & { dismissDisabled: boolean };

/** Keeps pending actions visible; Android uses the native gesture lock. */
export function PendingBottomSheet({ dismissDisabled, modifiers, ...props }: PendingBottomSheetProps) {
    return (
        <BottomSheet
            {...props}
            onDismiss={() => { if (!dismissDisabled) props.onDismiss(); }}
            shouldDismissOnBackPress={!dismissDisabled}
            shouldDismissOnClickOutside={!dismissDisabled}
            modifiers={process.env.EXPO_OS === "ios"
                ? [...(modifiers ?? []), interactiveDismissDisabled(dismissDisabled)]
                : modifiers}
        />
    );
}
