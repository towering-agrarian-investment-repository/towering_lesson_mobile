const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const { compile } = require('react-native-css/compiler');

const source = fs.readFileSync(path.join(__dirname, '../../src/design-system/utils/typography.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const tailwindTheme = fs.readFileSync(require.resolve('tailwindcss/theme.css'), 'utf8');
const variants = {
    display: '6xl', h1: '3xl', h2: '2xl', h3: 'xl', subtitle: 'lg',
    body: 'base', value: '2xl', subtext: 'sm', muted: 'base',
    caption: 'xs', meta: 'sm', eyebrow: 'sm', label: 'base', badge: 'xs', count: 'sm',
};

for (const platform of ['android', 'ios', 'web']) {
    test(`${platform}: native text matches the original Tailwind text sizes`, () => {
        const context = { exports: {}, process: { env: { EXPO_OS: platform } } };
        vm.runInNewContext(compiled, context);
        for (const [variant, utility] of Object.entries(variants)) {
            const size = tailwindTheme.match(new RegExp(`--text-${utility}:\\s*([^;]+);`))?.[1];
            assert.ok(size, `Tailwind text-${utility} exists`);
            const result = compile(`.reference { font-size: ${size}; }`,
                platform === 'web' ? { inlineRem: 16 } : {});
            const declarations = result.stylesheet().s[0][1][0].d;
            const reference = declarations.find(value => !Array.isArray(value) && value.fontSize !== undefined).fontSize;
            assert.equal(context.exports.typography[variant].fontSize, reference, variant);
        }
    });
}

test('migrated screens and forms keep font sizes in the shared type ramp', () => {
    const violations = [];
    function scan(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const file = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                scan(file);
            } else if (file.endsWith('.tsx')) {
                const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
                function visit(node) {
                    if (ts.isPropertyAssignment(node) && node.name.getText(sf) === 'fontSize') {
                        const value = ts.isBinaryExpression(node.initializer) ? node.initializer.left : node.initializer;
                        // Tiny chart labels and native tab labels intentionally use pixel sizes.
                        const fixedLabel = /ActivityShareCharts\.tsx$|\(tabs\)[\\/]_layout\.tsx$/.test(file);
                        if (ts.isNumericLiteral(value) && !fixedLabel) {
                            violations.push(`${path.relative(process.cwd(), file)}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`);
                        }
                    }
                    ts.forEachChild(node, visit);
                }
                visit(sf);
            }
        }
    }
    scan(path.join(__dirname, '../../src'));
    assert.deepEqual(violations, [], 'Font sizes must retain the native rem conversion');
});

function standaloneText(platform, fontScale) {
    const context = { exports: {}, process: { env: { EXPO_OS: platform } } };
    vm.runInNewContext(compiled, context);
    const typography = context.exports.typography;
    const colors = { foreground: '#123456', mutedForeground: '#777777', danger: '#ff0000' };
    const mocks = {
        '@expo/ui': { Host: 'Host', Text: 'Text' },
        '@expo/ui/jetpack-compose/modifiers': { fillMaxWidth: () => ({ type: 'fillMaxWidth' }) },
        '@expo/ui/swift-ui/modifiers': { frame: options => ({ type: 'frame', ...options }) },
        '../utils/theme': { useTheme: () => ({ colors, fontScale }) },
        '../utils/typography': { typography },
        'react/jsx-runtime': require('react/jsx-runtime'),
    };
    context.exports = {};
    context.require = id => {
        if (!(id in mocks)) throw new Error(`Unexpected NativeText dependency: ${id}`);
        return mocks[id];
    };
    const file = path.join(__dirname, '../../src/design-system/components/NativeText.tsx');
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, context, { filename: file });
    return { render: context.exports.NativeText, colors, typography };
}

for (const [platform, fontScale] of [['ios', 2], ['android', 1], ['web', 1]]) {
    test(`${platform}: standalone text preserves token sizes, wrapping and accessible scaling`, () => {
        const { render, typography, colors } = standaloneText(platform, fontScale);
        const host = render({ children: 'Connection failed', variant: 'meta', color: 'danger', align: 'center',
            textStyle: { lineHeight: typography.body.lineHeight }, numberOfLines: 2,
            accessibilityRole: 'alert', accessibilityLiveRegion: 'polite' });
        const text = host.props.children;
        assert.equal(text.props.textStyle.fontSize, typography.meta.fontSize * fontScale);
        assert.equal(text.props.textStyle.lineHeight, typography.body.lineHeight * fontScale);
        assert.equal(text.props.textStyle.color, colors.danger);
        assert.equal(text.props.textStyle.textAlign, 'center');
        assert.equal(text.props.numberOfLines, 2);
        assert.equal(text.props.children, 'Connection failed');
        assert.equal(host.props.matchContents.vertical, true);
        assert.equal(host.props.accessibilityRole, 'alert');
        assert.equal(host.props.accessibilityLiveRegion, 'polite');
        assert.equal(host.props.style[0].width, '100%');
        assert.equal(text.props.modifiers[0].type, platform === 'ios' ? 'frame' : 'fillMaxWidth');
        if (platform === 'ios') assert.equal(text.props.modifiers[0].alignment, 'center');

        const badge = render({ children: 'Completed', variant: 'badge', wrap: false });
        assert.equal(badge.props.matchContents, true);
        assert.equal(badge.props.style[0], false, 'Intrinsic badges do not acquire a percentage width');
        assert.equal(badge.props.children.props.modifiers, undefined);
        assert.equal(badge.props.children.props.textStyle.fontSize, typography.badge.fontSize * fontScale);

        for (const style of [{ flex: 1, minWidth: 0 }, { width: 40 }]) {
            const measured = render({ children: 'Long label', style });
            assert.equal(measured.props.style[0], false, 'Preserve row flex or the explicit cell width');
            assert.equal(measured.props.style[1], style);
        }
    });
}
