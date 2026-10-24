import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { NativeText } from "./NativeText";
import {
    CircleCheck,
    CircleX,
    Info,
    TriangleAlert,
    X,
    type LucideIcon,
} from "lucide-react-native";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastPosition = "top" | "bottom";

export type ToastOptions = {
    message: string;
    type?: ToastType;
    duration?: number;
    position?: ToastPosition;
};

type ToastHandler = (options: ToastOptions) => void;

type ActiveToast = Required<ToastOptions> & {
    id: number;
};

let toastHandler: ToastHandler | null = null;

export function registerToastHandler(handler: ToastHandler | null) {
    toastHandler = handler;
}

export function showAppToast({
    message,
    type = "info",
    duration,
    position = "top",
}: ToastOptions) {
    const normalizedMessage = message.trim();

    if (!normalizedMessage) return;

    if (!toastHandler) {
        console.warn(`Toast not ready: ${normalizedMessage}`);
        return;
    }

    toastHandler({
        message: normalizedMessage,
        type,
        duration: duration ?? (type === "error" ? 5000 : 3500),
        position,
    });
}

const TOAST_ICONS: Record<ToastType, LucideIcon> = {
    success: CircleCheck,
    error: CircleX,
    warning: TriangleAlert,
    info: Info,
};
const TOAST_EASING = Easing.bezier(0.23, 1, 0.32, 1);

export function AppToastProvider({ children }: { children: ReactNode }) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const reducedMotion = useReducedMotion();
    const [toast, setToast] = useState<ActiveToast | null>(null);
    const activeIdRef = useRef(0);
    const activePositionRef = useRef<ToastPosition>("top");
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.get(),
        transform: [{ translateY: translateY.get() }],
    }));

    const clearTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const removeToast = useCallback((id: number) => {
        if (activeIdRef.current === id) setToast(null);
    }, []);

    const dismissToast = useCallback(
        (id: number) => {
            if (activeIdRef.current !== id) return;

            clearTimer();
            opacity.set(withTiming(0, {
                duration: reducedMotion ? 100 : 160,
                easing: TOAST_EASING,
            }, (finished) => {
                if (finished) scheduleOnRN(removeToast, id);
            }));
            if (!reducedMotion) {
                translateY.set(withTiming(activePositionRef.current === "top" ? -8 : 8, {
                    duration: 160,
                    easing: TOAST_EASING,
                }));
            }
        },
        [clearTimer, opacity, reducedMotion, removeToast, translateY],
    );

    const showToast = useCallback(
        (options: ToastOptions) => {
            const id = activeIdRef.current + 1;
            activeIdRef.current = id;
            activePositionRef.current = options.position ?? "top";
            clearTimer();
            cancelAnimation(opacity);
            cancelAnimation(translateY);

            setToast({
                id,
                message: options.message,
                type: options.type ?? "info",
                duration: options.duration ?? 3500,
                position: options.position ?? "top",
            });
        },
        [clearTimer, opacity, translateY],
    );

    useEffect(() => {
        registerToastHandler(showToast);
        return () => registerToastHandler(null);
    }, [showToast]);

    useEffect(() => {
        if (!toast) return;

        opacity.set(0);
        translateY.set(reducedMotion ? 0 : toast.position === "top" ? -12 : 12);
        opacity.set(withTiming(1, {
            duration: reducedMotion ? 120 : 200,
            easing: TOAST_EASING,
        }));
        if (!reducedMotion) {
            translateY.set(withTiming(0, {
                duration: 200,
                easing: TOAST_EASING,
            }));
        }

        timeoutRef.current = setTimeout(
            () => dismissToast(toast.id),
            toast.duration,
        );

        return clearTimer;
    }, [clearTimer, dismissToast, opacity, reducedMotion, toast, translateY]);

    const accentColors: Record<ToastType, string> = {
        success: colors.success,
        error: colors.danger,
        warning: colors.warning,
        info: colors.primary,
    };
    const accentColor = toast ? accentColors[toast.type] : colors.primary;
    const Icon = toast ? TOAST_ICONS[toast.type] : Info;
    const positionStyle: ViewStyle | undefined = toast
        ? toast.position === "top"
            ? { top: insets.top + 12 }
            : { bottom: insets.bottom + 16 }
        : undefined;

    return (
        <View className="flex-1">
            {children}

            {toast ? (
                <View
                    pointerEvents="box-none"
                    className="absolute inset-x-0 z-50 items-center"
                    style={{
                        ...positionStyle,
                        paddingLeft: Math.max(insets.left, 16),
                        paddingRight: Math.max(insets.right, 16),
                    }}
                >
                    <Animated.View
                        accessible
                        accessibilityLabel={toast.message}
                        accessibilityLiveRegion={
                            toast.type === "error" ? "assertive" : "polite"
                        }
                        accessibilityRole="alert"
                        className="w-full max-w-xl flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                        style={[animatedStyle, {
                            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.14)",
                            borderCurve: "continuous",
                        }]}
                    >
                        <View
                            className="h-10 w-10 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${accentColor}1A` }}
                        >
                            <Icon
                                size={21}
                                color={accentColor}
                                strokeWidth={2.4}
                            />
                        </View>

                        <NativeText
                            variant="label"
                            style={{ flex: 1, minWidth: 0 }}
                            textStyle={{ lineHeight: typography.subtext.lineHeight }}
                        >
                            {toast.message}
                        </NativeText>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Dismiss notification"
                            hitSlop={12}
                            onPress={() => dismissToast(toast.id)}
                            className="h-9 w-9 shrink-0 items-center justify-center rounded-full active:bg-muted"
                        >
                            <X size={19} color={colors.mutedForeground} />
                        </Pressable>
                    </Animated.View>
                </View>
            ) : null}
        </View>
    );
}
