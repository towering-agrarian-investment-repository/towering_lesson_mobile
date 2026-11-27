import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    PRIMARY_COLOR_PREFERENCE_STORAGE_KEY,
    THEME_PREFERENCE_STORAGE_KEY,
    loadStartupPreferences,
} from "@/lib/startup-preferences";
import * as SystemUI from "expo-system-ui";
import {
    createContext,
    createElement,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Appearance, Dimensions, useColorScheme as useSystemColorScheme } from "react-native";

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
    dangerForeground: string;
    success: string;
    warning: string;
    warningText: string;
    ticketBay: string;
    ticketPrivate: string;
    ticketGroup: string;
    ticketProgram: string;
    ticketDefault: string;
    btnMainStart: string;
    btnMainEnd: string;
    btnMainPressedStart: string;
    btnMainPressedEnd: string;
    /** Modal and media overlays. */
    scrim: string;
    mediaBackground: string;
    mediaForeground: string;
    scrimControl: string;
    reservationReserved: string;
    reservationCheckedIn: string;
    reservationCompleted: string;
    reservationCancelled: string;
    reservationNoShow: string;
};

export type ThemePreference = "system" | "light" | "dark";
export type PrimaryColorPreference = "blue" | "green";

// Original brand palette. Helper tokens reuse the brand values so the visual
// identity stays unchanged.
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
    dangerForeground: "#ffffff",
    success: "#16a34a",
    warning: "#f59e0b",
    warningText: "#92400e",
    ticketBay: "#26a9e0",
    ticketPrivate: "#4071c0",
    ticketGroup: "#faad3d",
    ticketProgram: "#845ef7",
    ticketDefault: "#7a8186",
    btnMainStart: "#40C057",
    btnMainEnd: "#49BBC4",
    btnMainPressedStart: "#37A54B",
    btnMainPressedEnd: "#3A9DA5",
    scrim: "rgba(0, 0, 0, 0.45)",
    mediaBackground: "#000000",
    mediaForeground: "#FFFFFF",
    scrimControl: "rgba(255, 255, 255, 0.20)",
    reservationReserved: "#3B4EC5",
    reservationCheckedIn: "#52D8AC",
    reservationCompleted: "#00A071",
    reservationCancelled: "#D73246",
    reservationNoShow: "#FF4964",
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
    dangerForeground: "#ffffff",
    success: "#4ade80",
    warning: "#fbbf24",
    warningText: "#fbbf24",
    ticketBay: "#4cc3f0",
    ticketPrivate: "#5b8def",
    ticketGroup: "#ffc24b",
    ticketProgram: "#9775fa",
    ticketDefault: "#8b95a7",
    btnMainStart: "#48D469",
    btnMainEnd: "#54CBD4",
    btnMainPressedStart: "#3DAE54",
    btnMainPressedEnd: "#46AEB6",
    scrim: "rgba(0, 0, 0, 0.45)",
    mediaBackground: "#000000",
    mediaForeground: "#FFFFFF",
    scrimControl: "rgba(255, 255, 255, 0.20)",
    reservationReserved: "#3B4EC5",
    reservationCheckedIn: "#52D8AC",
    reservationCompleted: "#00A071",
    reservationCancelled: "#D73246",
    reservationNoShow: "#FF4964",
} satisfies ThemeColors;

type ThemeContextValue = {
    colors: ThemeColors;
    /** Compose scales sp itself; SwiftUI's explicit font sizes need this factor. */
    fontScale: number;
    isReady: boolean;
    preference: ThemePreference;
    resolvedScheme: "light" | "dark";
    setPreference: (preference: ThemePreference) => Promise<void>;
    primaryColorPreference: PrimaryColorPreference;
    setPrimaryColorPreference: (preference: PrimaryColorPreference) => Promise<void>;
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

function useFontScale() {
    const [fontScale, setFontScale] = useState(() =>
        process.env.EXPO_OS === "ios" ? Math.min(Dimensions.get("window").fontScale, 1.5) : 1,
    );
    const lastFontScale = useRef(fontScale);

    useEffect(() => {
        if (process.env.EXPO_OS !== "ios") return;

        const update = ({ window }: { window: { fontScale: number } }) => {
            const nextFontScale = Math.min(window.fontScale, 1.5);
            if (nextFontScale === lastFontScale.current) return;
            lastFontScale.current = nextFontScale;
            setFontScale(nextFontScale);
        };
        const subscription = Dimensions.addEventListener("change", update);
        update({ window: Dimensions.get("window") });
        return () => subscription.remove();
    }, []);

    return fontScale;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemColorScheme = useSystemColorScheme();
    const nativeFontScale = useFontScale();
    const [preference, setPreferenceState] = useState<ThemePreference>("system");
    const [primaryColorPreference, setPrimaryColorPreferenceState] = useState<PrimaryColorPreference>("blue");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadPreference = async () => {
            try {
                const preferences = await loadStartupPreferences();
                const storedPreference = preferences.get(THEME_PREFERENCE_STORAGE_KEY);
                const storedPrimaryColor = preferences.get(PRIMARY_COLOR_PREFERENCE_STORAGE_KEY);

                if (!isMounted) {
                    return;
                }

                const nextPreference =
                    storedPreference === "light" || storedPreference === "dark" ? storedPreference : "system";

                setPreferenceState(nextPreference);
                setPrimaryColorPreferenceState(storedPrimaryColor === "green" ? "green" : "blue");
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
        applyThemePreference(nextPreference);
        setPreferenceState(nextPreference);
        await AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, nextPreference);
    }, []);

    const handleSetPrimaryColorPreference = useCallback(async (nextPreference: PrimaryColorPreference) => {
        setPrimaryColorPreferenceState(nextPreference);
        await AsyncStorage.setItem(PRIMARY_COLOR_PREFERENCE_STORAGE_KEY, nextPreference);
    }, []);

    const effectiveColorScheme = preference === "system" ? systemColorScheme : preference;
    const resolvedScheme = effectiveColorScheme === "dark" ? "dark" : "light";
    const colors = useMemo(
        () => getThemeColors(resolvedScheme, primaryColorPreference),
        [resolvedScheme, primaryColorPreference],
    );

    useEffect(() => {
        void SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
    }, [colors.background]);

    const value = useMemo<ThemeContextValue>(
        () => ({
            colors,
            fontScale: nativeFontScale,
            isReady,
            preference,
            resolvedScheme,
            setPreference: handleSetPreference,
            primaryColorPreference,
            setPrimaryColorPreference: handleSetPrimaryColorPreference,
        }),
        [
            colors,
            nativeFontScale,
            isReady,
            preference,
            resolvedScheme,
            handleSetPreference,
            primaryColorPreference,
            handleSetPrimaryColorPreference,
        ],
    );

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

export function getStackHeaderOptions(colors: ThemeColors) {
    return {
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
            color: colors.foreground,
            fontWeight: "700" as const,
        },
        headerTitleAlign: "left" as const,
        headerLargeTitleStyle: {
            color: colors.foreground,
        },
        contentStyle: { backgroundColor: colors.background },
    } as const;
}

export function getTabStackHeaderOptions(colors: ThemeColors, resolvedScheme: "light" | "dark") {
    const base = getStackHeaderOptions(colors);

    if (process.env.EXPO_OS !== "ios") {
        return base;
    }

    return {
        ...base,
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerTransparent: true,
        headerBlurEffect:
            resolvedScheme === "dark" ? ("systemChromeMaterialDark" as const) : ("systemChromeMaterialLight" as const),
        headerStyle: { backgroundColor: "transparent" },
        headerLargeStyle: { backgroundColor: colors.background },
    } as const;
}
