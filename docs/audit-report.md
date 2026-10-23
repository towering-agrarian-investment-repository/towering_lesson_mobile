# Expo app audit — 2026-10-23

> **Status notice:** This is the original audit snapshot, not a current to-do list. Subsequent approved cleanup addressed A01, A03–A07, A10, and B01–B04. A01's version check now runs without blocking initial navigation; a confirmed mandatory update still gates the app. A08 is partial: the approved repeated text sites use `AppText`, while other `NativeText` usages remain. A02 and A09 remain open; A09 was skipped because the small change would alter the share feature's structure. A07 was later completed using the backend's count endpoint. The historical findings and line references below have not been rewritten. Runtime and visual behavior have not been verified on a device.

Static code and configuration audit only. No app, simulator, profiler, timing probe, or build was run. Impact is an estimate of avoidable work, not a measured latency claim. Source files were not changed.

## Ten highest-impact findings

1. **A01** — The first navigator paint waits on a version endpoint with a five-second timeout.
2. **A02** — One theme context update reaches 58 source files and rebuilds navigation colors.
3. **A03** — Push events write two values no caller reads, rerendering the root.
4. **A04** — Home refetches banners on every focus, even while the query is fresh.
5. **A05** — The activity tab polls two queries every 30 seconds while focused.
6. **A06** — Sentry enables session replay and logs for preview and production too.
7. **A07** — The profile requests the full lesson-log collection to display its count.
8. **A08** — Standalone native labels each create a Host and subscribe to the full theme context.
9. **A09** — Activity mounts the share feature and imports its capture stack before sharing is requested.
10. **B01** — Notification mutations invalidate the unread count twice through overlapping keys.

Risk count: **3 high, 6 medium, 5 low** across 14 findings. Risk means risk of changing behavior while fixing; it does not mean severity. No finding authorizes cleanup yet.

## Phase 0 — project inventory

### 1. Stack and build versions

Version authority is [`package.json`](../package.json), with exact installed versions to be checked against `pnpm-lock.yaml` during an approved dependency change. Declared versions: Expo `~58.0.16`, React Native `0.88.0`, React `19.3.0`, NativeWind `^5.0.0-preview.4`, Tailwind `^4.3.0`, Reanimated `4.7.1`, Gesture Handler `~3.3.0`, React Query `^5.100.14`, React Hook Form `^7.77.0`, Better Auth and `@better-auth/expo` `1.7.2`, Sentry `^8.28.0`, `@expo/ui` `~58.0.21`. `FlatList` is used in 16 JSX sites; no FlashList dependency or source import. Both `expo-image` and React Native `Image` are used; see image inventory below.

### 2. Architecture, engine, compiler, transforms

[`app.json`](../app.json) has `experiments.reactCompiler: true` (line 109); neither `newArchEnabled` nor `jsEngine` is explicitly set. There is no `babel.config.js` or `tailwind.config.js` in this checkout. `react-native-worklets` is declared in [`package.json`](../package.json), Reanimated is used in four source files, and [`metro.config.js`](../metro.config.js) wraps the Sentry config with NativeWind. No custom Babel worklets plugin can be verified because no Babel config exists. Actual New Architecture/Hermes defaults and worklet transform behavior require installed SDK/native output or a build; this audit cannot certify them from an absent override.

### 3. Release/preview builds

[`eas.json`](../eas.json) defines `development` and `development-simulator` dev clients, internal `preview`, and `production` with `autoIncrement`; all pin pnpm `10.26.0`. Preview and production use named EAS environments and channels, whose remote variables are not present locally. The production profile has no custom minifier, console stripping, profiling, or replay setting. [`metro.config.js`](../metro.config.js) uses Sentry Metro config and a router compatibility resolver; [`src/app/_layout.tsx:36-52`](../src/app/_layout.tsx#L36) initializes Sentry with `enableLogs`, replay sampling, and no explicit traces/profiles sample rates. [`app.json`](../app.json) enables Expo Updates `ON_LOAD` with zero cache fallback timeout; it does not show a JS first-paint gate.

### 4. Full runtime dependency import audit

`src` import status means an explicit import in `src`, not a proof that removing a package is safe. Runtime/config/peer packages can be required without such an import. No two date libraries, icon libraries, or storage libraries are exact duplicates here: `@date-fns/tz` extends `date-fns`; `@expo/vector-icons` and Lucide supply different icons; AsyncStorage stores preferences while SecureStore stores auth/installation data. `react-native-tab-view` uses pager infrastructure; web/Expo native packages can be framework peers.

| Dependency and declared version | Explicit `src` import? | Role/evidence |
| --- | --- | --- |
| `@better-auth/expo` 1.7.2; `better-auth` 1.7.2 | yes; yes | [`auth-client.ts`](../src/lib/auth-client.ts) |
| `@date-fns/tz` ^1.5.0; `date-fns` ^4.4.0 | yes; yes | [`timezone.ts`](../src/utils/timezone.ts), date formatting |
| `@expo/ui` ~58.0.21; `@expo/vector-icons` ^15.0.2 | yes; yes | native controls; icons |
| `@hookform/resolvers` ^5.4.0; `react-hook-form` ^7.77.0; `zod` ^4.4.3 | yes; yes; yes | forms and schema validation |
| `@react-native-async-storage/async-storage` 2.2.0 | yes | theme, welcome, language |
| `@sentry/react-native` ^8.28.0 | yes | root initialization and Metro config |
| `@tanstack/react-query` ^5.100.14 | yes | protected app data cache |
| `clsx` ^2.1.1; `tailwind-merge` ^3.6.0 | yes; yes | [`cn.ts`](../src/design-system/utils/cn.ts) |
| `expo` ~58.0.16 | yes | framework/runtime imports |
| `expo-blob` ^58.0.3; `expo-blur` ~58.0.5 | **no; no** | removal candidates pending package/peer review |
| `expo-build-properties` ~58.0.11 | no | [`app.json`](../app.json) config plugin |
| `expo-constants` ~58.0.12; `expo-crypto` ~58.0.7; `expo-device` ~58.0.5 | yes; yes; yes | app/version, installation, device metadata |
| `expo-dev-client` ~58.0.14 | no | EAS development-client profile |
| `expo-document-picker` ~58.0.4; `expo-file-system` ~58.0.10 | yes; yes | submissions and share export |
| `expo-font` ~58.0.9 | no | [`app.json`](../app.json) config plugin |
| `expo-haptics` ~58.0.7; `expo-image` ~58.0.16; `expo-image-picker` ~58.0.10 | yes; yes; yes | interactions and media |
| `expo-linear-gradient` ~58.0.3 | yes | branded gradients |
| `expo-linking` ~58.0.13 | **no** | possible framework peer; review before removal |
| `expo-localization` ^58.0.5; `expo-media-library` ~58.0.11 | yes; yes | locale and card saving |
| `expo-network` ^58.0.3 | **no** | removal candidate pending peer review |
| `expo-notifications` ~58.1.5; `expo-router` ~58.0.24 | yes; yes | push and routes |
| `expo-secure-store` ^58.0.2; `expo-sharing` ~58.0.20 | yes; yes | auth/push storage and sharing |
| `expo-splash-screen` ~58.0.10; `expo-status-bar` ~58.0.3; `expo-system-ui` ~58.0.6 | yes; yes; yes | startup and system surfaces |
| `expo-updates` ~58.0.17 | no | OTA configuration in [`app.json`](../app.json) |
| `expo-video` ~58.0.12 | yes | lesson media |
| `expo-web-browser` ~58.0.6 | no | [`app.json`](../app.json) config plugin; possible auth peer |
| `i18next` ^26.3.1; `react-i18next` ^17.0.8 | yes; yes | five bundled locales |
| `jose` 6.2.9 | yes | JWT processing |
| `lucide-react-native` ^1.17.0 | yes | feature icons |
| `nativewind` ^5.0.0-preview.4 | no | [`metro.config.js`](../metro.config.js), [`global.css`](../src/global.css) |
| `react` 19.3.0; `react-native` 0.88.0 | yes; yes | runtime |
| `react-dom` 19.3.0; `react-native-web` ~0.21.4 | no; no | web target/framework peers |
| `react-native-calendars` ^1.1314.0 | yes | booking calendar |
| `react-native-css` ^3.0.7 | yes | theme variable bridge |
| `react-native-gesture-handler` ~3.3.0; `react-native-keyboard-controller` 1.22.7 | yes; yes | root, lists, keyboard |
| `react-native-pager-view` 9.0.7 | no | `react-native-tab-view` peer; verify before removal |
| `react-native-reanimated` 4.7.1 | yes | skeleton, loader, session cue |
| `react-native-safe-area-context` ~5.10.1 | yes | layout insets |
| `react-native-screens` ~4.30.0 | no | navigation native peer |
| `react-native-svg` 15.16.0 | yes | chart/graphics |
| `react-native-tab-view` ^4.3.2; `react-native-view-shot` 6.1.1 | yes; yes | booking tabs and card export |
| `react-native-worklets` 0.13.0 | no | Reanimated peer |

Dev dependencies in [`package.json`](../package.json): `@expo/dom-webview` (no source import; possible Expo DOM peer), `@tailwindcss/postcss` (PostCSS config), `@types/react` (types), `eslint` and `eslint-config-expo` (lint config), `lightningcss` (no direct config reference; toolchain candidate), `postcss` (PostCSS tool), `tailwindcss` (CSS), `typescript` (compiler). No dev dependency was treated as removable based only on source imports.

### 5. Routing and mounted screens

[`src/app/_layout.tsx:191-222`](../src/app/_layout.tsx#L191) protects `welcome`, `login`, and `(app)`. [`src/app/(app)/_layout.tsx`](../src/app/(app)/_layout.tsx) contains the authenticated Stack: reservations and details; tickets; lessons/groups/sessions; homework; lesson logs/comments; bay and lesson booking; success; profile edit/password. [`src/app/(app)/(tabs)/_layout.tsx:15-83`](../src/app/(app)/(tabs)/_layout.tsx#L15) defines four `NativeTabs`: home, notice, activity, profile. Notice, activity, and profile have nested stack layouts. The code has no tab `unmountOnBlur` policy; exact native tab retention/preloading is platform behavior not proven by source. [`tickets.tsx:146-154`](../src/app/(app)/tickets.tsx#L146) and [`reservation.tsx:174-183`](../src/app/(app)/reservation.tsx#L174) use lazy `TabView` scenes, so visited scenes can remain mounted. Mounted consumers of Theme, Update, Query, navigation theme, or i18n updates can render while off screen; no broad `React.memo` guarantee is inferred.

### 6. Top-level providers and consumers

Order: `GestureHandlerRootView` → `KeyboardProvider` → `SafeAreaProvider` → app `ThemeProvider` → `WelcomeProvider` → `AppUpdateProvider` → `NavigationThemeProvider` → native CSS `VariableContextProvider` → protected navigator; authenticated `(app)` adds `QueryClientProvider` → `AppToastProvider` → Stack ([`_layout.tsx:82-99`](../src/app/_layout.tsx#L82), [`_layout.tsx:164-229`](../src/app/_layout.tsx#L164), [`(app)/_layout.tsx:93-112`](../src/app/(app)/_layout.tsx#L93)). Theme stores scheme, primary preference, ready state and font scale; source search finds 58 files calling `useTheme`/`useThemeColors`. Welcome stores completion/ready; two external consumers, root and welcome screen. Update hook stores check/result/dismissal state; two external context consumers, tab bar and profile. React Query holds authenticated request cache; `useQuery`, `useInfiniteQuery`, or `useQueryClient` appear in 21 files. Toast provider owns toast/animation state via a module callback, not a new app context. Theme changes on preference/system/font-scale updates; welcome normally changes at bootstrap/completion; update changes at check/recheck/dismissal; query updates with network/cache events.

### 7. First-paint gates

[`src/app/_layout.tsx:54-80`](../src/app/_layout.tsx#L54) prevents splash auto-hide, starts Better Auth `useSession` (SecureStore-backed client), and tracks bootstrap. Theme reads two AsyncStorage keys before `isReady` ([`theme.ts:159-197`](../src/design-system/utils/theme.ts#L159)); welcome reads one key ([`welcome-context.tsx:18-39`](../src/lib/welcome/welcome-context.tsx#L18)). `useAppUpdate` fetches an app-version endpoint ([`use-app-update.ts:21-59`](../src/lib/update/use-app-update.ts#L21)); fetch aborts after five seconds ([`app-update.ts:56-72`](../src/lib/update/app-update.ts#L56)). The navigator and splash hide wait for theme, welcome, auth and update checking ([`_layout.tsx:138-142`](../src/app/_layout.tsx#L138), [`_layout.tsx:169-190`](../src/app/_layout.tsx#L169)). These tasks start independently, but the slowest gates UI. i18n initializes synchronously and reads a saved language asynchronously ([`i18n/index.ts:61-92`](../src/i18n/index.ts#L61)); it is not in the root gate. Expo Updates checks `ON_LOAD` in native config; its actual launch effect is unmeasured.

### 8–9. State and React Query

Three app contexts are Theme, Welcome and Update. Data lives in React Query in the authenticated subtree, local component state/refs in screens, AsyncStorage for preferences, SecureStore for auth/push identity, and i18n's own instance. No separate store library. [`src/app/(app)/_layout.tsx:21-50`](../src/app/(app)/_layout.tsx#L21) creates one QueryClient per authenticated mount: `staleTime` 30s, `gcTime` 10m, `retry` 1. No explicit `refetchOnWindowFocus`/reconnect defaults; Better Auth session separately sets `refetchOnWindowFocus: false` ([`auth-client.ts:17`](../src/lib/auth-client.ts#L17)). On the initial home path, unread count plus banners/profile queries mount, then ticket and today's reservation queries after profile loads ([`(tabs)/_layout.tsx:12`](../src/app/(app)/(tabs)/_layout.tsx#L12), [`(tabs)/index.tsx:40-74`](../src/app/(app)/(tabs)/index.tsx#L40), [`(tabs)/index.tsx:191-205`](../src/app/(app)/(tabs)/index.tsx#L191)); other tab queries depend on native tab mounting. Notice requests an infinite notification page; activity requests profile, summary, year activity and a selected-day reservation; profile requests profile and full lesson logs. Activity year and day queries pass 30s polling ([`ActivityOverview.tsx:36-58`](../src/components/golf/ActivityOverview.tsx#L36), [`ActivityOverview.tsx:103-107`](../src/components/golf/ActivityOverview.tsx#L103)); `enabled` follows focus, although exact timer behavior after blur needs device/library verification. Most hook-specific stale times are 15s notifications, 30s reservations, 60s lessons/tickets/logs, 5m profile/banners. Query B waits on member ID for tickets, and selected-day reservations wait on activity/selected date; these are data dependencies, not proven avoidable waterfalls.

### 10. Effects

Static scan finds **27 `useEffect`/`useLayoutEffect` calls across 22 files**, plus five `useFocusEffect` calls. By file: root layout 3; theme, AppToast, share export 2 each; one each in `(app)/_layout`, home, notice, homework, profile edit, select-lesson-slot, ActivitySharePreview, HomeBanner, LessonSessionsView, MonthlyGolfShareCard, YearlyShareCard, ProfileHeaderActions, FormPasswordInput, FormTextInput, PendingBottomSheet.android, push hook, update hook, welcome context. Fetch/subscription effects: update version fetch, theme/welcome storage reads, push listeners/registration, authenticated AppState/notification listeners, HomeBanner timer, select-slot minute timer. State synchronization: profile form reset on member change, native form inputs and homework memo sync, share-card readiness callbacks, toast and Android sheet lifecycle. Debug side effects: root theme probe and home banner log. No unconditional every-render effect or per-frame React `setState` was found; chart scrolling uses Reanimated shared values ([`LessonSessionsView.tsx:153-160`](../src/components/golf/LessonSessionsView.tsx#L153)). The highest-cost effect paths are detailed in A01, A03 and B03.

### 11. Persistent reads and writes

| Key / storage | Read and trigger | Write and trigger | Blocks first navigator paint? |
| --- | --- | --- | --- |
| `app-theme-preference`, AsyncStorage | [`theme.ts:159-182`](../src/design-system/utils/theme.ts#L159), provider mount | [`theme.ts:199-205`](../src/design-system/utils/theme.ts#L199), theme choice | yes |
| `app-primary-color-preference`, AsyncStorage | same parallel read | [`theme.ts:208-215`](../src/design-system/utils/theme.ts#L208), brand choice | yes |
| `happy-golf.welcome-completed.v1`, AsyncStorage | [`welcome-context.tsx:18-34`](../src/lib/welcome/welcome-context.tsx#L18), provider mount | [`welcome-context.tsx:41-50`](../src/lib/welcome/welcome-context.tsx#L41), welcome completion | yes |
| `app-language`, AsyncStorage | [`i18n/index.ts:76-92`](../src/i18n/index.ts#L76), module startup | [`i18n/index.ts:94-99`](../src/i18n/index.ts#L94), language choice | no root gate |

SecureStore is used by Better Auth's Expo client ([`auth-client.ts:18-24`](../src/lib/auth-client.ts#L18)) and push installation ID read/write ([`pushRegistrationStorage.ts`](../src/lib/config/notification/pushRegistrationStorage.ts)); the latter runs after authorized UI readiness, not before the root gate. Better Auth's internal storage keys are library-owned and not enumerated by this source scan.

### 12. Lists and mapped scrolling

There are **16 actual `FlatList` JSX sites**, one of them `Animated.FlatList`, no FlashList. All main data lists use an ID/date-derived key; homework submissions fall back to array index when ID is absent ([`homework/[homeworkId].tsx:383-390`](../src/app/(app)/homework/[homeworkId].tsx#L383)). Stable `renderItem`/memoized rows exist for notice, reservations, groups, time slots, lesson logs and charts. `TicketTabScene` and homework use inline `renderItem`; `TicketCard` is not memoized ([`TicketTabScene.tsx:126-156`](../src/components/golf/TicketTabScene.tsx#L126)). `getItemLayout` exists for banner, heatmap and weekly chart fixed-width horizontal lists ([`HomeBanner.tsx:94-109`](../src/components/golf/HomeBanner.tsx#L94), [`activity-heatmap.tsx:340-355`](../src/design-system/components/charts/activity-heatmap.tsx#L340), [`weekly-summary.tsx:225-245`](../src/design-system/components/charts/weekly-summary.tsx#L225)); dynamic-height vertical lists do not provide it. `estimatedItemSize` is not a FlatList prop and is not present. Two empty/error lists in tickets and reservations and one in lesson logs retain pull-to-refresh. Other lists: home banners, member groups, session selector, lesson slots, time slots, homework submissions, lesson logs, notice, tickets and reservations. `ScrollView` with mapped data is limited to small preference options and bounded chart legend; Android month/year picker uses a short `ScrollView` ([`ProfilePreferenceRow.tsx:105-121`](../src/components/golf/profile/ProfilePreferenceRow.tsx#L105), [`activity-heatmap.tsx:105-132`](../src/design-system/components/charts/activity-heatmap.tsx#L105), [`ShareMonthYearPicker.android.tsx:31`](../src/components/golf/ShareMonthYearPicker.android.tsx#L31)). Generic `Screen` scrolls most page content, but no virtualized list is nested in its same-direction ScrollView in the inspected routes ([`Screen.tsx:76-84`](../src/design-system/components/Screen.tsx#L76)).

### 13–15. Images, animation, native hosts

Remote banners, profile avatars, resource media, and reservation images use `expo-image`, generally with fixed view dimensions or aspect ratio; the reservation detail explicitly sets `cachePolicy="memory-disk"`, `recyclingKey` and a transition ([`reservation/[id].tsx:885-898`](../src/app/(app)/reservation/[id].tsx#L885)). Other remote `expo-image` uses have no explicit placeholder/cache policy; `expo-image` defaults were not reinterpreted as a defect. Share-card artwork/avatar capture and saved-preview thumbnail use React Native `Image` ([`MonthlyGolfShareCard.tsx:93-151`](../src/components/golf/MonthlyGolfShareCard.tsx#L93), [`ActivitySharePreview.tsx:183-184`](../src/components/golf/ActivitySharePreview.tsx#L183)). No asset byte-size analysis was performed. Skeleton/CircleLoader use Reanimated; session overflow cue uses a shared value/worklet; ticket/reservation TabView indicator and AppToast use RN `Animated`, with AppToast `useNativeDriver: true` ([`AppToast.tsx:96-105`](../src/design-system/components/AppToast.tsx#L96), [`AppToast.tsx:146-160`](../src/design-system/components/AppToast.tsx#L146)). Banner moves on a five-second timer; minute clocks update reservation/slot screens. No per-frame React state updates found. Static scan counts **31 explicit `<Host>` sites in 28 files**, plus **183 `<NativeText>` JSX sites**; each `NativeText` creates a `Host` ([`NativeText.tsx:38-65`](../src/design-system/components/NativeText.tsx#L38)). This is a structural native-tree cost, not measured latency.

### 16–18. Auth, Sentry, push, i18n

Root [`authClient.useSession()`](../src/app/_layout.tsx#L58) controls protected routes; root local bootstrap state prevents later refresh from unmounting the navigator. A session change rerenders root and its descendants, while the protected `(app)` subtree mounts/unmounts on auth guard changes. Better Auth uses SecureStore and disables session focus refetch ([`auth-client.ts:9-27`](../src/lib/auth-client.ts#L9)); foreground verification separately calls `getSession` and invalidates notification/lesson-log queries ([`(app)/_layout.tsx:54-91`](../src/app/(app)/_layout.tsx#L54)). Sentry is initialized at module load with logs enabled, replay sample `0.1` and on-error replay `1`, unless public `DISABLE_REPLAY=1`; no explicit tracing/profiling sample rates or per-navigation callbacks in source ([`_layout.tsx:29-52`](../src/app/_layout.tsx#L29)). Push registration/listeners start after auth, welcome, theme and update readiness ([`_layout.tsx:144-147`](../src/app/_layout.tsx#L144), [`usePushNotification.ts:82-137`](../src/lib/hook/shared/usePushNotification.ts#L82)). i18n bundles five resource files at import time, initializes with device language and asynchronously restores a stored choice ([`i18n/index.ts:5-27`](../src/i18n/index.ts#L5), [`i18n/index.ts:61-92`](../src/i18n/index.ts#L61)).

## Phase 1 — findings A: avoidable runtime work

| ID | Evidence and why it costs time | Proposed smallest fix | Risk | Impact |
| --- | --- | --- | --- | --- |
| **A01** | [`_layout.tsx:169-190`](../src/app/_layout.tsx#L169), [`app-update.ts:56-72`](../src/lib/update/app-update.ts#L56): the navigator waits on an online version request that can take five seconds before abort, delaying first UI. | Decide whether force-update policy permits rendering the navigator while the check runs; this changes gate behavior and needs approval. | high | high |
| **A02** | [`theme.ts:218-245`](../src/design-system/utils/theme.ts#L218), [`_layout.tsx:149-168`](../src/app/_layout.tsx#L149): a mode/brand update changes the single context for all 58 consumer files and rebuilds navigation theme. The theme must update, but broad propagation creates work during the tap. | First remove concrete unnecessary subscribers/state (A03, B04); then consider only evidence-backed fan-out reduction while preserving colors. No new provider by default. | high | high |
| **A03** | [`usePushNotification.ts:13-17`](../src/lib/hook/shared/usePushNotification.ts#L13), [`usePushNotification.ts:89-115`](../src/lib/hook/shared/usePushNotification.ts#L89), [`usePushNotification.ts:139-142`](../src/lib/hook/shared/usePushNotification.ts#L139), [`_layout.tsx:144-147`](../src/app/_layout.tsx#L144): push token and received notification are saved as React state and returned, but the sole caller ignores the return; each event rerenders root. | Delete both states, their listener that only sets state, and the unused return object; keep registration/navigation listeners. | low | medium |
| **A04** | [`(tabs)/index.tsx:40-49`](../src/app/(app)/(tabs)/index.tsx#L40), [`useBanner.ts:5-13`](../src/lib/hook/useBanner.ts#L5): the home focus effect calls `refetchBanners` even within the banner query's five-minute freshness window, adding a request on each revisit. | Remove the focus refetch if freshness policy permits, relying on query stale behavior and explicit pull-to-refresh. | medium | medium |
| **A05** | [`ActivityOverview.tsx:36-58`](../src/components/golf/ActivityOverview.tsx#L36), [`ActivityOverview.tsx:103-107`](../src/components/golf/ActivityOverview.tsx#L103): year activity and selected-day reservations both use 30-second polling while focused, causing repeated network and chart/list updates. | Confirm required freshness; remove or lengthen polling if the product permits, retaining explicit refresh. | medium | medium |
| **A06** | [`_layout.tsx:29-52`](../src/app/_layout.tsx#L29): Sentry always enables logs and samples replay for 10% of sessions and 100% of error sessions unless a public environment override is set. This adds capture work in builds using default settings. | Agree on release observability levels, then lower/disable replay or logs as approved; no performance gain is asserted without measurement. | medium | medium |
| **A07** | [`profile/index.tsx:143-149`](../src/app/(app)/(tabs)/profile/index.tsx#L143), [`profile/index.tsx:423-427`](../src/app/(app)/(tabs)/profile/index.tsx#L423), [`useLessonLog.ts:13-18`](../src/lib/hook/useLessonLog.ts#L13), [`member-lesson-log.service.ts:6-12`](../src/service/member-lesson-log.service.ts#L6): profile fetches `/member/lesson-logs` returning an array primarily to show `.length`; the request and response can grow with history. | A count endpoint would change service/API behavior; with current API, preserve behavior and leave the query. Product/API decision needed. | medium | medium |
| **A08** | [`NativeText.tsx:33-65`](../src/design-system/components/NativeText.tsx#L33): each of 183 `NativeText` call sites creates its own Host and subscribes to full ThemeContext, so mode changes update many native subtrees. | For repeated dense rows/charts only, consider existing RN/SVG text exception where visual and accessibility parity can be proved; avoid replacing general native text without approval. | high | medium |
| **A09** | [`ActivityOverview.tsx:3-4`](../src/components/golf/ActivityOverview.tsx#L3), [`ActivityOverview.tsx:115-125`](../src/components/golf/ActivityOverview.tsx#L115), [`ActivitySharePreview.tsx:1-19`](../src/components/golf/ActivitySharePreview.tsx#L1), [`useShareCardExport.ts:2-8`](../src/hooks/useShareCardExport.ts#L2): the activity path imports and mounts share card/export code even in loading/error states before share opens, adding initialization and hooks to that tab. | Mount share content only on request if its control can stay available and state/transition behavior remains equivalent; module splitting requires checking the resulting UX. | medium | medium |
| **A10** | [`(app)/_layout.tsx:54-83`](../src/app/(app)/_layout.tsx#L54), [`useNotification.ts:45-54`](../src/lib/hook/shared/useNotification.ts#L45): every foreground return invalidates notification count/list and lesson logs; profile/log queries may refetch even when their own 60s freshness period has not elapsed. | Narrow foreground invalidation only if freshness expectations permit; distinguish session verification from data refresh. | medium | low |

## Phase 1 — findings B: unnecessary logic and maintenance cost

| ID | Evidence and why it costs complexity | Proposed smallest fix | Risk | Impact |
| --- | --- | --- | --- | --- |
| **B01** | [`useNotification.ts:57-110`](../src/lib/hook/shared/useNotification.ts#L57): all four mutation success handlers invalidate `["notifications"]`, which already matches `["notifications", "unread-count"]`, then invalidate that unread key again. This schedules redundant cache work. | Delete the second invalidation in each handler, preserving broad notification refresh. | low | low |
| **B02** | [`theme.ts:145-149`](../src/design-system/utils/theme.ts#L145), [`theme.ts:199-202`](../src/design-system/utils/theme.ts#L199), [`_layout.tsx:120-136`](../src/app/_layout.tsx#L120): temporary public-env theme timing probe, global timestamp and render/RAF logging remain in source, plus a lint suppression. | Delete the probe branches and suppression; confirm no active manual probe depends on them. | low | low |
| **B03** | [`(tabs)/index.tsx:50-67`](../src/app/(app)/(tabs)/index.tsx#L50): development-only banner logging maps the full banner collection after query updates; this is debugging work unrelated to UI. | Delete the effect and now-unused query fields. | low | low |
| **B04** | [`time-helper.ts:74-115`](../src/utils/time-helper.ts#L74), [`time-helper.ts:139-145`](../src/utils/time-helper.ts#L139): `prettyDate`, `prettyDateTime`, both `shortDate*WithWeekday` exports, `fmtDays`, `parseDateSafely`, `parseTimeSafely`, and `trimSeconds` have no references elsewhere in the repository; they retain unused formatting/parse paths and a weekday table. | Delete these exports and dependencies used only by them after approved cleanup; this is a private app with no identified external importer. | low | low |

## Suspicions — no confirmed finding or source edit

- No device measurements identify the dominant cause of a slow theme tap. `Appearance.setColorScheme`, React context fan-out, NativeWind CSS propagation, navigation theme, and native Host updates all occur, but their individual elapsed times are unknown ([`theme.ts:199-245`](../src/design-system/utils/theme.ts#L199), [`_layout.tsx:149-168`](../src/app/_layout.tsx#L149)).
- The repo has no explicit Babel config. SDK defaults may correctly install the worklet transform, but static source alone cannot certify it. Likewise New Architecture and Hermes are not explicit in app config.
- [`design-system/index.ts`](../src/design-system/index.ts) exports many components and charts; Metro/Compiler dead-code behavior and startup bundle impact were not measured. Do not split the barrel solely for its size.
- `React Compiler` is enabled. Existing `useMemo`, `useCallback`, and `memo` calls may be redundant, but removal is not evidence-backed without generated-code or profiling evidence. Several clearly stabilize `FlatList` rows and expensive chart transforms. Likewise `useAppUpdate` syntactically returns fresh callbacks/object ([`use-app-update.ts:61-99`](../src/lib/update/use-app-update.ts#L61)), but compiler output must be checked before calling it a context fan-out finding.
- The native tab implementation may keep visited tabs mounted. The route code does not establish which screens are preloaded or whether blur pauses every native/list effect; activity queries do pass focus as `enabled`.
- Remote images without explicit placeholders/cache props might still use `expo-image` defaults effectively; image byte sizes and on-device decode/cache behavior were not inspected.
- Theme preference and language writes can overlap rapid taps; whether persistence order differs on device is unknown ([`theme.ts:199-216`](../src/design-system/utils/theme.ts#L199), [`app-theme.md`](app-theme.md)).
- The profile lesson-log query's response size is unknown. Its use for a count is proven, but the actual cost depends on member history and API payload.
- Sentry Metro source-map upload and release minification are governed by toolchain/EAS defaults and remote environment, not fully represented in checked-in config.

## Dependencies to remove (candidates, not approved changes)

The only runtime dependencies with neither `src` imports nor checked-in app/Metro config references are **`expo-blob`, `expo-blur`, and `expo-network`** ([`package.json`](../package.json)). Check lockfile reverse dependencies, Expo module peers/autolinking, and generated native config before removing. `expo-linking`, `react-dom`, `react-native-web`, `react-native-pager-view`, `react-native-screens`, and `react-native-worklets` also lack direct `src` imports but have plausible framework, platform, or peer roles. `expo-dev-client`, `expo-updates`, and config plugins have build/runtime roles without source imports. No dependency was removed in this phase.

## Questions for the owner

1. Which finding IDs should be cleaned after this report? The requested category order will be used. In particular, may the force-update check stop blocking initial navigation (**A01**), or must it stay a hard gate?
2. For **A04/A05/A10**, what freshness is required for banners, activity/day reservations, and foreground notifications/lesson logs? The current refetch/polling may be intentional.
3. For **A06**, what Sentry replay/logging policy should preview and production keep? For **A07**, is an API count endpoint available, or should the full list remain for its badge?
4. Is `EXPO_PUBLIC_THEME_PROBE` still used for manual testing (**B02**)? There is no checked-in env example for it.
5. The brief asks whether worklets are configured in a Babel config, but this checkout has no `babel.config.js`. Was a custom Babel config expected, or is the Expo SDK default intentional?

## Verification boundary

Only code/config reads were performed. `tsc` and `eslint` were not run because there were no source edits and the brief reserves them for approved cleanup batches. Device speed, animation feel, visual parity, build output and dependency removability remain unverified.
