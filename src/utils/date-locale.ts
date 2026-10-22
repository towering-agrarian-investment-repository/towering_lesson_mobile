import { enUS, ja, km, ko, zhCN, type Locale } from "date-fns/locale";

const locales: Record<string, Locale> = { en: enUS, ja, km, ko, zh: zhCN };

export function getDateLocale(language = "en"): Locale {
    return locales[language.toLowerCase().split("-")[0]] ?? enUS;
}
