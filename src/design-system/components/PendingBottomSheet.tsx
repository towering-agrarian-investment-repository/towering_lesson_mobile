import { BottomSheet, type BottomSheetProps } from "@expo/ui";
import { interactiveDismissDisabled, presentationCornerRadius } from "@expo/ui/swift-ui/modifiers";
import { useState } from "react";

export type PendingBottomSheetProps = Pick<
    BottomSheetProps,
    | "children"
    | "isPresented"
    | "onDismiss"
    | "modifiers"
    | "snapPoints"
    | "containerColor"
    | "contentColor"
    | "contentPadding"
> & { dismissDisabled: boolean };

/** Keeps pending actions visible; Android uses the native gesture lock. */
export function PendingBottomSheet({ dismissDisabled, modifiers, ...props }: PendingBottomSheetProps) {
    const [hasPresented, setHasPresented] = useState(props.isPresented);
    if (props.isPresented && !hasPresented) setHasPresented(true);

    // Keep the host mounted after first presentation so SwiftUI can finish dismissing.
    if (!hasPresented) return null;

    return (
        <BottomSheet
            {...props}
            onDismiss={() => {
                if (!dismissDisabled) props.onDismiss();
            }}
            shouldDismissOnBackPress={!dismissDisabled}
            shouldDismissOnClickOutside={!dismissDisabled}
            modifiers={
                process.env.EXPO_OS === "ios"
                    ? [...(modifiers ?? []), presentationCornerRadius(24), interactiveDismissDisabled(dismissDisabled)]
                    : modifiers
            }
        />
    );
}
