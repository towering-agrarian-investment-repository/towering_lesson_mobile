import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import {
    createContext,
    createElement,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Appearance,
    useColorScheme as useSystemColorScheme,
    useWindowDimensions,
} from "react-native";

export type ThemeColors = {
    background: string;
    foreground: string;
    surface: string;
    card: string;
    border: string;
    muted: string;
    mutedForeground: string;
    primary: string;
    primaryForeground: string;
    danger: string;
    success: string;
    warning: string;
    ticketBay: string;
    ticketPrivate: string;
    ticketGroup: string;
    ticketProgram: string;
    ticketDefault: string;
    btnMainStart: string;
    btnMainEnd: string;
    btnMainPressedStart: string;
    btnMainPressedEnd: string;
};

export type ThemePreference = "system" | "light" | "dark";
export type PrimaryColorPreference = "blue" | "green";

// Fixed reservation status colors shared by both themes. The OKLCH values
// supplied for Completed, Cancelled, and No Show are mapped to sRGB for native.
export const reservationStatusColors = {
    reservationReserved: "#3B4EC5",
    reservationCheckedIn: "#52D8AC",
    reservationCompleted: "#00A071", // oklch(0.62 0.14 165)
    reservationCancelled: "#D73246", // oklch(0.58 0.20 20)
    reservationNoShow: "#FF4964", // oklch(0.69 0.24 18)
} as const;

const lightThemeColors = {
    background: "#ffffff",
    foreground: "#111827",
    surface: "#f9fafb",
    card: "#ffffff",
    border: "#e5e7eb",
    muted: "#f3f4f6",
    mutedForeground: "#6b7280",
    primary: "#00AEEF",
    primaryForeground: "#ffffff",
    danger: "#dc2626",
    success: "#16a34a",
    warning: "#f59e0b",
    ticketBay: "#26a9e0",
    ticketPrivate: "#4071c0",
    ticketGroup: "#faad3d",
    ticketProgram: "#845ef7",
    ticketDefault: "#7a8186",
    btnMainStart: "#40C057",
    btnMainEnd: "#49BBC4",
    btnMainPressedStart: "#37A54B",
    btnMainPressedEnd: "#3A9DA5",
} satisfies ThemeColors;

const darkThemeColors = {
    background: "#0a0e16",
    foreground: "#e5e7eb",
    surface: "#11161f",
    card: "#161b26",
    border: "#262d3a",
    muted: "#1c2330",
    mutedForeground: "#8b95a7",
    primary: "#33C6FF",
    primaryForeground: "#ffffff",
    danger: "#f87171",
    success: "#4ade80",
    warning: "#fbbf24",
    ticketBay: "#4cc3f0",
    ticketPrivate: "#5b8def",
    ticketGroup: "#ffc24b",
    ticketProgram: "#9775fa",
    ticketDefault: "#8b95a7",
    btnMainStart: "#48D469",
    btnMainEnd: "#54CBD4",
    btnMainPressedStart: "#3DAE54",
    btnMainPressedEnd: "#46AEB6",
} satisfies ThemeColors;

const THEME_PREFERENCE_STORAGE_KEY = "app-theme-preference";
const PRIMARY_COLOR_PREFERENCE_STORAGE_KEY = "app-primary-color-preference";

type ThemeContextValue = {
    colors: ThemeColors;
    /** Compose scales sp itself; SwiftUI's explicit font sizes need this factor. */
    fontScale: number;
    isReady: boolean;
    preference: ThemePreference;
    resolvedScheme: "light" | "dark";
    setPreference: (preference: ThemePreference) => Promise<void>;
    primaryColorPreference: PrimaryColorPreference;
    setPrimaryColorPreference: (
        preference: PrimaryColorPreference,
    ) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemePreference(preference: ThemePreference) {
    Appearance.setColorScheme(preference === "system" ? "auto" : preference);
}

export function getThemeColors(
    scheme?: "light" | "dark" | "unspecified" | null,
    primaryColorPreference: PrimaryColorPreference = "blue",
): ThemeColors {
    const colors = scheme === "dark" ? darkThemeColors : lightThemeColors;

    if (primaryColorPreference === "green") {
        return {
            ...colors,
            primary: "#00BC7D",
            primaryForeground: "#ffffff",
        };
    }

    return colors;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    if (process.env.EXPO_PUBLIC_THEME_PROBE === "1") {
        const tapAt = (globalThis as { __themeTapAt?: number }).__themeTapAt;
        // eslint-disable-next-line react-hooks/purity -- Temporary render timing probe.
        console.log("provider render", tapAt === undefined ? null : Date.now() - tapAt);
    }

    const systemColorScheme = useSystemColorScheme();
    const { fontScale } = useWindowDimensions();
    const [preference, setPreferenceState] =
        useState<ThemePreference>("system");
    const [primaryColorPreference, setPrimaryColorPreferenceState] =
        useState<PrimaryColorPreference>("blue");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadPreference = async () => {
            try {
                const [storedPreference, storedPrimaryColor] = await Promise.all([
                    AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY),
                    AsyncStorage.getItem(PRIMARY_COLOR_PREFERENCE_STORAGE_KEY),
                ]);

                if (!isMounted) {
                    return;
                }

                const nextPreference =
                    storedPreference === "light" || storedPreference === "dark"
                        ? storedPreference
                        : "system";

                setPreferenceState(nextPreference);
                setPrimaryColorPreferenceState(
                    storedPrimaryColor === "green" ? "green" : "blue",
                );
                applyThemePreference(nextPreference);
            } catch {
                // Use the system theme and default brand if storage is unavailable.
            } finally {
                if (isMounted) {
                    setIsReady(true);
                }
            }
        };

        void loadPreference();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSetPreference = useCallback(async (nextPreference: ThemePreference) => {
        if (process.env.EXPO_PUBLIC_THEME_PROBE === "1") {
            (globalThis as { __themeTapAt?: number }).__themeTapAt = Date.now();
        }
        applyThemePreference(nextPreference);
        setPreferenceState(nextPreference);
        await AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, nextPreference);
    }, []);

    const handleSetPrimaryColorPreference = useCallback(async (
        nextPreference: PrimaryColorPreference,
    ) => {
        setPrimaryColorPreferenceState(nextPreference);
        await AsyncStorage.setItem(
            PRIMARY_COLOR_PREFERENCE_STORAGE_KEY,
            nextPreference,
        );
    }, []);

    const effectiveColorScheme =
        preference === "system" ? systemColorScheme : preference;
    const resolvedScheme = effectiveColorScheme === "dark" ? "dark" : "light";
    const colors = useMemo(
        () => getThemeColors(resolvedScheme, primaryColorPreference),
        [resolvedScheme, primaryColorPreference],
    );
    const nativeFontScale = process.env.EXPO_OS === "ios" ? fontScale : 1;

    useEffect(() => {
        void SystemUI.setBackgroundColorAsync(colors.background).catch(
            () => { },
        );
    }, [colors.background]);

    const value = useMemo<ThemeContextValue>(() => ({
        colors,
        fontScale: nativeFontScale,
        isReady,
        preference,
        resolvedScheme,
        setPreference: handleSetPreference,
        primaryColorPreference,
        setPrimaryColorPreference: handleSetPrimaryColorPreference,
    }), [colors, nativeFontScale, isReady, preference, resolvedScheme,
        handleSetPreference, primaryColorPreference, handleSetPrimaryColorPreference]);

    return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider.");
    }

    return context;
}

export function useThemeColors(): ThemeColors {
    return useTheme().colors;
}
