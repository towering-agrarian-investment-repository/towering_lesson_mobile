import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import { useColorScheme } from "nativewind";
import {
    createContext,
    createElement,
    type ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

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
    secondary: string;
    secondaryForeground: string;
    danger: string;
    success: string;
    warning: string;
    notification: string;
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
    secondary: "#f3f4f6",
    secondaryForeground: "#111827",
    danger: "#dc2626",
    success: "#16a34a",
    warning: "#f59e0b",
    notification: "#dc2626",
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
    secondary: "#1c2330",
    secondaryForeground: "#e5e7eb",
    danger: "#f87171",
    success: "#4ade80",
    warning: "#fbbf24",
    notification: "#f87171",
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
    isReady: boolean;
    preference: ThemePreference;
    resolvedScheme: "light" | "dark";
    setPreference: (preference: ThemePreference) => Promise<void>;
    primaryColorPreference: PrimaryColorPreference;
    setPrimaryColorPreference: (preference: PrimaryColorPreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemePreference(
    setColorScheme: (scheme: "light" | "dark" | "unspecified") => void,
    preference: ThemePreference,
) {
    try {
        if (preference === "system") {
            setColorScheme("unspecified");
            return;
        }

        setColorScheme(preference);
    } catch {
        // Fall back to local provider state if the platform setter is unavailable.
    }
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
    const { colorScheme, setColorScheme } = useColorScheme();
    const systemColorScheme = useSystemColorScheme();
    const [preference, setPreferenceState] = useState<ThemePreference>("system");
    const [primaryColorPreference, setPrimaryColorPreferenceState] =
        useState<PrimaryColorPreference>("blue");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadPreference = async () => {
            try {
                const storedPreference = await AsyncStorage.getItem(
                    THEME_PREFERENCE_STORAGE_KEY,
                );
                const storedPrimaryColor = await AsyncStorage.getItem(
                    PRIMARY_COLOR_PREFERENCE_STORAGE_KEY,
                );

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
                applyThemePreference(setColorScheme, nextPreference);
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
    }, [setColorScheme]);

    const handleSetPreference = async (nextPreference: ThemePreference) => {
        setPreferenceState(nextPreference);
        applyThemePreference(setColorScheme, nextPreference);
        await AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, nextPreference);
    };

    const handleSetPrimaryColorPreference = async (
        nextPreference: PrimaryColorPreference,
    ) => {
        setPrimaryColorPreferenceState(nextPreference);
        await AsyncStorage.setItem(
            PRIMARY_COLOR_PREFERENCE_STORAGE_KEY,
            nextPreference,
        );
    };

    const effectiveColorScheme =
        preference === "system" ? systemColorScheme : colorScheme;
    const resolvedScheme = effectiveColorScheme === "dark" ? "dark" : "light";
    const colors = getThemeColors(resolvedScheme, primaryColorPreference);

    useEffect(() => {
        void SystemUI.setBackgroundColorAsync(colors.background).catch(() => { });
    }, [colors.background]);

    const value: ThemeContextValue = {
        colors,
        isReady,
        preference,
        resolvedScheme,
        setPreference: handleSetPreference,
        primaryColorPreference,
        setPrimaryColorPreference: handleSetPrimaryColorPreference,
    };

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

export function useThemePreference() {
    const {
        isReady,
        preference,
        resolvedScheme,
        setPreference,
        primaryColorPreference,
        setPrimaryColorPreference,
    } = useTheme();

    return {
        isThemeReady: isReady,
        themePreference: preference,
        resolvedTheme: resolvedScheme,
        setThemePreference: setPreference,
        primaryColorPreference,
        setPrimaryColorPreference,
    };
}
