import * as Haptics from "expo-haptics";

async function runHaptic(task: () => Promise<void>) {
    try {
        await task();
    } catch {
        // Haptics should never block UI interactions.
    }
}

export function triggerSelectionHaptic() {
    void runHaptic(() => Haptics.selectionAsync());
}

export function triggerImpactHaptic(
    style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
) {
    void runHaptic(() => Haptics.impactAsync(style));
}

export function triggerNotificationHaptic(
    type: Haptics.NotificationFeedbackType,
) {
    void runHaptic(() => Haptics.notificationAsync(type));
}
