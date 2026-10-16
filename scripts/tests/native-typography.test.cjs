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
