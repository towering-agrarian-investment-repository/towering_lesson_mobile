const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../../src/lib/hook/useMinuteClock.ts");
const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function createClockHarness(start) {
    let now = Date.parse(start);
    const timers = new Map();
    const listeners = new Set();
    const appState = {
        currentState: "active",
        addEventListener(event, listener) {
            assert.equal(event, "change");
            listeners.add(listener);
            return { remove: () => listeners.delete(listener) };
        },
    };

    let state;
    let focus;
    const mocks = {
        "react-native": { AppState: appState },
        "expo-router": {
            useFocusEffect: (effect) => {
                focus = effect;
            },
        },
        react: {
            useCallback: (callback) => callback,
            useState(initial) {
                state.value = initial();
                const mountedState = state;
                return [
                    mountedState.value,
                    (value) => {
                        mountedState.value = typeof value === "function" ? value(mountedState.value) : value;
                    },
                ];
            },
        },
    };
    const exports = {};
    vm.runInNewContext(
        code,
        {
            Date: { now: () => now },
            exports,
            require: (id) => mocks[id],
            setTimeout(callback, delay) {
                const id = Symbol();
                timers.set(id, { callback, delay });
                return id;
            },
            clearTimeout: (id) => timers.delete(id),
        },
        { filename },
    );

    return {
        ...exports,
        timers,
        listeners,
        mount(hook) {
            const mountedState = {};
            state = mountedState;
            hook();
            return { state: mountedState, blur: focus() };
        },
        setAppState(value, at) {
            if (at) now = Date.parse(at);
            appState.currentState = value;
            listeners.forEach((listener) => listener(value));
        },
        tick(at) {
            now = Date.parse(at);
            assert.equal(timers.size, 1);
            const [id, { callback }] = timers.entries().next().value;
            timers.delete(id);
            callback();
        },
        delay: () => timers.values().next().value?.delay,
    };
}

test("focused minute hooks share one aligned timer and one AppState listener", () => {
    const clock = createClockHarness("2026-11-30T16:58:30Z");
    const disabled = clock.mount(() => clock.useMinuteClock(false));
    assert.equal(clock.timers.size, 0);
    assert.equal(clock.listeners.size, 0);
    const first = clock.mount(clock.useMinuteClock);
    const second = clock.mount(clock.useMinuteClock);
    assert.equal(clock.timers.size, 1);
    assert.equal(clock.listeners.size, 1);
    assert.equal(clock.delay(), 30_000);

    clock.tick("2026-11-30T16:59:00Z");
    assert.equal(clock.delay(), 60_000);
    assert.equal(first.state.value, Date.parse("2026-11-30T16:59:00Z"));
    assert.equal(second.state.value, first.state.value);
    assert.equal(disabled.state.value, Date.parse("2026-11-30T16:58:00Z"));

    first.blur();
    assert.equal(clock.timers.size, 1);
    clock.setAppState("background");
    assert.equal(clock.timers.size, 0);
    assert.equal(clock.listeners.size, 1);
    clock.setAppState("active", "2026-11-30T17:03:45Z");
    assert.equal(clock.delay(), 15_000);
    assert.equal(second.state.value, Date.parse("2026-11-30T17:03:00Z"));
    assert.equal(first.state.value, Date.parse("2026-11-30T16:59:00Z"));
    second.blur();
    assert.equal(clock.timers.size, 0);
    assert.equal(clock.listeners.size, 0);

    const refocused = clock.mount(clock.useMinuteClock);
    assert.equal(clock.timers.size, 1);
    assert.equal(clock.listeners.size, 1);
    refocused.blur();
});

test("day clock waits for Phnom Penh midnight and resyncs after backgrounding", () => {
    const clock = createClockHarness("2026-11-30T16:59:59.250Z");
    const screen = clock.mount(clock.useDayClock);
    assert.equal(clock.delay(), 750);

    clock.tick("2026-11-30T17:00:00Z");
    assert.equal(screen.state.value, Date.parse("2026-11-30T17:00:00Z"));
    assert.equal(clock.delay(), 86_400_000);

    clock.setAppState("background");
    assert.equal(clock.timers.size, 0);
    clock.setAppState("active", "2026-12-01T16:59:00Z");
    assert.equal(screen.state.value, Date.parse("2026-11-30T17:00:00Z"));
    assert.equal(clock.delay(), 60_000);
    clock.setAppState("background");
    clock.setAppState("active", "2026-12-03T00:00:28Z");
    assert.equal(screen.state.value, Date.parse("2026-12-03T00:00:00Z"));
    assert.equal(clock.delay(), 17 * 3_600_000 - 28_000);
    screen.blur();
    assert.equal(clock.timers.size, 0);
    assert.equal(clock.listeners.size, 0);
});
