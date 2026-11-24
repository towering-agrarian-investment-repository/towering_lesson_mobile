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

export function resolveLanguage(languageCode?: string | null): AppLanguage {
    const normalizedLanguageCode = languageCode?.toLowerCase();

    if (normalizedLanguageCode?.startsWith("ko")) {
        return "ko";
    }

    if (normalizedLanguageCode?.startsWith("ja")) {
        return "ja";
    }

    if (normalizedLanguageCode?.startsWith("zh")) {
        return "zh";
    }

    if (normalizedLanguageCode?.startsWith("km")) {
        return "km";
    }

    return "en";
}

const initPromise = !i18n.isInitialized
    ? i18n.use(initReactI18next).init({
          compatibilityJSON: "v4",
          resources,
          defaultNS: "translation",
          lng: detectLanguage(),
          fallbackLng: "en",
          supportedLngs: Object.keys(resources),
          interpolation: {
              escapeValue: false,
          },
          returnNull: false,
      })
    : Promise.resolve();

let isLanguageHydrated = false;
let hasExplicitLanguageSelection = false;

export const i18nReady: Promise<void> = (async () => {
    try {
        await initPromise;
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

        if (!storedLanguage || hasExplicitLanguageSelection) {
            return;
        }

        const nextLanguage = resolveLanguage(storedLanguage);

        if (i18n.language !== nextLanguage) {
            await i18n.changeLanguage(nextLanguage);
        }
    } catch {
        // Keep the detected language if persisted preference cannot be restored.
    } finally {
        isLanguageHydrated = true;
    }
})();

export function isI18nReady() {
    return isLanguageHydrated;
}

export async function setAppLanguage(language: AppLanguage) {
    hasExplicitLanguageSelection = true;
    const nextLanguage = resolveLanguage(language);

    await i18n.changeLanguage(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
}

export default i18n;
