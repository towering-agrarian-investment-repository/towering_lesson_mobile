import { enUS } from "date-fns/locale/en-US";
import { ja } from "date-fns/locale/ja";
import { km } from "date-fns/locale/km";
import { ko } from "date-fns/locale/ko";
import { zhCN } from "date-fns/locale/zh-CN";

const locales: Record<string, typeof enUS> = { en: enUS, ja, km, ko, zh: zhCN };

export function getDateLocale(language = "en") {
    return locales[language.toLowerCase().split("-")[0]] ?? enUS;
}
