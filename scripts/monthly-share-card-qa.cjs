// Targeted calendar/localization checks plus a web visual fixture of the actual card.
// Web fixtures do not verify native text shaping, captureRef, or device sharing.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const RN = require("react-native-web");
const { createInstance } = require("i18next");
const { I18nextProvider } = require("react-i18next");
const root = path.resolve(__dirname, "..");
const cache = new Map();

function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText;
    function localRequire(id) {
        if (id === "react-native") return RN;
        if (id === "@expo/vector-icons") return {
            Ionicons: props => React.createElement("span", { style: { color: props.color, fontSize: props.size } }, "◷"),
        };
        if (id === "@/design-system/utils/theme") return {
            useTheme: () => ({ colors: { primary: "#00AEEF", mutedForeground: "#485C7F", reservationCheckedIn: "#52D8AC", reservationReserved: "#3B4EC5", reservationCancelled: "#D73246", reservationNoShow: "#FF4964" } }),
        };
        // Render the existing logo's original SVG paths; no tracing or color changes.
        if (id === "react-native-svg") return {
            __esModule: true,
            default: props => React.createElement("svg", { ...props, xmlns: "http://www.w3.org/2000/svg" }),
            Path: props => React.createElement("path", props),
        };
        if (!id.startsWith(".") && !id.startsWith("@/")) return require(id);
        const target = id.startsWith("@/") ? path.join(root, "src", id.slice(2)) : path.resolve(path.dirname(filename), id);
        if (target.endsWith(".json")) return JSON.parse(fs.readFileSync(target, "utf8"));
        if (target.endsWith(".png")) {
            const highResolution = target.replace(/\.png$/, "@3x.png");
            const use3x = fs.existsSync(highResolution);
            const data = fs.readFileSync(use3x ? highResolution : target);
            return { uri: `data:image/png;base64,${data.toString("base64")}`, width: data.readUInt32BE(16) / (use3x ? 3 : 1), height: data.readUInt32BE(20) / (use3x ? 3 : 1) };
        }
        const resolved = [target, `${target}.ts`, `${target}.tsx`].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
        return load(resolved);
    }
    new Function("require", "module", "exports", source)(localRequire, module, module.exports);
    return module.exports;
}

const layout = load(path.join(root, "src/components/golf/monthly-share-card-layout.ts"));
const october = layout.getShareCardCalendar(2026, 9, "en");
assert.equal(october.rows, 5);
assert.equal(layout.SHARE_CARD_WIDTH, 1122);
assert.equal(layout.SHARE_CARD_HEIGHT, 1402);
assert.equal(layout.SHARE_CARD_EXPORT_WIDTH, 1080);
assert.equal(layout.SHARE_CARD_EXPORT_HEIGHT, 1350);
assert.equal(october.cells[3].dateKey, "2026-10-01");
assert.equal(october.cells[4].dateKey, "2026-10-02");
assert.equal(october.cells[33].dateKey, "2026-10-31");
assert.equal(october.cells[0].label, "");
assert.equal(october.cells[0].inMonth, false);
for (let year = 2024; year <= 2028; year++) {
    for (let month = 0; month < 12; month++) {
        const { cells, rows } = layout.getShareCardCalendar(year, month, "en");
        const dates = cells.filter(cell => cell.dateKey).map(cell => cell.dateKey);
        assert.equal(dates.length, new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
        assert.equal(new Set(dates).size, dates.length);
        assert.ok(cells.every(cell => cell.y + cell.height <= 1110));
        assert.ok(cells.every(cell => cell.width === 133));
        assert.ok(cells.every(cell => cell.height === (rows === 6 ? 88 : 98)));
    }
}
assert.equal(layout.getShareCardCalendar(2026, 7, "en").rows, 6);
assert.equal(layout.getShareCardLocale("not_a_locale"), "en");
const languages = ["en", "ko", "ja", "zh", "km"];
const translations = Object.fromEntries(languages.map(locale => [
    locale,
    load(path.join(root, `src/i18n/resources/${locale}.ts`)).default,
]));
const i18n = createInstance();
i18n.init({ initImmediate: false, lng: "en", fallbackLng: "en", defaultNS: "translation", resources: Object.fromEntries(Object.entries(translations).map(([locale, translation]) => [locale, { translation }])) });
for (const locale of languages) {
    assert.ok(layout.formatShareCardMonth(2026, 9, locale));
    assert.equal(layout.getShareCardCalendar(2026, 9, locale).cells[3].dateKey, "2026-10-01");
    for (const key of ["reservations", "played", "member", "hourShort", "share"]) {
        assert.ok(i18n.exists(`shareCard.${key}`, { lng: locale }));
    }
}
console.log("PASS: 60 month grids, leap years, six-row bounds, October positions, 5 app languages.");

if (process.argv.includes("--render")) {
    const { MonthlyGolfShareCard } = load(path.join(root, "src/components/golf/MonthlyGolfShareCard.tsx"));
    const output = path.join(root, ".expo/share-card-qa");
    fs.mkdirSync(output, { recursive: true });
    const sample = [6, 13, 21, 28].map(day => ({ date: `2026-10-${String(day).padStart(2, "0")}`, count: 2, status: [13, 28].includes(day) ? "mixed" : "completed" }));
    const variants = [...languages.map(locale => ({ name: locale, locale })),
        { name: "six-weeks", locale: "en", month: 7 },
        { name: "zero", locale: "en", dailyValues: [] },
        { name: "long-name-125", locale: "en", memberName: "Alexandria 長い名前 សុខសប្បាយ 🏌️", dailyValues: [{ date: "2026-10-02", count: 125, status: "completed" }] }];
    for (const variant of variants) {
        i18n.changeLanguage(variant.locale);
        const { locale, ...cardVariant } = variant;
        RN.AppRegistry.registerComponent("ShareCardQA", () => () => React.createElement(I18nextProvider, { i18n },
            React.createElement(MonthlyGolfShareCard, { year: 2026, month: 9, width: 1122, dailyValues: sample, hoursOnCourse: 6.7, memberName: "Alexis DE", onReadyChange() {}, onAssetError() {}, ...cardVariant })));
        const app = RN.AppRegistry.getApplication("ShareCardQA");
        const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8">${renderToStaticMarkup(app.getStyleElement())}<style>html,body{margin:0;width:1080px;height:1350px;overflow:hidden}#canvas{width:1122px;height:1402px;transform-origin:top left;transform:scale(${1080 / 1122},${1350 / 1402})}</style></head><body><div id="canvas">${renderToStaticMarkup(app.element)}</div></body></html>`;
        fs.writeFileSync(path.join(output, `${variant.name}.html`), html);
    }
    console.log(`Web-only visual fixtures written to ${output}`);
}
