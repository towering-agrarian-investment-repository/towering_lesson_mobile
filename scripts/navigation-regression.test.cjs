const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const project = path.resolve(__dirname, "..");
const expo = path.dirname(require.resolve("expo-router/package.json"));
const { StackRouter } = require(path.join(expo, "build/react-navigation/routers/StackRouter.js"));
const { TabRouter } = require(path.join(expo, "build/react-navigation/routers/TabRouter.js"));

// Evaluate the actual success handler without loading native UI modules.
const source = fs.readFileSync(path.join(project,
    "src/components/golf/booking/BookingConfirmationShared.tsx"), "utf8");
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const moduleExports = {};
vm.runInNewContext(compiled, {
    exports: moduleExports,
    require: () => ({}),
    process: { env: {} },
});

function stack() {
    const router = StackRouter({ initialRouteName: "(tabs)" });
    const options = {
        routeNames: ["(tabs)", "lessons/index", "select-date", "select-time",
            "select-bay", "booking-confirm", "reservation", "reservation/[id]"],
        routeParamList: {},
        routeGetIdList: {},
    };
    let state = router.getInitialState(options);
    const dispatch = (action) => {
        const next = router.getStateForAction(state, action, options);
        assert.ok(next, "navigation action must be handled");
        state = next;
    };
    return {
        names: () => state.routes.map((r) => r.name),
        back: () => dispatch({ type: "GO_BACK" }),
        push: (href) => dispatch({
            type: "PUSH",
            payload: typeof href === "string"
                ? { name: href.slice(1) }
                : { name: href.pathname.slice(1), params: href.params },
        }),
        dismissTo: (href) => dispatch({
            type: "POP_TO",
            payload: { name: href === "/(app)/(tabs)" ? "(tabs)" : href.slice(1) },
        }),
    };
}

test("each secondary tab returns to Home before system Back may exit", () => {
    const router = TabRouter({ initialRouteName: "index", backBehavior: "initialRoute" });
    const options = {
        routeNames: ["index", "notice", "activity", "profile"],
        routeParamList: {}, routeGetIdList: {},
    };
    for (const name of options.routeNames.slice(1)) {
        let state = router.getInitialState(options);
        state = router.getStateForAction(state, { type: "JUMP_TO", payload: { name } }, options);
        state = router.getStateForAction(state, { type: "GO_BACK" }, options);
        assert.equal(state.routes[state.index].name, "index");
        assert.equal(router.getStateForAction(state, { type: "GO_BACK" }, options), null);
    }
});

test("Lessons pops to the existing tabs instead of acting as a hidden tab", () => {
    const navigation = stack();
    navigation.push("/lessons/index");
    navigation.back();
    assert.deepEqual(navigation.names(), ["(tabs)"]);
    assert.equal(fs.existsSync(path.join(project, "src/app/(app)/(tabs)/lessons.tsx")), false);
});

for (const reschedule of [false, true]) {
    test(`booking success preserves Home and cannot return to the completed flow (reschedule=${reschedule})`, () => {
        const navigation = stack();
        if (reschedule) {
            navigation.push("/reservation");
            navigation.push("/reservation/[id]");
        }
        for (const route of ["select-date", "select-time", "select-bay", "booking-confirm"]) {
            navigation.push("/" + route);
        }
        moduleExports.handleBookingConfirmationSuccess(navigation, {
            data: { id: 12, reservationType: "bay" },
        });
        assert.deepEqual(navigation.names(), ["(tabs)", "reservation", "reservation/[id]"]);
        navigation.back();
        assert.deepEqual(navigation.names(), ["(tabs)", "reservation"]);
        navigation.back();
        assert.deepEqual(navigation.names(), ["(tabs)"]);
    });
}

test("success without detail and repeated return-to-list keep a single list", () => {
    const navigation = stack();
    navigation.push("/booking-confirm");
    moduleExports.handleBookingConfirmationSuccess(navigation, { data: null });
    assert.deepEqual(navigation.names(), ["(tabs)", "reservation"]);
    navigation.push("/reservation/[id]");
    navigation.dismissTo("/reservation");
    navigation.dismissTo("/reservation");
    assert.deepEqual(navigation.names(), ["(tabs)", "reservation"]);
});
