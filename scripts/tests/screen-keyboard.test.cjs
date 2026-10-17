const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function setup() {
    const mounted = [];
    const mockView = name => props => {
        mounted.push({ name, props });
        return React.createElement('div', { 'data-view': name }, props.children);
    };
    const stubs = {
        'react-native': {
            View: mockView('View'),
            ScrollView: mockView('ScrollView'),
            TouchableWithoutFeedback: mockView('KeyboardDismiss'),
            Keyboard: { dismiss() {} },
            useWindowDimensions: () => ({ width: 390 }),
        },
        'react-native-keyboard-controller': {
            KeyboardAvoidingView: mockView('KeyboardAvoidingView'),
            KeyboardAwareScrollView: mockView('KeyboardAwareScrollView'),
        },
        'react-native-safe-area-context': {
            useSafeAreaInsets: () => ({ top: 24, bottom: 20, left: 0, right: 0 }),
        },
        '../utils/cn': { cn: (...classes) => classes.filter(Boolean).join(' ') },
    };
    const context = { exports: {}, process: { env: { EXPO_OS: 'ios' } },
        require: id => stubs[id] ?? require(id) };
    const file = path.resolve(__dirname, '../../src/design-system/components/Screen.tsx');
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, context, { filename: file });
    return {
        mounted,
        render(props) {
            return renderToStaticMarkup(React.createElement(context.exports.Screen, {
                children: 'Screen content', footer: 'Footer content', ...props,
            }));
        },
    };
}

for (const scroll of [true, false]) {
    test(`ordinary ${scroll ? 'scrolling' : 'list'} screens mount no keyboard avoidance machinery`, () => {
        const screen = setup();
        const html = screen.render({ scroll });
        assert.equal(screen.mounted.filter(view => view.name.startsWith('Keyboard')).length, 0);
        assert.equal(screen.mounted.filter(view => view.name === 'ScrollView').length, scroll ? 1 : 0);
        assert.ok(html.includes('Screen content'));
        assert.ok(html.includes('Footer content'));
        assert.equal(screen.mounted[0].name, 'View');
    });
}

test('scrolling forms use one keyboard-aware scroll view without a second avoidance layer', () => {
    const screen = setup();
    const html = screen.render({ keyboardAware: true });
    assert.equal(screen.mounted.filter(view => view.name === 'KeyboardAwareScrollView').length, 1);
    assert.equal(screen.mounted.filter(view => view.name === 'KeyboardAvoidingView').length, 0);
    assert.equal(screen.mounted.filter(view => view.name === 'KeyboardDismiss').length, 1);
    assert.ok(html.includes('Screen content'));
    assert.ok(html.includes('Footer content'));
});

test('non-scrolling forms retain keyboard avoidance, dismissal and footer safe-area spacing', () => {
    const screen = setup();
    const html = screen.render({ keyboardAware: true, scroll: false });
    const avoidance = screen.mounted.filter(view => view.name === 'KeyboardAvoidingView');
    assert.equal(avoidance.length, 1);
    assert.equal(avoidance[0].props.automaticOffset, true);
    assert.equal(avoidance[0].props.behavior, 'padding');
    assert.equal(screen.mounted.filter(view => view.name === 'KeyboardAwareScrollView').length, 0);
    assert.equal(screen.mounted.filter(view => view.name === 'KeyboardDismiss').length, 1);
    assert.ok(screen.mounted.some(view => view.props.style?.paddingBottom === 20));
    assert.ok(html.includes('Screen content'));
    assert.ok(html.includes('Footer content'));
});
