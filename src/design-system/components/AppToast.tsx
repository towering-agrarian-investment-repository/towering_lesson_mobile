import {
    CircleCheck,
    CircleX,
    Info,
    TriangleAlert,
    X,
    type LucideIcon,
} from "lucide-react-native";
import {
    Animated,
    Pressable,
    View,
    type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    type ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { AppText } from "./AppText";
import { useThemeColors } from "../utils/theme";

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

export function AppToastProvider({ children }: { children: ReactNode }) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const [toast, setToast] = useState<ActiveToast | null>(null);
    const activeIdRef = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [opacity] = useState(() => new Animated.Value(0));
    const [translateY] = useState(() => new Animated.Value(-12));

    const clearTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const dismissToast = useCallback((id: number) => {
        if (activeIdRef.current !== id) return;

        clearTimer();
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 160,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -8,
                duration: 160,
                useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            if (finished && activeIdRef.current === id) {
                setToast(null);
            }
        });
    }, [clearTimer, opacity, translateY]);

    const showToast = useCallback((options: ToastOptions) => {
        const id = activeIdRef.current + 1;
        activeIdRef.current = id;
        clearTimer();
        opacity.stopAnimation();
        translateY.stopAnimation();

        setToast({
            id,
            message: options.message,
            type: options.type ?? "info",
            duration: options.duration ?? 3500,
            position: options.position ?? "top",
        });
    }, [clearTimer, opacity, translateY]);

    useEffect(() => {
        registerToastHandler(showToast);
        return () => registerToastHandler(null);
    }, [showToast]);

    useEffect(() => {
        if (!toast) return;

        opacity.setValue(0);
        translateY.setValue(toast.position === "top" ? -12 : 12);

        Animated.parallel([
            Animated.spring(opacity, {
                toValue: 1,
                damping: 20,
                stiffness: 240,
                mass: 0.8,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                damping: 20,
                stiffness: 240,
                mass: 0.8,
                useNativeDriver: true,
            }),
        ]).start();

        timeoutRef.current = setTimeout(
            () => dismissToast(toast.id),
            toast.duration,
        );

        return clearTimer;
    }, [clearTimer, dismissToast, opacity, toast, translateY]);

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
                    className="absolute inset-x-0 z-50 items-center px-4"
                    style={positionStyle}
                >
                    <Animated.View
                        accessible
                        accessibilityLabel={toast.message}
                        accessibilityLiveRegion={toast.type === "error" ? "assertive" : "polite"}
                        accessibilityRole="alert"
                        className="w-full max-w-xl flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                        style={{
                            opacity,
                            transform: [{ translateY }],
                            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.14)",
                            borderCurve: "continuous",
                        }}
                    >
                        <View
                            className="h-10 w-10 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${accentColor}1A` }}
                        >
                            <Icon size={21} color={accentColor} strokeWidth={2.4} />
                        </View>

                        <AppText
                            selectable
                            variant="label"
                            className="min-w-0 flex-1 leading-5 text-foreground"
                        >
                            {toast.message}
                        </AppText>

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
