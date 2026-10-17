const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const { createInstance } = require('i18next');
const normalizeColor = require(require.resolve('@react-native/normalize-colors', {
    paths: [path.dirname(require.resolve('react-native/package.json'))],
}));

function loadData(signedColors = false) {
    const cache = new Map();
    function load(file) {
        if (cache.has(file)) return cache.get(file);
        const context = {
            exports: {},
            require(id) {
                if (id === 'react-native') {
                    return { processColor(color) {
                        const rgba = normalizeColor(color);
                        if (rgba === null) return undefined;
                        // Public processColor returns ARGB (signed on Android).
                        const argb = ((rgba << 24) | (rgba >>> 8)) >>> 0;
                        return signedColors ? argb | 0 : argb;
                    } };
                }
                return load(path.resolve(path.dirname(file), `${id}.ts`));
            },
        };
        cache.set(file, context.exports);
        vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS },
        }).outputText, context, { filename: file });
        return context.exports;
    }
    return {
        ...load(path.resolve(__dirname, '../../src/design-system/components/charts/activity-chart-data.ts')),
        ...load(path.resolve(__dirname, '../../src/design-system/utils/color.ts')),
    };
}

const data = loadData();
const dateValues = (values) => new Map(values.map(value => [data.toDateKey(value.date), value]));
const plain = value => JSON.parse(JSON.stringify(value));

test('calendar dates stay on their API date in western and eastern time zones', () => {
    const originalZone = process.env.TZ;
    try {
        for (const zone of ['America/Los_Angeles', 'Asia/Bangkok']) {
            process.env.TZ = zone;
            const local = data.parseCalendarDate('2024-02-29');
            assert.equal(data.toDateKey(local), '2024-02-29');
            assert.equal(local.getHours(), 0);
            assert.equal(data.toDateKey(new Date(2024, 1, 29, 23)), '2024-02-29');
            assert.equal(data.formatActivityDate('2024-02-29', 'en-US'), 'Feb 29, 2024');
        }
    } finally {
        if (originalZone === undefined) delete process.env.TZ;
        else process.env.TZ = originalZone;
    }
});

test('Monday-aligned leap-year weeks preserve counts and breakdowns from one lookup', () => {
    const breakdown = { completed: 2, reserved: 1 };
    const types = { lesson: 1, bay: 2 };
    const weeks = data.buildHeatmapWeeks(dateValues([
        { date: '2024-02-29', count: 1 },
        { date: '2024-02-29', count: 3, status: 'mixed', statusBreakdown: breakdown, typeCounts: types },
    ]), '2024-12-31', 366, 'en');
    assert.equal(weeks.length, 53);
    assert.equal(weeks[0].days[0].dateKey, '2024-01-01');
    assert.equal(weeks.at(-1).days[6].dateKey, '2025-01-05');
    const leapDay = weeks.flatMap(week => week.days).find(day => day.dateKey === '2024-02-29');
    assert.equal(leapDay.count, 3);
    assert.equal(leapDay.status, 'mixed');
    assert.deepEqual(plain(leapDay.statusBreakdown), breakdown);
    assert.deepEqual(plain(leapDay.typeCounts), types);
    assert.equal(weeks[0].days[0].count, 0);
    assert.equal(weeks[0].monthLabel, 'Jan');
});

test('empty, invalid and multi-year ranges remain bounded and predictable', () => {
    for (const days of [0, -1, NaN, Infinity]) {
        assert.equal(data.buildHeatmapWeeks(new Map(), '2026-12-31', days, 'en').length, 0);
    }
    assert.equal(data.buildHeatmapWeeks(new Map(), 'invalid', 365, 'en').length, 0);
    const weeks = data.buildHeatmapWeeks(new Map(), '2026-12-31', 1096, 'en');
    assert.equal(weeks[0].days[0].dateKey, '2024-01-01');
    assert.equal(weeks.length, 157);
});

test('focus follows the current month, historical January, and missing-month fallback', () => {
    const current = data.buildHeatmapWeeks(new Map(), '2026-12-31', 365, 'en');
    const focus = data.getFocusMonthWeekIndex(current, '2026-12-31', '2026-10-17');
    assert.ok(current[focus].days.some(day => day.dateKey === '2026-10-01'));
    const historical = data.buildHeatmapWeeks(new Map(), '2025-12-31', 365, 'en');
    assert.equal(data.getFocusMonthWeekIndex(historical, '2025-12-31', '2026-10-17'), 0);
    const partial = data.buildHeatmapWeeks(new Map(), '2026-03-31', 7, 'en');
    assert.equal(data.getFocusMonthWeekIndex(partial, '2026-03-31', '2026-10-17'), 0);
    assert.equal(data.getFocusMonthWeekIndex([], '2026-12-31', '2026-10-17'), 0);
});

test('labels use the supplied translator and locale without a global i18n instance', async () => {
    const translations = createInstance();
    await translations.init({
        lng: 'en', fallbackLng: 'en',
        resources: {
            en: { translation: { activity: { completed: 'Completed', bay: 'Bay', lesson: 'Lesson' } } },
            ko: { translation: { activity: { completed: '완료', bay: '타석', lesson: '레슨' } } },
        },
    });
    assert.equal(data.formatStatusBreakdown({ completed: 2 }, translations.getFixedT('en')), ' · 2 Completed');
    assert.equal(data.formatStatusBreakdown({ completed: 2 }, translations.getFixedT('ko')), ' · 2 완료');
    assert.equal(data.formatTypeBreakdown({ bay: 1, lesson: 2 }, translations.getFixedT('ko')), '1 타석 · 2 레슨');
    assert.equal(data.formatTypeBreakdown({ bay: 0, lesson: 0 }, translations.t), '');
    assert.equal(data.formatStatusBreakdown(undefined, translations.t), '');
    assert.equal(data.formatActivityDate('2026-10-17', 'ko'),
        new Intl.DateTimeFormat('ko', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(2026, 9, 17)));
});

for (const signed of [false, true]) {
    test(`opacity supports hex, RGB, HSL and existing alpha (${signed ? 'Android' : 'iOS'})`, () => {
        const { colorWithOpacity } = loadData(signed);
        for (const color of ['#fff', '#ffffff', 'rgb(255, 255, 255)', 'hsl(0, 0%, 100%)']) {
            assert.equal(colorWithOpacity(color, 0.2), 'rgba(255, 255, 255, 0.2)');
        }
        const alpha = Number(colorWithOpacity('rgba(255, 0, 0, 0.5)', 0.4).match(/, ([\d.]+)\)$/)[1]);
        assert.ok(Math.abs(alpha - 0.2) < 0.001);
        assert.equal(colorWithOpacity('#123456', 2), 'rgba(18, 52, 86, 1)');
        assert.equal(colorWithOpacity('#123456', -1), 'rgba(18, 52, 86, 0)');
        assert.equal(colorWithOpacity('invalid', 0.2), 'invalid');
    });
}

test('status colors and fallback intensity retain the existing palette', () => {
    const colors = { primary: '#123456', muted: '#eee', success: 'green', danger: 'red',
        mutedForeground: 'gray', ticketPrivate: 'blue', warning: 'orange' };
    assert.equal(data.getHeatmapCellColor(0, colors, 'completed'), colors.muted);
    assert.equal(data.getHeatmapCellColor(1, colors, 'completed'), colors.success);
    assert.equal(data.getHeatmapCellColor(1, colors, 'reserved'), colors.ticketPrivate);
    assert.equal(data.getHeatmapCellColor(1, colors, 'mixed'), colors.warning);
    for (const [count, alpha] of [[1, 0.2], [2, 0.4], [3, 0.6], [4, 1], [10, 1]]) {
        assert.equal(data.getHeatmapCellColor(count, colors), `rgba(18, 52, 86, ${alpha})`);
    }
});

test('default weekly ranges end in the selected week rather than future weeks', () => {
    const weeks = data.buildWeekSummaries([], undefined, new Date(2026, 9, 17), 3, 'en');
    assert.deepEqual(plain(weeks.map(week => data.toDateKey(week.weekStart))), ['2026-09-28', '2026-10-05', '2026-10-12']);
    for (const count of [0, -1, NaN, Infinity]) {
        assert.equal(data.buildWeekSummaries([], undefined, new Date(), count, 'en').length, 0);
    }
    assert.equal(data.buildWeekSummaries([], new Date(2026, 10, 1), new Date(2026, 9, 1), 12, 'en').length, 0);
});

test('weekly ranges include their last Monday across spring DST and normalize current weekdays', () => {
    const previousZone = process.env.TZ;
    try {
        process.env.TZ = 'America/Los_Angeles';
        const weeks = data.buildWeekSummaries([{ weekStart: '2026-03-09', total: 4 }],
            new Date(2026, 2, 2), new Date(2026, 2, 16), 12, 'en');
        assert.deepEqual(plain(weeks.map(week => data.toDateKey(week.weekStart))), ['2026-03-02', '2026-03-09', '2026-03-16']);
        assert.equal(weeks[1].total, 4);
        assert.equal(data.toDateKey(data.getWeekStart('2026-03-15')), '2026-03-09');
        assert.equal(data.toDateKey(data.getWeekStart('2026-03-16')), '2026-03-16');
    } finally {
        if (previousZone === undefined) delete process.env.TZ;
        else process.env.TZ = previousZone;
    }
});
