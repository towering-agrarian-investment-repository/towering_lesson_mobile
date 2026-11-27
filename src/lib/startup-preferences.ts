import AsyncStorage from "@react-native-async-storage/async-storage";

export const LANGUAGE_STORAGE_KEY = "app-language";
export const THEME_PREFERENCE_STORAGE_KEY = "app-theme-preference";
export const PRIMARY_COLOR_PREFERENCE_STORAGE_KEY = "app-primary-color-preference";
export const WELCOME_COMPLETED_STORAGE_KEY = "happy-golf.welcome-completed.v1";

let startupPreferences: Promise<Map<string, string | null>> | undefined;

export function loadStartupPreferences() {
    startupPreferences ??= AsyncStorage.multiGet([
        LANGUAGE_STORAGE_KEY,
        THEME_PREFERENCE_STORAGE_KEY,
        PRIMARY_COLOR_PREFERENCE_STORAGE_KEY,
        WELCOME_COMPLETED_STORAGE_KEY,
    ]).then((entries) => new Map(entries));

    return startupPreferences;
}
