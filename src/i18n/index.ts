import AsyncStorage from "@react-native-async-storage/async-storage";
import { LANGUAGE_STORAGE_KEY, loadStartupPreferences } from "@/lib/startup-preferences";
import { getLocales } from "expo-localization";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import en, { type TranslationResource } from "./resources/en";

const SUPPORTED_LANGUAGES = ["en", "ko", "ja", "zh", "km"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

type AppTranslation = TranslationResource<typeof en>;

const localeLoaders: Record<Exclude<AppLanguage, "en">, () => Promise<{ default: AppTranslation }>> = {
    ko: () => import("./resources/ko"),
    ja: () => import("./resources/ja"),
    zh: () => import("./resources/zh"),
    km: () => import("./resources/km"),
};

const i18n = createInstance();

function detectLanguage(): AppLanguage {
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

const pendingLanguageLoads = new Map<AppLanguage, Promise<void>>();

async function ensureLanguageLoaded(language: AppLanguage): Promise<void> {
    if (language === "en" || i18n.hasResourceBundle(language, "translation")) {
        return;
    }

    const existingLoad = pendingLanguageLoads.get(language);
    if (existingLoad) {
        return existingLoad;
    }

    const loadPromise = localeLoaders[language]()
        .then((module) => {
            i18n.addResourceBundle(language, "translation", module.default, true, true);
        })
        .finally(() => {
            pendingLanguageLoads.delete(language);
        });

    pendingLanguageLoads.set(language, loadPromise);
    return loadPromise;
}

const initialLanguage = detectLanguage();

const initPromise = !i18n.isInitialized
    ? i18n.use(initReactI18next).init({
          compatibilityJSON: "v4",
          resources: {
              en: {
                  translation: en,
              },
          },
          defaultNS: "translation",
          lng: initialLanguage,
          fallbackLng: "en",
          supportedLngs: SUPPORTED_LANGUAGES,
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
        let storedLanguage: string | null | undefined;
        try {
            storedLanguage = (await loadStartupPreferences()).get(LANGUAGE_STORAGE_KEY);
        } catch {
            storedLanguage = null;
        }

        if (hasExplicitLanguageSelection) {
            return;
        }

        const nextLanguage = storedLanguage ? resolveLanguage(storedLanguage) : initialLanguage;
        await ensureLanguageLoaded(nextLanguage);

        if (
            !hasExplicitLanguageSelection &&
            (i18n.language !== nextLanguage || i18n.resolvedLanguage !== nextLanguage)
        ) {
            await i18n.changeLanguage(nextLanguage);
        }
    } catch {
        // Keep the fallback language if persisted or detected locale cannot be loaded.
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

    await initPromise;
    await ensureLanguageLoaded(nextLanguage);
    await i18n.changeLanguage(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
}

export default i18n;
