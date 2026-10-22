import { Column, Host } from "@expo/ui";
import { ModalBottomSheet, type ModalBottomSheetRef } from "@expo/ui/jetpack-compose";
import { padding } from "@expo/ui/jetpack-compose/modifiers";
import { useEffect, useRef, useState } from "react";
import type { PendingBottomSheetProps } from "./PendingBottomSheet";

/** The SDK's universal BottomSheet does not yet expose sheetGesturesEnabled. */
export function PendingBottomSheet({
    children, isPresented, onDismiss, dismissDisabled, modifiers,
    containerColor, contentColor, contentPadding,
}: PendingBottomSheetProps) {
    const sheetRef = useRef<ModalBottomSheetRef>(null);
    const [mounted, setMounted] = useState(isPresented);

    // Mount on presentation; keep the native view until its hide animation finishes.
    if (isPresented && !mounted) setMounted(true);

    useEffect(() => {
        if (isPresented) return;
        let cancelled = false;
        void sheetRef.current?.hide().then(() => {
            if (!cancelled) setMounted(false);
        });
        return () => { cancelled = true; };
    }, [isPresented]);

    if (!mounted) return null;

    const insets = typeof contentPadding === "number"
        ? { top: contentPadding, bottom: contentPadding, left: contentPadding, right: contentPadding }
        : contentPadding ?? { top: 0, bottom: 0, left: 16, right: 16 };

    return (
        <Host style={{ position: "absolute" }} pointerEvents="none">
            <ModalBottomSheet
                ref={sheetRef}
                onDismissRequest={() => { if (!dismissDisabled) onDismiss(); }}
                sheetGesturesEnabled={!dismissDisabled}
                properties={{
                    shouldDismissOnBackPress: !dismissDisabled,
                    shouldDismissOnClickOutside: !dismissDisabled,
                }}
                containerColor={containerColor}
                contentColor={contentColor}
                modifiers={modifiers}
            >
                <Column modifiers={[padding(insets.left ?? 0, insets.top ?? 0, insets.right ?? 0, insets.bottom ?? 0)]}>
                    {children}
                </Column>
            </ModalBottomSheet>
        </Host>
    );
}
