import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createElement,
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { useColorScheme } from "nativewind";

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

const lightThemeColors = {
    background: "#ffffff",
    foreground: "#000000",
    surface: "#f3f3f3",
    card: "#ffffff",
    border: "#eeeeee",
    muted: "#f3f3f3",
    mutedForeground: "#888888",
    primary: "#26a9e0",
    primaryForeground: "#ffffff",
    secondary: "#eefaff",
    secondaryForeground: "#000000",
    danger: "#ff6565",
    success: "#40c057",
    warning: "#ff9f3f",
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
    background: "#0b1120",
    foreground: "#f9fafb",
    surface: "#111827",
    card: "#111827",
    border: "#1f2937",
    muted: "#1f2937",
    mutedForeground: "#9ca3af",
    primary: "#60a5fa",
    primaryForeground: "#0b1120",
    secondary: "#1f2937",
    secondaryForeground: "#f9fafb",
    danger: "#f87171",
    success: "#4ade80",
    warning: "#fbbf24",
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

const THEME_PREFERENCE_STORAGE_KEY = "app-theme-preference";

type ThemeContextValue = {
    colors: ThemeColors;
    isReady: boolean;
    preference: ThemePreference;
    resolvedScheme: "light" | "dark";
    setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemePreference(
    setColorScheme: (scheme: "light" | "dark" | "unspecified") => void,
    preference: ThemePreference,
) {
    if (preference === "system") {
        setColorScheme("unspecified");
        return;
    }

    setColorScheme(preference);
}

export function getThemeColors(
    scheme?: "light" | "dark" | "unspecified" | null,
): ThemeColors {
    return scheme === "dark" ? darkThemeColors : lightThemeColors;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { colorScheme, setColorScheme } = useColorScheme();
    const systemColorScheme = useSystemColorScheme();
    const [preference, setPreferenceState] = useState<ThemePreference>("system");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadPreference = async () => {
            try {
                const storedPreference = await AsyncStorage.getItem(
                    THEME_PREFERENCE_STORAGE_KEY,
                );

                if (!isMounted) {
                    return;
                }

                const nextPreference =
                    storedPreference === "light" || storedPreference === "dark"
                        ? storedPreference
                        : "system";

                setPreferenceState(nextPreference);
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

    const effectiveColorScheme =
        preference === "system" ? systemColorScheme : colorScheme;
    const resolvedScheme = effectiveColorScheme === "dark" ? "dark" : "light";
    const colors = getThemeColors(resolvedScheme);

    const value: ThemeContextValue = {
        colors,
        isReady,
        preference,
        resolvedScheme,
        setPreference: handleSetPreference,
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
    const { isReady, preference, resolvedScheme, setPreference } = useTheme();

    return {
        isThemeReady: isReady,
        themePreference: preference,
        resolvedTheme: resolvedScheme,
        setThemePreference: setPreference,
    };
}
