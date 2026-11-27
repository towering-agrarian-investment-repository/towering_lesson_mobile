export type CalendarLocaleCode = "en" | "ko" | "ja" | "zh" | "km";

export type CalendarLocaleData = {
    code: CalendarLocaleCode;
    monthNames: readonly string[];
    monthNamesShort: readonly string[];
    dayNames: readonly string[];
    dayNamesShort: readonly string[];
    today: string;
};

const CALENDAR_LOCALES: Record<CalendarLocaleCode, CalendarLocaleData> = {
    en: {
        code: "en",
        monthNames: [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ],
        monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        today: "Today",
    },
    ko: {
        code: "ko",
        monthNames: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
        monthNamesShort: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
        dayNames: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
        dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
        today: "오늘",
    },
    ja: {
        code: "ja",
        monthNames: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        monthNamesShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        dayNames: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"],
        dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"],
        today: "今日",
    },
    zh: {
        code: "zh",
        monthNames: [
            "一月",
            "二月",
            "三月",
            "四月",
            "五月",
            "六月",
            "七月",
            "八月",
            "九月",
            "十月",
            "十一月",
            "十二月",
        ],
        monthNamesShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        dayNames: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        dayNamesShort: ["日", "一", "二", "三", "四", "五", "六"],
        today: "今天",
    },
    km: {
        code: "km",
        monthNames: ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"],
        monthNamesShort: ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"],
        dayNames: ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"],
        dayNamesShort: ["អា", "ច", "អ", "ព", "ព្រ", "សុ", "ស"],
        today: "ថ្ងៃនេះ",
    },
};

export function resolveCalendarLocale(language?: string | null): CalendarLocaleCode {
    const value = language?.toLowerCase() ?? "en";

    if (value.startsWith("ko")) return "ko";
    if (value.startsWith("ja")) return "ja";
    if (value.startsWith("zh")) return "zh";
    if (value.startsWith("km")) return "km";

    return "en";
}

export function getCalendarLocale(language?: string | null): CalendarLocaleData {
    return CALENDAR_LOCALES[resolveCalendarLocale(language)];
}

export function formatCalendarMonthTitle(year: number, month: number, locale: CalendarLocaleData): string {
    return `${locale.monthNames[month - 1] ?? ""} ${year}`;
}
