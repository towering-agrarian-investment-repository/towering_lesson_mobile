const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const query = require("@tanstack/react-query");

// Modules imported by the code under test are mocked explicitly so each test
// states the boundary it depends on. Missing mocks fail loudly rather than
// silently returning a stub, which keeps assertions meaningful when a target
// file starts importing something new.
function load(relativePath, mocks, globals = {}) {
    const filename = path.resolve(__dirname, "../..", relativePath);
    const exports = {};
    vm.runInNewContext(
        ts.transpileModule(fs.readFileSync(filename, "utf8"), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
        }).outputText,
        {
            exports,
            Error,
            process: { env: { EXPO_OS: "ios" } },
            ...globals,
            require(id) {
                if (id in mocks) return mocks[id];
                if (id === "react/jsx-runtime") return require(id);
                throw new Error(`Missing test dependency: ${id}`);
            },
        },
        { filename },
    );
    return exports;
}

function hooks() {
    const states = [],
        effects = [];
    return {
        states,
        effects,
        react: {
            ...React,
            useState(initial) {
                const index = states.push(typeof initial === "function" ? initial() : initial) - 1;
                return [
                    states[index],
                    (value) => {
                        states[index] = value;
                    },
                ];
            },
            useEffect(effect) {
                effects.push(effect);
            },
            useMemo: (callback) => callback(),
            useCallback: (callback) => callback,
            useRef: (value) => ({ current: value }),
        },
    };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));

function findElement(tree, predicate) {
    if (Array.isArray(tree)) {
        for (const child of tree) {
            const match = findElement(child, predicate);
            if (match) return match;
        }
        return null;
    }
    if (!React.isValidElement(tree)) return null;
    return predicate(tree) ? tree : findElement(tree.props.children, predicate);
}

function pullRefreshHarness(refresh) {
    const values = [];
    let cursor = 0;
    const { usePullToRefresh } = load("src/lib/hook/usePullToRefresh.ts", {
        react: {
            useState(initial) {
                const index = cursor++;
                if (!(index in values)) values[index] = initial;
                return [
                    values[index],
                    (value) => {
                        values[index] = value;
                    },
                ];
            },
            useRef(initial) {
                const index = cursor++;
                if (!(index in values)) values[index] = { current: initial };
                return values[index];
            },
        },
        "@/design-system/utils/haptics": { triggerImpactHaptic() {} },
        "expo-haptics": { ImpactFeedbackStyle: { Light: "light" } },
    });
    return () => {
        cursor = 0;
        return usePullToRefresh(refresh);
    };
}

test("manual refresh starts only on request and ignores duplicate pulls before rerender", async () => {
    let complete,
        calls = 0;
    const render = pullRefreshHarness(() => {
        calls++;
        return new Promise((resolve) => {
            complete = resolve;
        });
    });
    const initial = render();
    assert.equal(initial.refreshing, false);
    assert.equal(render().refreshing, false);
    assert.equal(calls, 0, "Rendering does not start a request");
    const pending = initial.onRefresh();
    await initial.onRefresh();
    assert.equal(calls, 1);
    assert.equal(render().refreshing, true);
    complete();
    await pending;
    assert.equal(render().refreshing, false);
});

test("a rejected manual refresh clears its spinner and allows retry", async () => {
    let calls = 0;
    const render = pullRefreshHarness(async () => {
        if (++calls === 1) throw new Error("offline");
    });
    await assert.rejects(render().onRefresh(), /offline/);
    assert.equal(render().refreshing, false);
    await render().onRefresh();
    assert.equal(calls, 2);
    assert.equal(render().refreshing, false);
});

test("a refresh covering multiple queries waits for the slowest query", async () => {
    let finishFirst, finishSecond;
    const render = pullRefreshHarness(() =>
        Promise.all([
            new Promise((resolve) => {
                finishFirst = resolve;
            }),
            new Promise((resolve) => {
                finishSecond = resolve;
            }),
        ]),
    );
    const pending = render().onRefresh();
    finishFirst();
    await flush();
    assert.equal(render().refreshing, true);
    finishSecond();
    await pending;
    assert.equal(render().refreshing, false);
});

test("refresh controls do not use background query flags as pull indicators", () => {
    const violations = [];
    function scan(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const file = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                scan(file);
                continue;
            }
            if (!file.endsWith(".tsx")) continue;
            const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
            function visit(node) {
                if (
                    (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
                    node.tagName.getText(source) === "RefreshControl"
                ) {
                    const prop = node.attributes.properties.find(
                        (p) => ts.isJsxAttribute(p) && p.name.text === "refreshing",
                    );
                    if (
                        prop?.initializer &&
                        /\bis(?:Fetching|Refetching)\w*\b/.test(prop.initializer.getText(source))
                    ) {
                        violations.push(path.relative(process.cwd(), file));
                    }
                }
                ts.forEachChild(node, visit);
            }
            visit(source);
        }
    }
    scan(path.join(__dirname, "../../src"));
    assert.deepEqual(violations, []);
});

for (const file of ["src/app/(app)/select-time.tsx", "src/app/(app)/select-lesson-slot.tsx"]) {
    test(`${file}: failed refresh keeps cached slots visible, initial failure still offers retry`, () => {
        const h = hooks();
        const result = {
            data: {
                data: [
                    {
                        id: 1,
                        startTime: "2026-01-05T10:00:00",
                        endTime: "2026-01-05T11:00:00",
                        totalReservableBaySlots: 2,
                    },
                ],
            },
            isLoading: false,
            isError: true,
            isRefetching: false,
        };
        const { default: Screen } = load(file, {
            react: h.react,
            "@/lib/hook/usePullToRefresh": { usePullToRefresh: () => ({ refreshing: false, onRefresh() {} }) },
            "@/lib/hook/useMinuteClock": { useMinuteClock: () => Date.now() },
            "@/lib/hook/useUser": { useGetMemberProfile: () => ({ data: undefined }) },
            "@/design-system/components/AppText": { AppText: "AppText" },
            "@/components/golf/booking/BookingStepHeader": { BookingStepHeader: "BookingStepHeader" },
            "@/components/golf/booking/AvailabilityConflictNotice": {
                AvailabilityConflictNotice: "AvailabilityConflictNotice",
            },
            "@/design-system": {
                Screen: "Screen",
                EmptyState: "EmptyState",
                ErrorState: "ErrorState",
                Skeleton: "Skeleton",
            },
            "@/design-system/utils/theme": { useTheme: () => ({ colors: {} }) },
            "@/design-system/utils/ticket-type": { formatTicketTypeLabel: () => "Lesson" },
            "@/lib/hook/useNavigationLock": { useNavigationLock: () => ({ isLocked: false }) },
            "@/lib/hook/useReservation": {
                useMemberBaySlotGroups: () => result,
                useMemberTicketLessonSlots: () => result,
            },
            "@/utils/lesson-slot": {},
            "@/utils/time-helper": {
                formatDateForAPI: (value) => String(value).slice(0, 10),
                formatDateShort: () => "Jan 5",
                formatDateValue: () => "Jan 5",
                formatTimeRange: () => "10:00 - 11:00",
            },
            "expo-router": {
                useRouter: () => ({}),
                useLocalSearchParams: () => ({ date: "2026-01-05", ticketId: "1" }),
            },
            "expo-router/stack": { Stack: { Screen: "StackScreen" } },
            "lucide-react-native": {},
            "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
            "react-native": { View: "View", FlatList: "FlatList", RefreshControl: "RefreshControl" },
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
        assert.equal(tree.find((element) => element.type === "FlatList").props.data.length, 1);
        assert.equal(
            tree.some((element) => element.type === "ErrorState"),
            false,
        );
        result.data = undefined;
        tree = elements();
        assert.equal(
            tree.some((element) => element.type === "FlatList"),
            false,
        );
        assert.equal(
            tree.some((element) => element.type === "ErrorState"),
            true,
        );
    });
}

test("storage failures allow onboarding and theme bootstrap to finish", async () => {
    const storage = {
        getItem: async () => {
            throw new Error("storage unavailable");
        },
    };
    for (const [file, provider, readyIndex, extraMocks] of [
        ["src/lib/welcome/welcome-context.tsx", "WelcomeProvider", 0, {}],
        [
            "src/design-system/utils/theme.ts",
            "ThemeProvider",
            2,
            {
                "expo-system-ui": { setBackgroundColorAsync: async () => {} },
                "react-native": {
                    Appearance: { setColorScheme() {} },
                    useColorScheme: () => "light",
                    useWindowDimensions: () => ({ fontScale: 1 }),
                },
            },
        ],
    ]) {
        const h = hooks();
        load(
            file,
            { react: h.react, "@react-native-async-storage/async-storage": storage, ...extraMocks },
            { process: { env: { EXPO_OS: "ios" } } },
        )[provider]({ children: null });
        h.effects.forEach((effect) => effect());
        await flush();
        assert.equal(h.states[readyIndex], true, provider);
    }
});

function loadAuthenticatedLayout(h, toasts = []) {
    return load("src/app/(app)/_layout.tsx", {
        react: h.react,
        "@tanstack/react-query": query,
        "@/design-system": { useThemeColors: () => ({}), getStackHeaderOptions: () => ({}) },
        "@/design-system/components/AppToast": { showAppToast: (toast) => toasts.push(toast) },
        "@/i18n": { t: (key) => key },
        "@/lib/auth-session": { takeInterruptedHref: () => null, verifyMemberSession: async () => true },
        "expo-network": {
            getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
            addNetworkStateListener: () => ({ remove() {} }),
        },
        "expo-notifications": {
            addNotificationResponseReceivedListener: () => ({ remove() {} }),
            getLastNotificationResponseAsync: async () => null,
            getPermissionsAsync: async () => ({ status: "granted" }),
        },
        "expo-router": {
            Stack: Object.assign(() => null, { Screen: () => null }),
            useRouter: () => ({ replace() {}, push() {} }),
            usePathname: () => "/home",
            useGlobalSearchParams: () => ({}),
        },
        "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
        "react-native": {
            AppState: {
                currentState: "active",
                addEventListener: () => ({ remove() {} }),
            },
        },
        "react-native-reanimated": { useReducedMotion: () => false },
    }).default;
}

test("each authenticated layout gets a fresh cache; refresh failures keep cached data and notify", async () => {
    const h = hooks(),
        toasts = [];
    const AppLayout = loadAuthenticatedLayout(h, toasts);
    AppLayout();
    const firstClient = h.states[0];
    firstClient.setQueryData(["member", "profile"], { id: "first-member" });
    AppLayout(); // New mount, rather than a re-render (the harness allocates new state).
    const secondClient = h.states[1];
    assert.equal(secondClient.getQueryData(["member", "profile"]), undefined);
    await assert.rejects(
        firstClient.fetchQuery({
            queryKey: ["member", "profile"],
            staleTime: 0,
            retry: false,
            queryFn: async () => {
                throw new Error("offline");
            },
        }),
    );
    assert.equal(firstClient.getQueryData(["member", "profile"]).id, "first-member");
    assert.equal(toasts.length, 1);
    await assert.rejects(
        secondClient.fetchQuery({
            queryKey: ["member", "profile"],
            retry: false,
            queryFn: async () => {
                throw new Error("offline");
            },
        }),
    );
    assert.equal(toasts.length, 1, "Initial errors belong to the screen error state");
    firstClient.clear();
    secondClient.clear();
});

test("offline notification deletion rolls back immediately and can be retried", { timeout: 2000 }, async () => {
    const h = hooks();
    loadAuthenticatedLayout(h)();
    const client = h.states[0];
    const listKey = ["notifications", "all"];
    const countKey = ["notifications", "unread-count"];
    const original = { pages: [{ data: { items: [{ id: 7, isRead: false }] } }], pageParams: [null] };
    const errors = [];
    let requests = 0;
    class UserFacingError extends Error {}
    const { apiClient } = load(
        "src/lib/client/api-client.ts",
        {
            "@tanstack/react-query": query,
            "../auth-session": {},
            "../config/env": { env: { apiBaseUrl: "https://example.invalid" } },
            "../../i18n": { t: (key) => key },
            "../api-response/api-response": { UserFacingError },
            "../update/app-update": {},
            "./app-request-headers": { getAppRequestHeaders: () => ({}) },
            "./jwt-token": { getJwtToken: async () => ({ value: "token" }) },
        },
        {
            Headers,
            AbortController,
            setTimeout,
            clearTimeout,
            fetch: async (_url, options) => {
                assert.equal(options.method, "DELETE");
                requests++;
                return new Response(null, { status: 204 });
            },
        },
    );
    const notificationService = load("src/service/shared/notification-service.ts", {
        "@/lib/client/api-client": { apiClient },
    });
    const { useDeleteNotification } = load("src/lib/hook/shared/useNotification.ts", {
        "@/lib/api-response/api-response": { responseError: (error) => errors.push(error.message) },
        "@/service/shared/notification-service": notificationService,
        "@tanstack/react-query": {
            ...query,
            useQueryClient: () => client,
            useMutation: (options) => client.getMutationCache().build(client, options),
        },
    });

    const wasOnline = query.onlineManager.isOnline();
    try {
        client.setQueryData(listKey, original);
        client.setQueryData(countKey, { data: 1 });
        query.onlineManager.setOnline(false);
        const mutation = useDeleteNotification();
        await assert.rejects(mutation.execute(7), { message: "common.offlineMessage" });
        assert.equal(mutation.state.isPaused, false);
        assert.equal(requests, 0);
        assert.deepEqual(client.getQueryData(listKey), original);
        assert.equal(client.getQueryData(countKey).data, 1);
        assert.deepEqual(errors, ["common.offlineMessage"]);

        query.onlineManager.setOnline(true);
        await useDeleteNotification().execute(7);
        assert.equal(requests, 1);
        assert.equal(client.getQueryData(listKey).pages[0].data.items.length, 0);
        assert.equal(client.getQueryData(countKey).data, 0);
    } finally {
        query.onlineManager.setOnline(wasOnline);
        client.clear();
    }
});

test("API cancellation aborts authentication and never dispatches the protected request", async () => {
    const controller = new AbortController();
    let authCalls = 0,
        fetchCalls = 0,
        authSignal;
    const { apiClient } = load(
        "src/lib/client/api-client.ts",
        {
            "@tanstack/react-query": query,
            "./jwt-token": {
                getJwtToken: (signal) => {
                    authCalls++;
                    authSignal = signal;
                    return Promise.resolve().then(() => {
                        controller.abort();
                        signal.throwIfAborted();
                    });
                },
                invalidateRejectedJwtToken() {},
                recoverRejectedJwtToken: async () => null,
            },
            "../auth-session": { verifyMemberSession: async () => true },
            "../config/env": { env: { apiBaseUrl: "https://example.invalid" } },
            "../../i18n": { t: (key) => key, resolvedLanguage: "en" },
            "../api-response/api-response": {
                API_ERROR_CODE: {},
                isApiError: () => false,
                isApiErrorResponse: () => false,
                UserFacingError: class extends Error {},
            },
            "../update/app-update": { notifyUpdateRequired() {} },
            "./app-request-headers": { getAppRequestHeaders: () => ({}) },
        },
        {
            fetch: async () => {
                fetchCalls++;
            },
            Headers,
            AbortController,
            setTimeout,
            clearTimeout,
        },
    );
    await assert.rejects(apiClient("/member/me", { signal: controller.signal }), { name: "AbortError" });
    assert.ok(authSignal, "Authentication receives the request cancellation signal");
    assert.equal(authSignal.aborted, true, "Caller cancellation reaches authentication");
    assert.equal(authCalls, 1);
    assert.equal(fetchCalls, 0);
    await assert.rejects(apiClient("/member/me", { signal: controller.signal }), { name: "AbortError" });
    assert.equal(authCalls, 1, "Already cancelled queries do not request a token");
});

test("preference sheets block duplicate saves and dismissal, and stay open when saving fails", async () => {
    for (const fails of [false, true]) {
        const h = hooks();
        let finish,
            saves = 0;
        const { ProfilePreferenceRow } = load(
            "src/components/golf/profile/ProfilePreferenceRow.tsx",
            {
                react: h.react,
                "@/design-system/components/AppText": { AppText: "AppText" },
                "@/design-system/components/PendingBottomSheet": { PendingBottomSheet: "PendingBottomSheet" },
                "@/design-system": {
                    ActionButton: "ActionButton",
                    ListRow: "ListRow",
                    useTheme: () => ({ colors: {} }),
                },
                "@/design-system/utils/cn": { cn: (...values) => values.join(" ") },
                "@expo/ui": { RNHostView: "RNHostView" },
                "lucide-react-native": { Check: "Check" },
                "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
                "react-native": {
                    ActivityIndicator: "ActivityIndicator",
                    ScrollView: "ScrollView",
                    View: "View",
                    useWindowDimensions: () => ({ height: 800 }),
                },
            },
            { process: { env: { EXPO_OS: "ios" } } },
        );
        const tree = ProfilePreferenceRow({
            title: "Theme",
            accessibilityLabel: "Theme",
            description: "Theme",
            value: "light",
            disabled: false,
            options: [{ value: "dark", label: "Dark", description: "Dark mode", icon: null }],
            onChange: () => {
                saves++;
                return new Promise((resolve, reject) => {
                    finish = () => (fails ? reject(new Error("save failed")) : resolve());
                });
            },
        });
        const elements = [];
        function walk(element) {
            if (Array.isArray(element)) return element.forEach(walk);
            if (!React.isValidElement(element)) return;
            elements.push(element);
            walk(element.props.children);
        }
        walk(tree);
        const rows = elements.filter((element) => element.type === "ListRow");
        const sheet = elements.find((element) => element.type === "PendingBottomSheet");
        rows[0].props.onPress();
        rows[1].props.onPress();
        rows[1].props.onPress();
        sheet.props.onDismiss();
        assert.equal(saves, 1, "Duplicate selections share one save");
        assert.equal(h.states[0], true, "Keep sheet open while saving");
        finish();
        await flush();
        assert.equal(h.states[0], fails, "Only successful saves close the sheet");
        assert.equal(h.states[1], null);
        assert.equal(h.states[2], fails ? "common.requestError" : null, "Errors stay inside the native sheet");
    }
});

test("activity keeps one initial skeleton and loads day details within the overview", () => {
    const today = "2026-11-25";
    const summary = { data: undefined };
    const activity = { data: undefined, isPending: true, fetchStatus: "fetching" };
    const day = { data: undefined, fetchStatus: "fetching" };
    let requestedDay;
    const { ActivityOverview } = load("src/components/golf/ActivityOverview.tsx", {
        react: hooks().react,
        "react-i18next": { useTranslation: () => ({ t: (key) => key, i18n: { language: "en" } }) },
        "react-native": { RefreshControl: "RefreshControl", ScrollView: "ScrollView", View: "View" },
        "expo-router": { useIsFocused: () => true, useRouter: () => ({}), useScrollToTop() {} },
        "lucide-react-native": { ChevronRight: "ChevronRight", Sparkles: "Sparkles" },
        "@tanstack/react-query": { useQueryClient: () => ({}) },
        "@/design-system": {
            ActivityHeatmap: "ActivityHeatmap",
            AnimatedPressable: "AnimatedPressable",
            CompactEmptyState: "CompactEmptyState",
            ErrorState: "ErrorState",
            Screen: "Screen",
            Skeleton: "Skeleton",
            cn: (...names) => names.filter(Boolean).join(" "),
            useTheme: () => ({ colors: {} }),
        },
        "@/design-system/components/AppText": { AppText: "AppText" },
        "@/design-system/components/charts/activity-chart-data": {
            formatActivityDate: (date) => date,
            toDateKey: (value) =>
                typeof value === "string"
                    ? value
                    : [value.getFullYear(), value.getMonth() + 1, value.getDate()]
                          .map((part) => String(part).padStart(2, "0"))
                          .join("-"),
        },
        "@/design-system/components/charts/activity-heatmap-layout": {},
        "@/components/golf/ActivitySharePreview": { ActivitySharePreview: "ActivitySharePreview" },
        "@/components/golf/ReservationCard": { default: "ReservationCard" },
        "@/components/golf/activity-display-data": { mapActivityDays: (days) => days },
        "@/lib/hook/useMemberActivity": {
            useMemberActivitySummary: () => summary,
            useMemberActivity: () => activity,
        },
        "@/lib/hook/useMinuteClock": { useDayClock: () => Date.parse(`${today}T12:00:00Z`) },
        "@/lib/hook/useNavigationLock": { useNavigationLock: () => ({}) },
        "@/lib/hook/usePullToRefresh": { usePullToRefresh: () => ({}) },
        "@/lib/hook/useReservation": {
            useMemberReservationsForDay: (date) => {
                requestedDay = date;
                return day;
            },
        },
        "@/lib/hook/useUser": { useGetMemberProfile: () => ({}) },
        "@/utils/time-helper": { formatDateForAPI: () => today },
    });

    const getSkeleton = () =>
        findElement(ActivityOverview(), (element) => element.type.name === "ActivityLoadingState");
    const initial = getSkeleton();
    assert.ok(initial, "The first response is pending");
    summary.data = { availableYears: [2026, 2025, 2024] };
    const withSummary = getSkeleton();
    assert.equal(JSON.stringify(withSummary.type(withSummary.props)), JSON.stringify(initial.type(initial.props)));
    assert.equal(requestedDay, null, "The summary alone must not start a day request");

    activity.fetchStatus = "paused";
    assert.ok(findElement(ActivityOverview(), (element) => element.type === "ErrorState"));

    activity.isPending = false;
    activity.fetchStatus = "idle";
    activity.data = { year: 2026, daily: [{ date: today, count: 2 }], weekly: [], totalReservations: 2 };
    const overview = ActivityOverview();
    assert.ok(findElement(overview, (element) => element.type === "ActivityHeatmap"));
    assert.equal(requestedDay, today);
    const daySection = findElement(overview, (element) => element.type.name === "ActivityDayReservations");
    assert.equal(daySection.type(daySection.props).props.accessibilityRole, "progressbar");

    activity.isPlaceholderData = true;
    assert.equal(
        findElement(ActivityOverview(), (element) => element.type.name === "ActivityDayReservations"),
        null,
    );
    assert.equal(requestedDay, null, "The previous period cannot start a day request");
});

// Whole-screen tests: the router, theme, and list primitives are stubbed, and
// `memo` is flattened so the scene can be invoked directly. `usePullToRefresh`
// is the real implementation, loaded against the same React harness, because
// these tests cover how the scene wires pull-to-refresh to pagination.
for (const reservationType of [null, "all", "bay", "private", "group", "program"]) {
    test(`${reservationType ? `reservations/${reservationType}` : "notifications"}: background updates and overlapping refresh/pagination stay separate`, async () => {
        const values = [];
        let cursor = 0,
            completeRefresh,
            refreshes = 0,
            nextPages = 0;
        const result = {
            data: { items: [{ id: 1, isRead: true, createdAt: "2026-01-05T10:00:00" }] },
            isLoading: false,
            isError: false,
            isFetchNextPageError: false,
            isFetching: true,
            isRefetching: true,
            isFetchingNextPage: false,
            hasNextPage: true,
            refetch: (options) => {
                assert.equal(options.cancelRefetch, false);
                refreshes++;
                return new Promise((resolve) => {
                    completeRefresh = resolve;
                });
            },
            fetchNextPage: (options) => {
                assert.equal(options.cancelRefetch, false);
                nextPages++;
            },
        };
        const mutation = () => ({ mutate() {}, mutateAsync: async () => {}, isPending: false });
        const react = {
            ...React,
            memo: (fn) => fn,
            useState(initial) {
                const index = cursor++;
                if (!(index in values)) values[index] = initial;
                return [
                    values[index],
                    (value) => {
                        values[index] = value;
                    },
                ];
            },
            useRef(initial) {
                const index = cursor++;
                if (!(index in values)) values[index] = { current: initial };
                return values[index];
            },
            useCallback: (fn) => fn,
            useMemo: (fn) => fn(),
            useLayoutEffect() {},
        };
        const { usePullToRefresh } = load("src/lib/hook/usePullToRefresh.ts", {
            react,
            "@/design-system/utils/haptics": { triggerImpactHaptic() {} },
            "expo-haptics": { ImpactFeedbackStyle: { Light: "light" } },
        });
        const shared = {
            react,
            "@/design-system/components/AppText": { AppText: "AppText" },
            "@/lib/hook/useNavigationLock": {
                useNavigationLock: () => ({ isLocked: false, runWithNavigationLock: (fn) => fn() }),
            },
            "@/lib/hook/usePullToRefresh": { usePullToRefresh },
            "@shopify/flash-list": { FlashList: "FlatList" },
            "@tanstack/react-query": {
                useQueryClient: () => ({
                    invalidateQueries: async () => {},
                    prefetchQuery: async () => {},
                }),
            },
            "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
            "react-native": {
                ActivityIndicator: "ActivityIndicator",
                Linking: { openURL: async () => {} },
                RefreshControl: "RefreshControl",
                ScrollView: "ScrollView",
                View: "View",
            },
            "react-native-gesture-handler": { ScrollView: "GestureHandlerScrollView" },
            "lucide-react-native": {},
            "expo-haptics": { ImpactFeedbackStyle: { Medium: "medium" } },
        };
        const scene = load(
            reservationType
                ? "src/components/golf/reservation/ReservationTabScene.tsx"
                : "src/app/(app)/(tabs)/notice/index.tsx",
            reservationType
                ? {
                      ...shared,
                      "@/components/golf/ReservationCard": {
                          default: "ReservationCard",
                          ReservationCardSkeleton: "ReservationCardSkeleton",
                      },
                      "@/design-system": {
                          ActionButton: "ActionButton",
                          EmptyState: "EmptyState",
                          ErrorState: "ErrorState",
                          Skeleton: "Skeleton",
                          StateList: "StateList",
                      },
                      "@/lib/hook/useReservation": {
                          getMemberReservationDetailQueryOptions: () => ({}),
                          useMemberReservations: (type) => {
                              assert.equal(type, reservationType);
                              return result;
                          },
                      },
                      "@/utils/time-helper": { formatDateWeekdayYear: () => "Jan 5, 2026" },
                      "expo-router": { useRouter: () => ({ push() {} }) },
                  }
                : {
                      ...shared,
                      "@/components/golf/notice/DeleteAllNotificationsSheet": {
                          DeleteAllNotificationsSheet: "DeleteAllNotificationsSheet",
                      },
                      "@/components/golf/notice/NoticeHeaderActions": { NoticeHeaderActions: "NoticeHeaderActions" },
                      "@/components/golf/notice/NotificationRow": {
                          MemoNotificationRow: "MemoNotificationRow",
                          NoticeListFooter: "NoticeListFooter",
                          NoticeListHeader: "NoticeListHeader",
                          NotificationListSkeleton: "NotificationListSkeleton",
                          NotificationSectionHeader: "NotificationSectionHeader",
                          NotificationSeparator: "NotificationSeparator",
                      },
                      "@/components/golf/notice/notice-list-entries": load(
                          "src/components/golf/notice/notice-list-entries.ts",
                          {
                              "@/utils/timezone": { toAppTimeZoneDate: (value) => new Date(value) },
                              "date-fns": require("date-fns"),
                          },
                      ),
                      "@/design-system": {
                          EmptyState: "EmptyState",
                          ErrorState: "ErrorState",
                          Screen: "Screen",
                          StateList: "StateList",
                          triggerImpactHaptic() {},
                          triggerSelectionHaptic() {},
                      },
                      "@/lib/hook/shared/useNotification": {
                          useDeleteAllNotifications: mutation,
                          useDeleteNotification: mutation,
                          useGetNotifications: () => result,
                          useMarkAllAsRead: mutation,
                          useMarkAsRead: mutation,
                      },
                      "@/lib/hook/useLessonLog": {},
                      "@/lib/hook/useMinuteClock": { useDayClock: () => Date.now() },
                      "@/lib/hook/useReservation": { getMemberReservationDetailQueryOptions: () => ({}) },
                      "expo-notifications": { getPermissionsAsync: async () => ({ status: "granted" }) },
                      "expo-router": {
                          useFocusEffect() {},
                          useIsFocused: () => true,
                          useNavigation: () => ({ navigate() {} }),
                          useRouter: () => ({ push() {} }),
                          useScrollToTop() {},
                      },
                  },
        );

        function findSceneElement(type) {
            cursor = 0;
            const tree = reservationType ? scene.ReservationTabScene({ type: reservationType }) : scene.default();
            return findElement(tree, (element) => element.type === type);
        }

        function findList() {
            const found = findSceneElement("FlatList");
            assert.ok(found, "the scene renders its cursor-paginated list");
            return found;
        }

        if (!reservationType) {
            const populated = result.data;
            Object.assign(result, { data: undefined, isPending: true, fetchStatus: "idle", isFetching: false });
            assert.ok(findSceneElement("NotificationListSkeleton"), "First focus can precede the first fetch");
            assert.equal(findSceneElement("EmptyState"), null);

            result.fetchStatus = "paused";
            assert.ok(findSceneElement("ErrorState"), "An offline first read cannot establish an empty inbox");
            assert.equal(findSceneElement("EmptyState"), null);

            Object.assign(result, { data: { items: [] }, isPending: false, fetchStatus: "idle" });
            assert.ok(findSceneElement("EmptyState"), "A successful empty response shows the empty state");
            Object.assign(result, { data: populated, isFetching: true });
        }

        assert.equal(findList().props.refreshControl.props.refreshing, false, "Background work is not a user pull");
        findList().props.refreshControl.props.onRefresh();
        assert.equal(refreshes, 1, "A pull requests one non-cancelling refetch");
        assert.equal(findList().props.refreshControl.props.refreshing, true, "The pull owns the indicator");
        findList().props.onEndReached();
        assert.equal(nextPages, 0, "Pagination cannot interrupt a manual refresh");
        findList().props.refreshControl.props.onRefresh();
        assert.equal(refreshes, 1, "Repeated native events share one refresh");
        completeRefresh({ isError: true });
        await flush();
        assert.equal(findList().props.refreshControl.props.refreshing, false, "A failed refresh clears the indicator");
        findList().props.refreshControl.props.onRefresh();
        assert.equal(refreshes, 2, "Refresh can be retried after failure");

        result.isFetching = result.isRefetching = false;
        findList().props.onEndReached();
        assert.equal(nextPages, 0, "Pagination still waits for the pending pull");
        completeRefresh({});
        await flush();
        assert.equal(findList().props.refreshControl.props.refreshing, false);
        findList().props.onEndReached();
        assert.equal(nextPages, 1);
        result.isFetching = result.isFetchingNextPage = true;
        assert.equal(findList().props.refreshControl.props.refreshing, false, "Pagination uses the footer spinner");
    });
}
