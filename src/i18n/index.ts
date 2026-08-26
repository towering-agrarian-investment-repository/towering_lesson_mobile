import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./resources/en";
import ja from "./resources/ja";
import km from "./resources/km";
import ko from "./resources/ko";
import zh from "./resources/zh";

const resources = {
    en: {
        translation: en,
    },
    ko: {
        translation: ko,
    },
    ja: {
        translation: ja,
    },
    zh: {
        translation: zh,
    },
    km: {
        translation: km,
    },
} as const;

const LANGUAGE_STORAGE_KEY = "app-language";
const i18n = createInstance();

export type AppLanguage = keyof typeof resources;

function detectLanguage() {
    const locale = getLocales()[0];
    return resolveLanguage(locale?.languageCode);
}

function resolveLanguage(languageCode?: string | null): AppLanguage {
    const normalizedLanguageCode = languageCode?.toLowerCase();

    if (normalizedLanguageCode === "ko") {
        return "ko";
    }

    if (normalizedLanguageCode === "ja") {
        return "ja";
    }

    if (normalizedLanguageCode === "zh") {
        return "zh";
    }

    if (normalizedLanguageCode === "km") {
        return "km";
    }

    return "en";
}

if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
        compatibilityJSON: "v4",
        resources,
        lng: detectLanguage(),
        fallbackLng: "en",
        supportedLngs: ["en", "ko", "ja", "zh", "km"],
        interpolation: {
            escapeValue: false,
        },
        returnNull: false,
    });
}

void (async () => {
    try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

        if (!storedLanguage) {
            return;
        }

        const nextLanguage = resolveLanguage(storedLanguage);

        if (i18n.language !== nextLanguage) {
            await i18n.changeLanguage(nextLanguage);
        }
    } catch {
        // Keep the detected language if persisted preference cannot be restored.
    }
})();

export async function setAppLanguage(language: AppLanguage) {
    const nextLanguage = resolveLanguage(language);

    await i18n.changeLanguage(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
}

export default i18n;
