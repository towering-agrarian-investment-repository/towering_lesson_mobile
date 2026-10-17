const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const query = require('@tanstack/react-query');

function load(relativePath, mocks, globals = {}) {
    const filename = path.resolve(__dirname, '../..', relativePath);
    const exports = {};
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText, {
        exports, Error, ...globals,
        require(id) {
            if (id in mocks) return mocks[id];
            if (id === 'react/jsx-runtime') return require(id);
            throw new Error(`Missing test dependency: ${id}`);
        },
    }, { filename });
    return exports;
}

function hooks() {
    const states = [], effects = [];
    return {
        states, effects,
        react: {
            ...React,
            useState(initial) {
                const index = states.push(typeof initial === 'function' ? initial() : initial) - 1;
                return [states[index], value => { states[index] = value; }];
            },
            useEffect(effect) { effects.push(effect); },
            useMemo: callback => callback(),
            useCallback: callback => callback,
            useRef: value => ({ current: value }),
        },
    };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

function pullRefreshHarness(refresh) {
    const values = [];
    let cursor = 0;
    const { usePullToRefresh } = load('src/lib/hook/usePullToRefresh.ts', {
        react: {
            useState(initial) {
                const index = cursor++;
                if (!(index in values)) values[index] = initial;
                return [values[index], value => { values[index] = value; }];
            },
            useRef(initial) {
                const index = cursor++;
                if (!(index in values)) values[index] = { current: initial };
                return values[index];
            },
        },
    });
    return () => {
        cursor = 0;
        return usePullToRefresh(refresh);
    };
}

test('manual refresh starts only on request and ignores duplicate pulls before rerender', async () => {
    let complete, calls = 0;
    const render = pullRefreshHarness(() => {
        calls++;
        return new Promise(resolve => { complete = resolve; });
    });
    const initial = render();
    assert.equal(initial.refreshing, false);
    assert.equal(render().refreshing, false);
    assert.equal(calls, 0, 'Rendering does not start a request');
    const pending = initial.onRefresh();
    await initial.onRefresh();
    assert.equal(calls, 1);
    assert.equal(render().refreshing, true);
    complete();
    await pending;
    assert.equal(render().refreshing, false);
});

test('a rejected manual refresh clears its spinner and allows retry', async () => {
    let calls = 0;
    const render = pullRefreshHarness(async () => {
        if (++calls === 1) throw new Error('offline');
    });
    await assert.rejects(render().onRefresh(), /offline/);
    assert.equal(render().refreshing, false);
    await render().onRefresh();
    assert.equal(calls, 2);
    assert.equal(render().refreshing, false);
});

test('a refresh covering multiple queries waits for the slowest query', async () => {
    let finishFirst, finishSecond;
    const render = pullRefreshHarness(() => Promise.all([
        new Promise(resolve => { finishFirst = resolve; }),
        new Promise(resolve => { finishSecond = resolve; }),
    ]));
    const pending = render().onRefresh();
    finishFirst();
    await flush();
    assert.equal(render().refreshing, true);
    finishSecond();
    await pending;
    assert.equal(render().refreshing, false);
});

test('session selector scroll updates its cue without rerendering the session detail', () => {
    let stateUpdates = 0;
    const { LessonSessionsView } = load('src/components/golf/LessonSessionsView.tsx', {
        react: {
            ...React,
            useState: initial => [initial, () => { stateUpdates++; }],
            useRef: initial => ({ current: initial }),
            useLayoutEffect() {},
        },
        '@/design-system/components/NativeText': { NativeText: 'NativeText' },
        '@/design-system': { Badge: 'Badge', EmptyState: 'EmptyState' },
        '@/design-system/utils/theme': { useTheme: () => ({ colors: {} }) },
        '@/design-system/utils/typography': { typography: { subtitle: {} } },
        '@/utils/format-enum': {}, '@/utils/member-lesson': {},
        '@/utils/status-tone': {}, '@/utils/time-helper': {},
        './SessionResourceSection': { SessionResourceSection: 'SessionResourceSection' },
        'react-i18next': { useTranslation: () => ({ t: key => key }) },
        'react-native': { View: 'View', Platform: { OS: 'android' } },
        'react-native-reanimated': {
            __esModule: true,
            default: { View: 'AnimatedView', FlatList: 'AnimatedFlatList' },
            useSharedValue: initial => {
                let value = initial;
                return { get: () => value, set: next => { value = next; } };
            },
            useAnimatedScrollHandler: handler => handler,
            useAnimatedStyle: style => style,
        },
    });
    const tree = LessonSessionsView({ sessions: [{ id: 1, resources: [] }] });
    const selector = tree.props.children[0];
    const switcher = selector.type({ ...selector.props, contentWidth: 300, containerWidth: 100 });
    const [list, cue] = switcher.props.children[1].props.children;
    assert.equal(cue.props.style().opacity, 1);
    list.props.onScroll({ contentOffset: { x: 190 } });
    assert.equal(cue.props.style().opacity, 0);
    list.props.onScroll({ contentOffset: { x: 20 } });
    assert.equal(cue.props.style().opacity, 1);
    assert.equal(stateUpdates, 0, 'Scroll frames stay off the React render path');
});

test('refresh controls do not use background query flags as pull indicators', () => {
    const violations = [];
    function scan(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const file = path.join(directory, entry.name);
            if (entry.isDirectory()) { scan(file); continue; }
            if (!file.endsWith('.tsx')) continue;
            const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
            function visit(node) {
                if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
                    node.tagName.getText(source) === 'RefreshControl') {
                    const prop = node.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.text === 'refreshing');
                    if (prop?.initializer && /\bis(?:Fetching|Refetching)\w*\b/.test(prop.initializer.getText(source))) {
                        violations.push(path.relative(process.cwd(), file));
                    }
                }
                ts.forEachChild(node, visit);
            }
            visit(source);
        }
    }
    scan(path.join(__dirname, '../../src'));
    assert.deepEqual(violations, []);
});

for (const file of ['src/app/(app)/select-time.tsx', 'src/app/(app)/select-lesson-slot.tsx']) {
    test(`${file}: failed refresh keeps cached slots visible, initial failure still offers retry`, () => {
        const h = hooks();
        const result = {
            data: { data: [{ id: 1, startTime: '2026-01-05T10:00:00', baySlots: [{}] }] },
            isLoading: false, isError: true, isRefetching: false,
        };
        const { default: Screen } = load(file, {
            react: h.react,
            '@/lib/hook/usePullToRefresh': { usePullToRefresh: () => ({ refreshing: false, onRefresh() {} }) },
            '@/design-system/components/NativeText': { NativeText: 'NativeText' },
            '@/components/golf/booking/BookingStepHeader': { BookingStepHeader: 'BookingStepHeader' },
            '@/components/golf/booking/AvailabilityConflictNotice': { AvailabilityConflictNotice: 'AvailabilityConflictNotice' },
            '@/design-system': { Screen: 'Screen', EmptyState: 'EmptyState', ErrorState: 'ErrorState', Skeleton: 'Skeleton' },
            '@/design-system/utils/theme': { useTheme: () => ({ colors: {} }) },
            '@/design-system/utils/ticket-type': { formatTicketTypeLabel: () => 'Lesson' },
            '@/lib/hook/useNavigationLock': { useNavigationLock: () => ({ isLocked: false }) },
            '@/lib/hook/useReservation': { useMemberBaySlotGroups: () => result, useMemberTicketLessonSlots: () => result },
            '@/utils/bay-slot': { getBaySlotAvailability: () => ({ isDisabled: false }) },
            '@/utils/lesson-slot': {},
            '@/utils/time-helper': { formatDateValue: () => 'Jan 5' },
            'expo-router': {
                useRouter: () => ({}),
                useLocalSearchParams: () => ({ date: '2026-01-05', ticketId: '1' }),
            },
            'expo-router/stack': { Stack: { Screen: 'StackScreen' } },
            'lucide-react-native': {},
            'react-i18next': { useTranslation: () => ({ t: key => key }) },
            'react-native': { View: 'View', FlatList: 'FlatList', RefreshControl: 'RefreshControl' },
        });
        function elements() {
            const found = [];
            function walk(element) {
                if (Array.isArray(element)) return element.forEach(walk);
                if (!React.isValidElement(element)) return;
                found.push(element);
                walk(element.props.children);
            }
            walk(Screen());
            return found;
        }
        let tree = elements();
        assert.equal(tree.find(element => element.type === 'FlatList').props.data.length, 1);
        assert.equal(tree.some(element => element.type === 'ErrorState'), false);
        result.data = undefined;
        tree = elements();
        assert.equal(tree.some(element => element.type === 'FlatList'), false);
        assert.equal(tree.some(element => element.type === 'ErrorState'), true);
    });
}

test('a delayed network snapshot cannot overwrite a newer event or update after unmount', async () => {
    const h = hooks();
    let resolveSnapshot, listener, removed = false;
    const { useNetworkStatus } = load('src/lib/hook/useNetworkStatus.ts', {
        react: h.react,
        'expo-network': {
            getNetworkStateAsync: () => new Promise(resolve => { resolveSnapshot = resolve; }),
            addNetworkStateListener: callback => { listener = callback; return { remove() { removed = true; } }; },
        },
    });
    useNetworkStatus();
    const cleanup = h.effects[0]();
    listener({ isConnected: true });
    resolveSnapshot({ isConnected: false });
    await flush();
    assert.equal(h.states[0], true);
    cleanup();
    listener({ isConnected: false });
    assert.equal(h.states[0], true);
    assert.equal(removed, true);
});

test('failed network lookup stays unknown and recovers on a connection event', async () => {
    const h = hooks();
    let listener;
    load('src/lib/hook/useNetworkStatus.ts', {
        react: h.react,
        'expo-network': {
            getNetworkStateAsync: async () => { throw new Error('native lookup failed'); },
            addNetworkStateListener: callback => { listener = callback; return { remove() {} }; },
        },
    }).useNetworkStatus();
    h.effects[0]();
    await flush();
    assert.equal(h.states[0], null);
    listener({ isConnected: false });
    assert.equal(h.states[0], false);
});

test('storage failures allow onboarding and theme bootstrap to finish', async () => {
    const storage = { getItem: async () => { throw new Error('storage unavailable'); } };
    for (const [file, provider, readyIndex, extraMocks] of [
        ['src/lib/welcome/welcome-context.tsx', 'WelcomeProvider', 0, {}],
        ['src/design-system/utils/theme.ts', 'ThemeProvider', 2, {
            'expo-system-ui': { setBackgroundColorAsync: async () => {} },
            'react-native': { Appearance: { setColorScheme() {} }, useColorScheme: () => 'light', useWindowDimensions: () => ({ fontScale: 1 }) },
        }],
    ]) {
        const h = hooks();
        load(file, { react: h.react, '@react-native-async-storage/async-storage': storage, ...extraMocks },
            { process: { env: { EXPO_OS: 'ios' } } })[provider]({ children: null });
        h.effects.forEach(effect => effect());
        await flush();
        assert.equal(h.states[readyIndex], true, provider);
    }
});

test('each authenticated layout gets a fresh cache; refresh failures keep cached data and notify', async () => {
    const h = hooks(), toasts = [];
    const AppLayout = load('src/app/(app)/_layout.tsx', {
        react: h.react,
        '@tanstack/react-query': query,
        '@/design-system': { useThemeColors: () => ({}) },
        '@/i18n': { t: key => key },
        '@/lib/toast/toast': { showAppToast: toast => toasts.push(toast) },
        'expo-router': { Stack: Object.assign(() => null, { Screen: () => null }) },
        'react-i18next': { useTranslation: () => ({ t: key => key }) },
    }).default;
    AppLayout();
    const firstClient = h.states[0];
    firstClient.setQueryData(['member', 'profile'], { id: 'first-member' });
    AppLayout(); // New mount, rather than a re-render (the harness allocates new state).
    const secondClient = h.states[1];
    assert.equal(secondClient.getQueryData(['member', 'profile']), undefined);
    await assert.rejects(firstClient.fetchQuery({
        queryKey: ['member', 'profile'], staleTime: 0, retry: false,
        queryFn: async () => { throw new Error('offline'); },
    }));
    assert.equal(firstClient.getQueryData(['member', 'profile']).id, 'first-member');
    assert.equal(toasts.length, 1);
    await assert.rejects(secondClient.fetchQuery({
        queryKey: ['member', 'profile'], retry: false,
        queryFn: async () => { throw new Error('offline'); },
    }));
    assert.equal(toasts.length, 1, 'Initial errors belong to the screen error state');
    firstClient.clear();
    secondClient.clear();
});

test('API cancellation aborts authentication and never dispatches the protected request', async () => {
    const controller = new AbortController();
    let authCalls = 0, fetchCalls = 0, authSignal;
    const { apiClient } = load('src/lib/client/api-client.ts', {
        '../auth-client': { authClient: { $fetch: async (_path, options) => {
            authCalls++;
            authSignal = options.signal;
            controller.abort();
            return { data: { token: 'test-token' } };
        } } },
        '../config/env': { env: { apiBaseUrl: 'https://example.invalid' } },
        '../../i18n': {}, '../api-response/api-response': {}, '../update/app-update': {},
        './app-request-headers': {},
    }, { fetch: async () => { fetchCalls++; }, Headers });
    await assert.rejects(apiClient('/member/me', { signal: controller.signal }), { name: 'AbortError' });
    assert.equal(authSignal, controller.signal);
    assert.equal(authCalls, 1);
    assert.equal(fetchCalls, 0);
    await assert.rejects(apiClient('/member/me', { signal: controller.signal }), { name: 'AbortError' });
    assert.equal(authCalls, 1, 'Already cancelled queries do not request a token');
});

test('Android day-number controls forward disabled state to the native switch', () => {
    const { DayNumbersToggle } = load('src/components/golf/activity/DayNumbersToggle.android.tsx', {
        '@/design-system': { useTheme: () => ({ colors: {}, resolvedScheme: 'light' }) },
        '@expo/ui': { Host: 'Host' },
        '@expo/ui/jetpack-compose': { Switch: 'Switch' },
    });
    for (const disabled of [true, false]) {
        const element = DayNumbersToggle({ value: true, label: 'Day numbers', onValueChange() {}, disabled });
        assert.equal(element.props.children.props.enabled, !disabled);
    }
});

test('preference sheets block duplicate saves and dismissal, and stay open when saving fails', async () => {
    for (const fails of [false, true]) {
        const h = hooks();
        let finish, saves = 0;
        const { ProfilePreferenceRow } = load('src/components/golf/profile/ProfilePreferenceRow.tsx', {
            react: h.react,
            '@/design-system/components/NativeText': { NativeText: 'NativeText' },
            '@/design-system': { InlineState: 'InlineState', ListRow: 'ListRow', useTheme: () => ({ colors: {}, fontScale: 1 }) },
            '@/design-system/utils/cn': { cn: (...values) => values.join(' ') },
            '@/design-system/utils/native-button-styles': { getNativeButtonStyle() {}, getNativeButtonTextStyle() {} },
            '@/design-system/utils/typography': { typography: { h3: {}, muted: {} } },
            '@expo/ui': { BottomSheet: 'BottomSheet', Button: 'Button', Host: 'Host', RNHostView: 'RNHostView', Text: 'Text' },
            '@expo/ui/jetpack-compose/modifiers': { defaultMinSize() {}, fillMaxWidth() {} },
            '@expo/ui/swift-ui/modifiers': { frame() {}, interactiveDismissDisabled() {} },
            'lucide-react-native': { Check: 'Check' },
            'react-i18next': { useTranslation: () => ({ t: key => key }) },
            'react-native': { ActivityIndicator: 'ActivityIndicator', ScrollView: 'ScrollView', View: 'View', useWindowDimensions: () => ({ height: 800 }) },
        }, { process: { env: { EXPO_OS: 'ios' } } });
        const tree = ProfilePreferenceRow({ title: 'Theme', accessibilityLabel: 'Theme', value: 'light', disabled: false,
            options: [{ value: 'dark', label: 'Dark', description: 'Dark mode' }],
            onChange: () => { saves++; return new Promise((resolve, reject) => { finish = () => fails ? reject(new Error('save failed')) : resolve(); }); },
        });
        const elements = [];
        function walk(element) {
            if (Array.isArray(element)) return element.forEach(walk);
            if (!React.isValidElement(element)) return;
            elements.push(element);
            walk(element.props.children);
        }
        walk(tree);
        const rows = elements.filter(element => element.type === 'ListRow');
        const sheet = elements.find(element => element.type === 'BottomSheet');
        rows[0].props.onPress();
        rows[1].props.onPress();
        rows[1].props.onPress();
        sheet.props.onDismiss();
        assert.equal(saves, 1);
        assert.equal(h.states[0], true, 'Keep sheet open while saving');
        finish();
        await flush();
        assert.equal(h.states[0], fails, 'Only successful saves close the sheet');
        assert.equal(h.states[1], null);
        assert.equal(h.states[2], fails ? 'save failed' : null, 'Errors stay inside the native sheet');
    }
});

test('weekly scrolling mounts lightweight labels with scaled text, bounded batches and accessible week actions', () => {
    const data = load('src/design-system/components/charts/activity-chart-data.ts', {
        '../../utils/color': {},
    });
    for (const language of ['en', 'ko', 'ja', 'zh', 'km']) {
        const h = hooks();
        let pressed, layout;
        const typography = { subtext: { fontSize: 12.25, lineHeight: 17.5 } };
        const { WeeklySummary } = load('src/design-system/components/charts/weekly-summary.tsx', {
            react: { ...h.react, useState: initial => h.react.useState(initial === 0 ? 390 : initial) },
            'react-native': { FlatList: 'FlatList', Pressable: 'Pressable', View: 'View', Text: 'RNText' },
            '@expo/ui': { Host: 'Host', Text: 'NativeText' },
            '../../utils/cn': { cn: (...values) => values.join(' ') },
            '../../utils/theme': { useTheme: () => ({ colors: { mutedForeground: '#888' }, fontScale: 2 }) },
            '../../utils/typography': { typography },
            './activity-chart-data': data,
            './chart-text-styles': { chartLeadingModifiers: [], chartCenterModifiers: [], getChartTextStyles: () => ({ title: {}, muted: {} }) },
            'react-i18next': { useTranslation: () => ({ i18n: { language }, t: (key, values) => values?.date ?? key }) },
            './activity-heatmap': { ActivityStatusLegend: 'Legend' },
        });
        const tree = WeeklySummary({
            values: [{ weekStart: '2026-01-05', total: 3 }],
            startDate: new Date(2026, 0, 1), endDate: new Date(2026, 11, 31),
            initialScrollToEnd: true, unitLabel: 'reservations',
            onWeekPress: (date, total) => { pressed = { date, total }; },
            onLayout: event => { layout = event; },
        });
        const elements = [];
        function walk(element) {
            if (Array.isArray(element)) return element.forEach(walk);
            if (!React.isValidElement(element)) return;
            elements.push(element);
            walk(element.props.children);
        }
        walk(tree);
        const list = elements.find(element => element.type === 'FlatList');
        assert.equal(list.props.windowSize, 5);
        assert.ok(list.props.initialNumToRender * list.props.getItemLayout(null, 0).length >= 350);
        assert.ok(list.props.maxToRenderPerBatch < 10);
        assert.equal(list.props.initialScrollIndex, list.props.data.length - 1);
        const week = list.props.data.find(week => week.total === 3);
        const item = list.props.renderItem({ item: week });
        elements.length = 0;
        walk(item.type.type(item.props)); // React.memo's wrapped component.
        assert.equal(elements.filter(element => element.type === 'Host').length, 0);
        const label = elements.find(element => element.type === 'RNText');
        assert.equal(label.props.children, week.label);
        assert.equal(label.props.style.fontSize, typography.subtext.fontSize, 'RN applies accessible scaling once');
        assert.notEqual(label.props.allowFontScaling, false);
        const bar = elements.find(element => element.type === 'Pressable');
        assert.ok(bar.props.accessibilityLabel.includes(new Intl.DateTimeFormat(language, {
            year: 'numeric', month: 'short', day: 'numeric',
        }).format(week.weekStart)));
        bar.props.onPress();
        assert.equal(pressed.total, 3);
        assert.equal(pressed.date.getTime(), week.weekStart.getTime());
        const event = { nativeEvent: { layout: { width: 430 } } };
        tree.props.onLayout(event);
        assert.equal(layout, event, 'Caller layout handlers do not override chart measurement');
    }
});


for (const reservationType of [null, 'all', 'bay', 'private', 'group', 'program']) {
    test(`${reservationType ? `reservations/${reservationType}` : 'notifications'}: background updates and overlapping refresh/pagination stay separate`, async () => {
        const values = [];
        let cursor = 0, completeRefresh, refreshes = 0, nextPages = 0;
        const result = {
            data: { items: [{ id: 1, isRead: true }] }, isLoading: false, isError: false,
            isFetching: true, isRefetching: true, isFetchingNextPage: false, hasNextPage: true,
            refetch: options => {
                assert.equal(options.cancelRefetch, false);
                refreshes++;
                return new Promise(resolve => { completeRefresh = resolve; });
            },
            fetchNextPage: options => { assert.equal(options.cancelRefetch, false); nextPages++; },
        };
        const mutation = () => ({ mutate() {}, mutateAsync: async () => {}, isPending: false });
        const scene = load(reservationType
            ? 'src/components/golf/reservation/ReservationTabScene.tsx'
            : 'src/app/(app)/(tabs)/notice/index.tsx', {
            react: {
                ...React,
                useState(initial) {
                    const index = cursor++;
                    if (!(index in values)) values[index] = initial;
                    return [values[index], value => { values[index] = value; }];
                },
                useRef(initial) {
                    const index = cursor++;
                    if (!(index in values)) values[index] = { current: initial };
                    return values[index];
                },
                useCallback: fn => fn, useMemo: fn => fn(), useLayoutEffect() {},
            },
            '@/design-system/components/NativeText': { NativeText: 'NativeText' },
            '@/components/golf/ReservationCard': 'ReservationCard',
            '@/design-system/utils/native-button-styles': { getNativeButtonStyle: () => ({}) },
            '@/design-system/utils/theme': { useTheme: () => ({ colors: {}, fontScale: 1 }) },
            '@/design-system/utils/typography': { typography: { h3: {}, muted: {}, label: {} } },
            '@/design-system': { Screen: 'Screen', CircleLoader: 'CircleLoader', EmptyState: 'EmptyState', ErrorState: 'ErrorState' },
            '@/lib/hook/shared/useNotification': {
                useGetNotifications: () => result, useMarkAsRead: mutation, useMarkAllAsRead: mutation,
                useDeleteNotification: mutation, useDeleteAllNotifications: mutation,
            },
            '@/lib/hook/useLessonLog': {},
            '@/lib/hook/useReservation': {
                useMemberReservations: type => { assert.equal(type, reservationType); return result; },
            },
            '@/lib/hook/useNetworkStatus': { useNetworkStatus: () => ({ isOnline: true }) },
            '@/lib/hook/useNavigationLock': { useNavigationLock: () => ({ isLocked: false }) },
            '@/utils/relative-time': {},
            '@expo/ui': { BottomSheet: 'BottomSheet', Button: 'Button', Column: 'Column', Row: 'Row', Text: 'Text', Spacer: 'Spacer' },
            '@expo/ui/jetpack-compose/modifiers': { fillMaxWidth() {}, defaultMinSize() {} },
            '@expo/ui/swift-ui/modifiers': {},
            '@tanstack/react-query': { useQueryClient: () => ({}) },
            'expo-router': { useNavigation: () => ({}), useRouter: () => ({}) },
            'lucide-react-native': {},
            'react-i18next': { useTranslation: () => ({ t: key => key }) },
            'react-native': { View: 'View' },
            'react-native-gesture-handler': { FlatList: 'FlatList', RefreshControl: 'RefreshControl' },
            'react-native-gesture-handler/ReanimatedSwipeable': 'Swipeable',
        }, { process: { env: { EXPO_OS: 'android' } } });
        function list() {
            cursor = 0;
            if (!reservationType) return scene.default().props.children[1].props.children;
            const tree = scene.ReservationTabScene({ type: reservationType });
            return tree.type === 'FlatList' ? tree : tree.type(tree.props);
        }
        assert.equal(list().props.refreshControl.props.refreshing, false, 'Background refetch is not a user pull');
        list().props.refreshControl.props.onRefresh();
        assert.equal(refreshes, 0, 'A pull cannot cancel a request already in flight');
        result.isFetching = result.isRefetching = false;
        list().props.onEndReached();
        assert.equal(nextPages, 1);
        result.isFetching = result.isFetchingNextPage = true;
        assert.equal(list().props.refreshControl.props.refreshing, false, 'Pagination uses the footer spinner');
        result.isFetching = result.isFetchingNextPage = false;
        const control = list().props.refreshControl;
        control.props.onRefresh();
        control.props.onRefresh();
        assert.equal(refreshes, 1, 'Repeated native events share one refresh');
        assert.equal(list().props.refreshControl.props.refreshing, true);
        list().props.onEndReached();
        assert.equal(nextPages, 1, 'Pagination cannot interrupt a manual refresh before the query rerenders');
        completeRefresh({ isError: true });
        await flush();
        assert.equal(list().props.refreshControl.props.refreshing, false, 'A failed refresh clears the indicator');
        list().props.refreshControl.props.onRefresh();
        assert.equal(refreshes, 2, 'Refresh can be retried after failure');
        completeRefresh({});
        await flush();
        assert.equal(list().props.refreshControl.props.refreshing, false);
        if (reservationType) {
            for (const isError of [false, true]) {
                result.data = isError ? undefined : { items: [] };
                result.isError = isError;
                result.isFetching = result.isRefetching = true;
                assert.equal(list().props.refreshControl.props.refreshing, false,
                    'Empty/error states also keep background fetching separate');
                result.isFetching = result.isRefetching = false;
                list().props.refreshControl.props.onRefresh();
                assert.equal(list().props.refreshControl.props.refreshing, true);
                completeRefresh({});
                await flush();
                assert.equal(list().props.refreshControl.props.refreshing, false);
            }
        }
    });
}
