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

test("resource video survives parent rerenders and saves its position when focus ends", () => {
    const components = new Map();
    let slots;
    let cursor;
    let focusCleanup;
    let playCalls = 0;
    let pauseCalls = 0;
    const effects = [];
    const sameDeps = (left, right) => left?.length === right.length && right.every((value, i) => value === left[i]);
    const react = {
        ...React,
        useState(initial) {
            const state = (slots[cursor++] ??= { value: initial });
            return [state.value, (next) => (state.value = typeof next === "function" ? next(state.value) : next)];
        },
        useRef(initial) {
            return (slots[cursor++] ??= { current: initial });
        },
        useCallback(callback, deps) {
            const index = cursor++;
            if (!slots[index] || !sameDeps(slots[index].deps, deps)) {
                slots[index] = { callback, deps };
            }
            return slots[index].callback;
        },
    };
    const player = {
        currentTime: 0,
        duration: 30,
        status: "readyToPlay",
        play: () => playCalls++,
        pause: () => pauseCalls++,
    };
    const { SessionResourceSection } = load("src/components/golf/SessionResourceSection.tsx", {
        react,
        "@/design-system": {
            AnimatedPressable: "AnimatedPressable",
            AppText: "AppText",
            Badge: "Badge",
            ImageViewerModal: "ImageViewerModal",
        },
        "@/design-system/components/AppToast": {},
        "@/design-system/utils/theme": { useTheme: () => ({ colors: {} }) },
        "@/design-system/utils/typography": {},
        "@/utils/media": {
            getFileExtension: () => "mp4",
            isAllowedExtension: (_name, allowed) => allowed.includes("mp4"),
            isAllowedMimeType: (mime, allowed) => allowed?.includes(mime) ?? false,
            RESOURCE_FILE_EXTENSIONS: ["mp4"],
            RESOURCE_IMAGE_EXTENSIONS: ["jpg"],
            RESOURCE_VIDEO_EXTENSIONS: ["mp4"],
        },
        "@/utils/open-external-url": {},
        expo: { useEvent: () => ({ status: player.status }) },
        "expo-image": { Image: "Image" },
        "expo-router": {
            useFocusEffect(callback) {
                const state = (slots[cursor++] ??= {});
                if (state.callback !== callback) {
                    effects.push(() => {
                        state.cleanup?.();
                        state.callback = callback;
                        state.cleanup = callback();
                        focusCleanup = state.cleanup;
                    });
                }
            },
        },
        "expo-video": {
            useVideoPlayer(_url, setup) {
                const initialized = react.useRef(false);
                if (!initialized.current) {
                    setup(player);
                    initialized.current = true;
                }
                return player;
            },
            VideoView: "VideoView",
        },
        "lucide-react-native/icons/external-link": { default: "ExternalLink" },
        "lucide-react-native/icons/file-text": { default: "FileText" },
        "lucide-react-native/icons/play": { default: "Play" },
        "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
        "react-native": { View: "View" },
        "react-native-reanimated": { useReducedMotion: () => false },
    });
    const resources = [{ id: 1, fileUrl: "https://example.invalid/video.mp4", mediaType: "video/mp4" }];
    function render(Component, props) {
        if (!components.has(Component)) components.set(Component, []);
        slots = components.get(Component);
        cursor = 0;
        return Component(props);
    }
    function renderItem() {
        const section = render(SessionResourceSection, { resources });
        const item = findElement(section, (element) => typeof element.type === "function");
        return render(item.type, item.props);
    }
    function renderVideo() {
        const video = findElement(renderItem(), (element) => typeof element.type === "function");
        assert.ok(video, "The active resource still renders its video player");
        const tree = render(video.type, video.props);
        effects.splice(0).forEach((effect) => effect());
        return { Component: video.type, tree };
    }
    function requestPlay() {
        findElement(renderItem(), (element) => element.type === "AnimatedPressable").props.onPress();
    }
    function leaveAndReplay() {
        focusCleanup();
        assert.ok(findElement(renderItem(), (element) => element.type === "AnimatedPressable"));
        components.delete(video.Component);
        player.currentTime = 0;
        requestPlay();
        renderVideo();
    }

    requestPlay();
    const video = renderVideo();
    player.currentTime = 12;
    renderVideo();
    assert.equal(pauseCalls, 0, "A parent rerender must not pause playback");
    assert.equal(playCalls, 1, "A parent rerender must not restart the player");
    assert.ok(findElement(renderItem(), (element) => element.type === video.Component));

    leaveAndReplay();
    assert.equal(pauseCalls, 1, "Leaving the screen pauses playback");
    assert.equal(player.currentTime, 12, "Replaying restores the saved position");
    assert.equal(playCalls, 2);

    player.currentTime = 0;
    leaveAndReplay();
    assert.equal(player.currentTime, 0, "Rewinding replaces the previous saved position");

    player.currentTime = player.duration;
    leaveAndReplay();
    assert.equal(player.currentTime, 0, "Replaying a finished video starts at the beginning");
});

test("monthly and yearly share cards report readiness again after artwork recovers", () => {
    const layout = require("../../assets/HappyGolf_ShareCard_V4/spec/layout_v4.json");
    const cardLayout = load("src/components/golf/monthly-share-card-layout.ts", {
        "../../../assets/HappyGolf_ShareCard_V4/spec/layout_v4.json": layout,
    });
    const files = [
        ["MonthlyGolfShareCard", { month: 0, hoursOnCourse: 0 }],
        ["YearlyShareCard", { totalReservations: 0, hoursPlayed: 0 }],
    ];
    const translate = (key) => key;

    for (const [name, periodProps] of files) {
        const states = [];
        let cursor = 0;
        let ready;
        const { [name]: ShareCard } = load(`src/components/golf/${name}.tsx`, {
            react: {
                memo: (component) => component,
                forwardRef: (component) => component,
                useState(initial) {
                    const index = cursor++;
                    states[index] ??= initial;
                    return [states[index], (value) => (states[index] = value)];
                },
                useEffect: (effect) => effect(),
            },
            "@/components/golf/HappyLogo": { HappyGolfLogo: "HappyGolfLogo" },
            "@/design-system/components/charts/activity-chart-data": { getActivityStatusColor: () => "#000" },
            "@/design-system/utils/color": { colorWithOpacity: () => "transparent" },
            "@/design-system/utils/theme": {
                getThemeColors: () => ({}),
                useTheme: () => ({ resolvedScheme: "dark" }),
            },
            "expo-linear-gradient": { LinearGradient: "LinearGradient" },
            "react-i18next": {
                useTranslation: () => ({ t: translate, i18n: { language: "en", getFixedT: () => translate } }),
            },
            "react-native": { Image: "Image", Text: "Text", View: "View" },
            "react-native-svg": { __esModule: true, default: "Svg", Defs: "Defs", Ellipse: "Ellipse", Path: "Path" },
            "../../../assets/HappyGolf_ShareCard_V4/spec/layout_v4.json": layout,
            "../../../assets/HappyGolf_ShareCard_V4/assets/decorations_minimal_v4.png": 1,
            "../../../assets/HappyGolf_ShareCard_V4/assets/decorations_minimal_v4_dark_clear.png": 2,
            "./ShareCardHeader": { ShareCardHeader: "ShareCardHeader" },
            "./monthly-share-card-layout": cardLayout,
        });
        function render() {
            cursor = 0;
            return ShareCard({
                year: 2026,
                width: 320,
                dailyValues: [],
                memberImage: "https://example.invalid/avatar.jpg",
                ...periodProps,
                onReadyChange: (value) => (ready = value),
            });
        }

        const tree = render();
        tree.props.onLayout();
        const artwork = findElement(tree, (element) => element.type === "Image" && element.props.source === 2);
        const avatar = findElement(tree, (element) => element.type === "Image" && element.props.source?.uri);
        artwork.props.onLoad();
        render();
        assert.equal(ready, false, `${name} waits for the avatar`);
        avatar.props.onError();
        render();
        assert.equal(ready, true, `${name} is ready with the avatar fallback`);
        artwork.props.onError();
        render();
        assert.equal(ready, false, `${name} blocks export after the artwork fails`);
        artwork.props.onLoad();
        render();
        assert.equal(ready, true, `${name} is ready when the artwork loads again`);
    }
});

test("confirmation honors server booking eligibility and uses the original reservation for bay reschedules", async () => {
    const status = load("src/utils/status-tone.ts", {
        "./format-enum": load("src/utils/format-enum.ts", {}),
    });
    const ticketType = load("src/design-system/utils/ticket-type.ts", {});
    const h = hooks();
    const params = {
        date: "2026-11-27",
        ticketId: "1",
        ticketName: "Ticket",
        ticketType: "BAY_USAGE",
        slotGroupId: "2",
        lessonAvailabilityId: "2",
    };
    const ticket = { id: 1, type: "BAY_USAGE", effectiveStatus: "ACTIVE", canStartBooking: false, remainingCount: 1 };
    const reservation = {
        reservationType: "bay",
        reservationStatus: "RESERVED",
        isCancellable: true,
        canReschedule: true,
        ticket: { id: 1 },
    };
    const slot = { id: 2, totalReservableBaySlots: 1, capacity: 1, bookedCount: 0, bookable: true };
    const slots = { data: { data: [slot] } };
    let created = 0;
    let rescheduled = 0;
    const rescheduledResponse = { data: { ...reservation, id: 3, memberNotes: "Bay 7, please" } };
    const cachedDetails = [];
    const mocks = {
        react: h.react,
        "@/components/golf/booking/BookingStepHeader": { BookingStepHeader: "BookingStepHeader" },
        "@/components/golf/booking/BookingConfirmationShared": {
            BookingConfirmationFooter: "BookingConfirmationFooter",
            BookingConfirmationTicketField: "TicketField",
            handleBookingConfirmationSuccess() {},
        },
        "@/components/golf/reservation/ReservationSections": {
            ReservationContent: "ReservationContent",
            ReservationDetailField: "ReservationDetailField",
        },
        "@/components/golf/reservation/detail/reservation-detail-utils": load(
            "src/components/golf/reservation/detail/reservation-detail-utils.ts",
            {},
        ),
        "@/components/ui/form": { FormTextInput: "FormTextInput" },
        "@/design-system": { Screen: "Screen", Divider: "Divider" },
        "@/design-system/components/AppText": { AppText: "AppText" },
        "@/design-system/components/AppToast": {},
        "@/design-system/utils/ticket-type": ticketType,
        "@/lib/api-response/api-response": {},
        "@/lib/booking/bay-notes-draft": load("src/lib/booking/bay-notes-draft.ts", {}),
        "@/lib/hook/useIsOnline": { useIsOnline: () => true },
        "@/lib/hook/useNavigationLock": {
            useNavigationLock: () => ({ isLocked: false, runWithNavigationLock: (fn) => fn() }),
        },
        "@/lib/hook/usePullToRefresh": { usePullToRefresh: () => ({ refreshing: false }) },
        "@/lib/hook/useReservation": {
            getMemberReservationDetailQueryOptions: (id, domain) => ({
                queryKey: ["member", "reservations", "detail", domain, id],
            }),
            useMemberBaySlotGroups: () => slots,
            useMemberTicketLessonSlots: () => slots,
            useMemberReservationById: () => ({ data: { data: reservation } }),
            useCreateMemberBayReservation: () => ({
                mutateAsync: async () => {
                    created++;
                    return { data: {} };
                },
            }),
            useCreateMemberLessonReservation: () => ({
                mutate: () => {
                    created++;
                },
            }),
            useRescheduleMemberBayReservation: () => ({
                mutateAsync: async () => {
                    rescheduled++;
                    return rescheduledResponse;
                },
            }),
        },
        "@/lib/hook/useTicket": { useMemberTicketById: () => ({ data: ticket }) },
        "@/lib/hook/useUser": { useGetMemberProfile: () => ({}) },
        "@/utils/lesson-slot": {
            isGroupLessonSlot: () => false,
            getLessonSpotsLeft: () => 1,
        },
        "@/utils/status-tone": status,
        "@/utils/ticket-pause": { getTicketPausePeriods: () => [], isTicketDatePaused: () => false },
        "@/utils/time-helper": {
            formatDateForAPI: () => params.date,
            formatDateMedium: () => params.date,
            formatDateShort: () => params.date,
            formatTimeRange: () => "10:00–11:00",
        },
        "@tanstack/react-query": { useQueryClient: () => ({ setQueryData: (...args) => cachedDetails.push(args) }) },
        "expo-haptics": {},
        "expo-router": {
            Stack: { Screen: "StackScreen" },
            useLocalSearchParams: () => params,
            useNavigation: () => ({}),
            useRouter: () => ({}),
        },
        "expo-router/stack": { Stack: { Screen: "StackScreen" } },
        "react-hook-form": {
            useForm: () => ({
                formState: { isValid: true },
                getValues: () => "",
                subscribe: () => () => {},
                handleSubmit: (submit) => () => submit({ memberNotes: "" }),
            }),
            useWatch: () => "",
        },
        "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
        "react-native": { RefreshControl: "RefreshControl" },
    };
    const bay = load("src/app/(app)/bay-booking-confirm.tsx", mocks).default;
    const lesson = load("src/app/(app)/lesson-booking-confirm.tsx", mocks).default;
    const footer = (screen) => screen().props.footer.props;

    for (const [screen, type] of [
        [bay, "BAY_USAGE"],
        [lesson, "PRIVATE_LESSON"],
    ]) {
        ticket.type = params.ticketType = type;
        ticket.canStartBooking = false;
        assert.equal(footer(screen).disabled, true);
        footer(screen).onPress();
        assert.equal(created, 0);
        ticket.canStartBooking = true;
        assert.equal(footer(screen).disabled, false);
    }

    slot.bookable = false;
    assert.equal(footer(lesson).disabled, true);
    slot.bookable = true;
    slot.bookedByCurrentMember = true;
    assert.equal(footer(lesson).disabled, true);

    ticket.type = params.ticketType = "BAY_USAGE";
    ticket.effectiveStatus = "FULLY_USED";
    ticket.canStartBooking = false;
    ticket.remainingCount = 0;
    params.mode = "reschedule";
    params.reservationId = "3";
    assert.equal(footer(bay).disabled, false);
    footer(bay).onPress();
    await flush();
    assert.equal(rescheduled, 1);
    assert.deepEqual(cachedDetails, [[["member", "reservations", "detail", "bay", 3], rescheduledResponse]]);

    reservation.canReschedule = false;
    assert.equal(footer(bay).disabled, true);
    footer(bay).onPress();
    assert.equal(rescheduled, 1);
});

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
            "@/lib/hook/useMinuteClock": { useDayClock: () => Date.now(), useMinuteClock: () => Date.now() },
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
            "@/lib/hook/useNavigationLock": {
                useNavigationLock: () => ({ isLocked: false, runWithNavigationLock: (fn) => fn() }),
            },
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
                useIsFocused: () => true,
                useRouter: () => ({}),
                useLocalSearchParams: () => ({ date: "2026-01-05", ticketId: "1" }),
            },
            "expo-router/stack": { Stack: { Screen: "StackScreen" } },
            "lucide-react-native/icons/user-round": { __esModule: true, default: "UserRound" },
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
        multiGet: async () => {
            throw new Error("storage unavailable");
        },
    };
    for (const [file, provider, readyIndex, extraMocks] of [
        ["src/lib/welcome/welcome-context.tsx", "WelcomeProvider", 0, {}],
        [
            "src/design-system/utils/theme.ts",
            "ThemeProvider",
            3,
            {
                "expo-system-ui": { setBackgroundColorAsync: async () => {} },
                "react-native": {
                    Appearance: { setColorScheme() {} },
                    useColorScheme: () => "light",
                    Dimensions: {
                        get: () => ({ fontScale: 1 }),
                        addEventListener: () => ({ remove() {} }),
                    },
                },
            },
        ],
    ]) {
        const h = hooks();
        load(
            file,
            {
                react: h.react,
                "@react-native-async-storage/async-storage": storage,
                "@/lib/startup-preferences": load("src/lib/startup-preferences.ts", {
                    "@react-native-async-storage/async-storage": storage,
                }),
                ...extraMocks,
            },
            { process: { env: { EXPO_OS: "ios" } } },
        )[provider]({ children: null });
        h.effects.forEach((effect) => effect());
        await flush();
        assert.equal(h.states[readyIndex], true, provider);
    }
});

test("startup preferences share one read and preserve all four stored values", async () => {
    const keys = [
        "app-language",
        "app-theme-preference",
        "app-primary-color-preference",
        "happy-golf.welcome-completed.v1",
    ];
    const values = ["ja", "dark", "green", "true"];
    let reads = 0;
    const { loadStartupPreferences } = load("src/lib/startup-preferences.ts", {
        "@react-native-async-storage/async-storage": {
            async multiGet(requested) {
                reads++;
                assert.deepEqual(Array.from(requested), keys);
                return keys.map((key, index) => [key, values[index]]);
            },
        },
    });
    const preferences = loadStartupPreferences();
    assert.equal(loadStartupPreferences(), preferences);
    assert.deepEqual(Array.from((await preferences).values()), values);
    assert.equal(reads, 1);
});

test("push registration skips a confirmed cold start and rewrites on token change or after sign-out", async () => {
    const secureStore = new Map();
    const writes = [];
    const mocks = {
        "expo-crypto": { randomUUID: () => "installation" },
        "expo-secure-store": {
            getItemAsync: async (key) => secureStore.get(key) ?? null,
            setItemAsync: async (key, value) => secureStore.set(key, value),
            deleteItemAsync: async (key) => secureStore.delete(key),
        },
        "@/service/shared/push-token-service": {
            async savePushToken(data) {
                writes.push(data.pushToken);
            },
            async deactivatePushInstallation(installationId) {
                assert.equal(installationId, "installation");
                writes.push("delete");
            },
        },
    };
    const loadRegistration = () =>
        load("src/lib/config/notification/pushRegistrationStorage.ts", mocks, { __DEV__: false });
    let registration = loadRegistration();
    const { signal } = new AbortController();
    const identity = { userId: "user", installationId: await registration.getInstallationId(), token: "token-1" };
    await registration.confirmPushRegistration(identity, registration.getPushRegistrationGeneration(), signal);

    registration = loadRegistration();
    const generation = registration.getPushRegistrationGeneration();
    await registration.confirmPushRegistration(identity, generation, signal);
    assert.deepEqual(writes, ["token-1"]);

    identity.token = "token-2";
    await registration.confirmPushRegistration(identity, generation, signal);
    const finishSignOut = registration.beginPushRegistrationSignOut();
    await registration.deactivateCurrentPushInstallation(signal);
    finishSignOut();
    await registration.confirmPushRegistration(identity, generation, signal);
    assert.deepEqual(writes, ["token-1", "token-2", "delete"]);

    registration = loadRegistration();
    await registration.confirmPushRegistration(identity, registration.getPushRegistrationGeneration(), signal);
    assert.deepEqual(writes, ["token-1", "token-2", "delete", "token-2"]);
});

function loadAuthenticatedLayout(h, toasts = []) {
    return load("src/app/(app)/_layout.tsx", {
        react: h.react,
        "@tanstack/react-query": query,
        "@/design-system/utils/theme": { useThemeColors: () => ({}), getStackHeaderOptions: () => ({}) },
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
                "lucide-react-native/icons/check": { __esModule: true, default: "Check" },
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
        "lucide-react-native/icons/chevron-right": { __esModule: true, default: "ChevronRight" },
        "lucide-react-native/icons/sparkles": { __esModule: true, default: "Sparkles" },
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
                              "date-fns/differenceInCalendarDays": require("date-fns/differenceInCalendarDays"),
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
            const tree = reservationType
                ? scene.ReservationTabScene({ type: reservationType, isActive: true })
                : scene.default();
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

test("booking confirmation success strips intermediate booking steps and duplicate reschedule detail", () => {
    const { handleBookingConfirmationSuccess } = load("src/components/golf/booking/BookingConfirmationShared.tsx", {
        "@/components/golf/reservation/ReservationSections": { ReservationDetailField: "ReservationDetailField" },
        "@/design-system": {
            ActionButton: "ActionButton",
            Divider: "Divider",
            Skeleton: "Skeleton",
            triggerSuccessHaptic() {},
        },
        "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
        "react-native": { View: "View" },
        "expo-router/react-navigation": { CommonActions: { reset: (payload) => ({ type: "RESET", payload }) } },
    });

    const dispatched = [];
    const replaced = [];
    const router = { replace: (arg) => replaced.push(arg) };

    handleBookingConfirmationSuccess(
        router,
        { type: "bay", mode: "booking", reservationId: 42 },
        {
            getState: () => ({
                type: "stack",
                routeNames: [
                    "(tabs)",
                    "tickets",
                    "tickets/[id]",
                    "select-date",
                    "select-time",
                    "bay-booking-confirm",
                    "booking-success",
                ],
                routes: [
                    { key: "tabs", name: "(tabs)" },
                    { key: "tickets", name: "tickets" },
                    { key: "ticket-1", name: "tickets/[id]", params: { id: "1" } },
                    { key: "date", name: "select-date" },
                    { key: "time", name: "select-time" },
                    { key: "confirm", name: "bay-booking-confirm" },
                ],
            }),
            dispatch: (action) => dispatched.push(action),
        },
    );
    assert.equal(replaced.length, 0);
    assert.equal(dispatched.length, 1);
    assert.deepEqual(
        Array.from(dispatched[0].payload.routes, (r) => r.name),
        ["(tabs)", "tickets", "tickets/[id]", "booking-success"],
    );
    assert.equal(dispatched[0].payload.index, 3);

    handleBookingConfirmationSuccess(
        router,
        { type: "bay", mode: "reschedule", reservationId: 99 },
        {
            getState: () => ({
                type: "stack",
                routeNames: [
                    "(tabs)",
                    "reservation",
                    "reservation/[id]",
                    "select-date",
                    "select-time",
                    "bay-booking-confirm",
                    "booking-success",
                ],
                routes: [
                    { key: "tabs", name: "(tabs)" },
                    { key: "list", name: "reservation" },
                    { key: "detail", name: "reservation/[id]", params: { id: "99", type: "bay" } },
                    { key: "date", name: "select-date" },
                    { key: "time", name: "select-time" },
                    { key: "confirm", name: "bay-booking-confirm" },
                ],
            }),
            dispatch: (action) => dispatched.push(action),
        },
    );
    assert.equal(dispatched.length, 2);
    assert.deepEqual(
        Array.from(dispatched[1].payload.routes, (r) => r.name),
        ["(tabs)", "reservation", "booking-success"],
    );
    assert.equal(dispatched[1].payload.index, 2);
});

test("push registration checks the current token on startup and saves only changed registrations", async () => {
    const secureStore = new Map();
    const savedTokens = [];
    const mocks = {
        "expo-crypto": { randomUUID: () => "install-1" },
        "expo-secure-store": {
            getItemAsync: async (key) => secureStore.get(key) ?? null,
            setItemAsync: async (key, value) => secureStore.set(key, value),
            deleteItemAsync: async (key) => secureStore.delete(key),
        },
        "@/service/shared/push-token-service": {
            async savePushToken({ pushToken }) {
                savedTokens.push(pushToken);
            },
            async deactivatePushInstallation() {},
        },
    };
    const registration = load("src/lib/config/notification/pushRegistrationStorage.ts", mocks, { __DEV__: false });
    const { signal } = new AbortController();
    let token = "expo-token-1";
    let tokenChecks = 0;
    const { registerForPushNotifications } = load("src/lib/config/notification/registerPushNotification.ts", {
        "@/lib/config/notification/pushRegistrationStorage": registration,
        "expo-constants": { __esModule: true, default: { easConfig: { projectId: "project-1" } } },
        "expo-device": { isDevice: true },
        "expo-notifications": {
            setNotificationHandler() {},
            getPermissionsAsync: async () => ({ status: "granted" }),
            getExpoPushTokenAsync: async () => {
                tokenChecks++;
                return { data: token };
            },
        },
        "react-native": { Platform: { OS: "ios" } },
    });
    await registerForPushNotifications("user-1", signal);
    await registerForPushNotifications("user-1", signal);
    token = "expo-token-2";
    await registerForPushNotifications("user-1", signal);
    assert.equal(tokenChecks, 3);
    assert.deepEqual(savedTokens, ["expo-token-1", "expo-token-2"]);
});

test("successful notification deletion reconciles the active inbox with the server", async () => {
    const client = new query.QueryClient({ defaultOptions: { queries: { retry: false } } });
    const key = ["notifications", undefined];
    const page = (items) => ({ data: { items, hasMore: false, nextCursor: null } });
    client.setQueryData(key, { pages: [page([{ id: 7, isRead: false }])], pageParams: [null] });
    let refetches = 0;
    const observer = new query.InfiniteQueryObserver(client, {
        queryKey: key,
        initialPageParam: null,
        getNextPageParam: () => undefined,
        staleTime: Infinity,
        queryFn: async () => {
            refetches++;
            return page([{ id: 8, isRead: false }]);
        },
    });
    const unsubscribe = observer.subscribe(() => {});
    const { useDeleteNotification } = load("src/lib/hook/shared/useNotification.ts", {
        "@/lib/api-response/api-response": { responseError: assert.fail },
        "@/service/shared/notification-service": { deleteNotification: async () => ({ data: null }) },
        "@tanstack/react-query": {
            ...query,
            useQueryClient: () => client,
            useMutation: (options) => client.getMutationCache().build(client, options),
        },
    });
    try {
        await useDeleteNotification().execute(7);
        assert.equal(refetches, 1);
        assert.equal(client.getQueryData(key).pages[0].data.items[0].id, 8);
    } finally {
        unsubscribe();
        client.clear();
    }
});

test("a queued draft discard removes the newest save after an older removal finishes", async () => {
    const filename = path.resolve(__dirname, "../../src/app/(app)/homework/[homeworkId].tsx");
    const source = ts.createSourceFile(filename, fs.readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true);
    let queueCallback;
    function findQueue(node) {
        if (ts.isVariableDeclaration(node) && node.name.getText(source) === "queueDraftWrite") {
            queueCallback = node.initializer.arguments[0].getText(source);
        }
        ts.forEachChild(node, findQueue);
    }
    findQueue(source);
    assert.ok(queueCallback);
    const stored = new Map([["draft", "old draft"]]);
    let finishFirstRemoval;
    let removals = 0;
    const exports = {};
    vm.runInNewContext(
        ts.transpileModule(`exports.queue = ${queueCallback}`, { compilerOptions: { target: ts.ScriptTarget.ESNext } })
            .outputText,
        {
            exports,
            draftKey: "draft",
            pendingDraftWrite: { current: null },
            AsyncStorage: {
                setItem: async (key, value) => stored.set(key, value),
                removeItem: async (key) => {
                    if (++removals === 1) {
                        await new Promise((resolve) => (finishFirstRemoval = resolve));
                    }
                    stored.delete(key);
                },
            },
        },
    );
    const firstRemoval = exports.queue(null);
    await flush();
    const newerSave = exports.queue({ memo: "new draft", file: null });
    finishFirstRemoval();
    await Promise.all([firstRemoval, newerSave]);
    assert.equal(JSON.parse(stored.get("draft")).memo, "new draft");
    await exports.queue(null);
    assert.equal(removals, 2);
    assert.equal(stored.has("draft"), false);
});

test("resizing a lesson session selector keeps the selected pill visible", () => {
    const states = [];
    const refs = [];
    const effects = [];
    let stateIndex;
    let refIndex;
    const { LessonSessionsView } = load("src/components/golf/LessonSessionsView.tsx", {
        react: {
            ...React,
            useState(initial) {
                const index = stateIndex++;
                if (!(index in states)) states[index] = initial;
                return [states[index], (value) => (states[index] = value)];
            },
            useRef: (initial) => (refs[refIndex++] ??= { current: initial }),
            useLayoutEffect: (effect) => effects.push(effect),
        },
        "@/design-system": {},
        "@/design-system/components/AppText": { AppText: "AppText" },
        "@/design-system/utils/cn": {},
        "@/design-system/utils/theme": {},
        "@/utils/format-enum": {},
        "@/utils/member-lesson": {},
        "@/utils/status-tone": {},
        "@/utils/time-helper": {},
        "lucide-react-native/icons/award": {},
        "lucide-react-native/icons/check": {},
        "lucide-react-native/icons/circle-check": {},
        "lucide-react-native/icons/clock": {},
        "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
        "react-native": { View: "View" },
        "react-native-reanimated": { useReducedMotion: () => true },
        "./SessionResourceSection": { SessionResourceSection: "SessionResourceSection" },
    });
    const sessions = [
        { id: 1, resources: [] },
        { id: 2, resources: [] },
    ];
    const offsets = [];
    function render() {
        stateIndex = refIndex = 0;
        const tree = LessonSessionsView({ sessions });
        effects.splice(0).forEach((effect) => effect());
        return findElement(tree, (element) => element.type.name === "SessionSwitcher").props;
    }
    let selector = render();
    selector.scrollViewRef.current = { scrollToOffset: ({ offset }) => offsets.push(offset) };
    selector.onItemLayout(1, { nativeEvent: { layout: { x: 500, width: 100 } } });
    selector.onContentSizeChange(1000);
    selector.onContainerLayout({ nativeEvent: { layout: { width: 300 } } });
    selector = render();
    assert.equal(offsets.at(-1), 400);
    selector.onContainerLayout({ nativeEvent: { layout: { width: 100 } } });
    selector = render();
    assert.equal(offsets.at(-1), 500);
    assert.equal(selector.selectedSessionId, 1);
});
