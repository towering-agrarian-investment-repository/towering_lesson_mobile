# Mobile App Reference Guide & Next-Project Playbook

A guide to how **HappyGolf GO** (`towering_lesson_mobile`) is built, where to find each feature, and which patterns to carry into your next mobile app. The app runs on Android and iOS with Expo SDK 58.

Paths below were verified against the source tree. If they drift again, trust the code and update this file.

---

## 1. Architecture at a Glance

The codebase enforces a strict **one-way data and UI flow** so screens stay thin and predictable:

```text
Screen (src/app/)
  ├─ UI Primitives (src/design-system/) & Feature Views (src/components/)
  └─ React Query Hooks (src/lib/hook/)
       └─ Stateless API Services (src/service/)
            └─ Shared Fetch Client (src/lib/client/api-client.ts) + Types (src/types/)
```

### Layer responsibilities

- **Screens (`src/app/`)** coordinate route params, navigation, user interactions, and loading, error, empty, and content states. They read server data directly from query hooks.
- **Design System (`src/design-system/`)** holds reusable, domain-agnostic building blocks (`Screen`, `AppText`, `ActionButton`, `AnimatedPressable`, `PendingBottomSheet`, `SwipeableTabBar`, `ListRetryFooter`, `EmptyState`, `ErrorState`, `Skeleton`).
- **Feature Components (`src/components/`)** hold domain cards and sections (`ReservationCard`, `TicketHistoryCard`, `ActivityOverview`, `SessionResourceSection`, `BayReservationNoteEditor`).
- **Hooks (`src/lib/hook/`)** own TanStack Query keys, `staleTime`, cache seeding, optimistic rollbacks, shared foreground clocks, and toast error handling.
- **Services (`src/service/`)** own API calls and return typed responses. Query reads pass an `AbortSignal` through to the request.

---

## 2. Feature & Implementation Map (Use as Reference)

| Feature / Capability | Where It Lives in This Project | Key Implementation Pattern |
| :--- | :--- | :--- |
| **App Bootstrap, Auth & Guards** | [Root layout](../src/app/_layout.tsx)<br>[Startup preferences](../src/lib/startup-preferences.ts)<br>[Auth client](../src/lib/auth-client.ts)<br>[App update hook](../src/lib/update/use-app-update.ts) | The native splash stays up until theme, language, welcome, and auth are ready. Startup preferences are read once with `AsyncStorage.multiGet`. `AuthorizedHrefObserver` isolates route/param tracking from `RootLayout` so navigations do not re-render root providers. Better Auth stores session credentials in SecureStore and checks the member role. The version check runs independently and fails open; a confirmed mandatory update shows `AppUpdateGate`. Home mounts banners, tickets, and today's reservations in parallel while profile loads. |
| **Native Launch Screen** | [Expo config](../app.json)<br>[Light artwork](../assets/images/happy-golf-splash-light.png)<br>[Dark artwork](../assets/images/happy-golf-splash-dark.png) | `expo-splash-screen` bundles dedicated light and dark launch artwork selected by system appearance. Changes to the native splash assets or plugin config take effect in a fresh native build. |
| **Main Tabs & Stack Headers** | [src/app/(app)/(tabs)/_layout.tsx](../src/app/(app)/(tabs)/_layout.tsx)<br>[Android tab icons](../assets/images/tabs)<br>[src/design-system/utils/theme.ts](../src/design-system/utils/theme.ts) | `NativeTabs` from `expo-router/native-tabs` renders platform-native tab bars (with unread badge count). iOS uses SF Symbols with zero bundled tab PNGs; Android uses local `@1x/@2x/@3x` PNGs gated behind `process.env.EXPO_OS === "android"`. Nested `Stack` layouts share `getStackHeaderOptions(colors)`. |
| **Screen Layout & Safe Areas** | [`Screen`](../src/design-system/components/Screen.tsx) | Phones and tablets share a centered 430-point column with 16-point horizontal padding and safe-area adjustments. Use `scroll={false}` for a screen with its own virtualized list. `Screen` also handles keyboard-aware scrolling and fixed footers. |
| **Theme, Dynamic Type & Languages** | [Theme](../src/design-system/utils/theme.ts)<br>[CSS tokens](../src/global.css)<br>[i18n](../src/i18n/index.ts)<br>[Startup preferences](../src/lib/startup-preferences.ts) | Persists system/light/dark, blue/green primary color, and language preferences in AsyncStorage, hydrated via one shared `multiGet` call. The root maps theme values to CSS variables. `ThemeProvider` listens only to iOS `fontScale` changes (Android Compose scales natively). English loads eagerly and `ko`, `ja`, `zh`, and `km` translation bundles lazy-load on demand. |
| **Hybrid Native Controls (`@expo/ui`)** | [`ActionButton`](../src/design-system/components/ActionButton.tsx)<br>[`PendingBottomSheet`](../src/design-system/components/PendingBottomSheet.tsx)<br>[Android sheet](../src/design-system/components/PendingBottomSheet.android.tsx) | Uses SwiftUI and Jetpack Compose controls for native buttons and sheets, with React Native views and NativeWind 5 for layout and card surfaces. `PendingBottomSheet` lazy-mounts on first presentation on both platforms (keeping the iOS host mounted after first open so SwiftUI finishes dismissing). |
| **Tactile Press Feedback** | [Android pressable](../src/design-system/components/AnimatedPressable.android.tsx)<br>[iOS pressable](../src/design-system/components/AnimatedPressable.ios.tsx)<br>[`TicketCard`](../src/components/golf/TicketCard.tsx) | Platform-split pressable: Android uses core RN `Pressable` (zero Reanimated worklets) with a theme-tinted highlight clipped to the pressable's corners. iOS uses a single `ReanimatedPressable` (zero `ThemeContext` subscription) with a brief UI-thread scale that respects Reduce Motion. Put the visible card's radius on the pressable itself. |
| **Connectivity & Query Cache** | [Signed-in layout](../src/app/(app)/_layout.tsx)<br>[API client](../src/lib/client/api-client.ts)<br>[`OfflineBanner`](../src/design-system/components/OfflineBanner.tsx) | Expo Network feeds TanStack Query's online manager, and `Screen` displays an offline banner. Fetched data is cached in memory during the signed-in session and cleared on sign-out. Mutations use `networkMode: "always"` so non-GET requests through `apiClient` fail immediately with a localized offline error and require a new user action after reconnect. |
| **Bay & Lesson Booking Flow** | [Date selection](../src/components/golf/booking/SelectDatePicker.tsx)<br>[Calendar locales](../src/lib/calendar-locale.ts)<br>[Bay confirmation](../src/app/(app)/bay-booking-confirm.tsx)<br>[Bay note drafts](../src/lib/booking/bay-notes-draft.ts)<br>[Lesson confirmation](../src/app/(app)/lesson-booking-confirm.tsx) | `SelectDatePicker` renders a custom horizontal month `FlatList` and 7-column grid (no `react-native-calendars`) with circular day highlights, cached date labels, and swipe-width realignment. Bay availability is keyed by ticket and date range; lesson availability by ticket and month; bay day previews seed with `{ updatedAt: 0 }`. `bay-booking-confirm` saves up to 10 recent bay note drafts via `form.subscribe()` (cleared on sign-out or booking) and preserves notes across `409 RESERVATION_SLOT_UNAVAILABLE` slot refreshes. |
| **Reservation Details & Actions** | [Detail route](../src/app/(app)/reservation/%5Bid%5D.tsx)<br>[Booking success](../src/app/(app)/booking-success.tsx)<br>[Bay note editor](../src/components/golf/reservation/BayReservationNoteEditor.tsx)<br>[Detail components](../src/components/golf/reservation/detail) | Shows a list-row preview while full details load and gives program reservations a Lesson Program badge. Members can edit bay reservation notes after booking on Booking Success and Reservation Details while `RESERVED` and before start time (gated by `canEditMemberNotes` on details). The action footer appears only for `RESERVED` items with `isCancellable: true`; cancellation uses a pending confirmation sheet and rescheduling supports eligible bay reservations. |
| **Tickets & Pause History** | [Home tickets](../src/components/golf/MyTicket.tsx)<br>[Ticket details](../src/app/(app)/tickets/%5Bid%5D.tsx)<br>[Pause date rules](../src/utils/ticket-pause.ts) | Home requests `ACTIVE` and `IN_USE` tickets. Cards show current and upcoming periods from `pauses[]`, and details show the full history. The calendar and confirmations block bay bookings, lesson bookings, and bay reschedules during a pause, including both boundary dates. Members can choose dates outside the pause. |
| **Infinite Feeds & Pager Tabs** | [Reservation scene](../src/components/golf/reservation/ReservationTabScene.tsx)<br>[Ticket history](../src/app/(app)/ticket-history.tsx)<br>[Ticket scene](../src/components/golf/TicketTabScene.tsx)<br>[`SwipeableTabBar`](../src/design-system/components/SwipeableTabBar.tsx) | Pairs `react-native-pager-view` with `SwipeableTabBar` and cursor-paginated `FlashList` scenes. `ReservationTabScene` and `TicketHistoryScreen` emit typed flat `header`/`item` entries with `WeakMap`-stabilized item references; `ReservationScreen` gates inactive retained tabs with `useIsFocused()` so mutations refetch only the focused active tab. Uses `ListRetryFooter` for load-more retry and `usePullToRefresh` for refresh. |
| **Notification Feed & Push** | [Notice route](../src/app/(app)/(tabs)/notice/index.tsx)<br>[Notice components](../src/components/golf/notice)<br>[Push registration](../src/lib/config/notification/registerPushNotification.ts)<br>[Push storage](../src/lib/config/notification/pushRegistrationStorage.ts) | The feed shows a skeleton on initial fetch, an offline state if the first fetch pauses, and an empty state on an empty response. Swipe-to-delete uses recycled `FlashList` rows and a shared pending guard across optimistic changes. Push registration is serialized with a sign-out generation guard and caches confirmed `{ userId, installationId, token }` in SecureStore to skip redundant cold-start backend writes until token rotation or sign-out. |
| **Profile & Forms** | [Profile sections](../src/components/golf/profile/ProfileSections.tsx)<br>[Profile edit](../src/app/(app)/profile/edit.tsx)<br>[`FormTextInput`](../src/components/ui/form/FormTextInput.tsx) | Profile delegates settings and sign-out to feature components. Edit forms use React Hook Form and Zod with field-level `useController` subscriptions. Profile photo changes stage an upload through a presigned URL before committing it with the API. |
| **Homework Detail & Uploads** | [Homework route](../src/app/(app)/homework/%5BhomeworkId%5D.tsx)<br>[Composer](../src/components/golf/homework/HomeworkSubmissionComposer.tsx)<br>[Homework utilities](../src/components/golf/homework/homework-utils.ts)<br>[Submission hook](../src/lib/hook/useMemberLessonFlow.ts) | Feature components render the composer, reviews, and submission history. Draft autosave is debounced via `form.subscribe()` (flushing on blur, background, and unmount) while `HomeworkDraftGuard` isolates `useWatch` for unsaved-draft navigation confirmation. Submission uploads via a presigned S3 URL before committing to the API. |
| **Activity Heatmap & Recap Poster** | [Activity overview](../src/components/golf/ActivityOverview.tsx)<br>[Heatmap](../src/design-system/components/charts/activity-heatmap.tsx)<br>[Share trigger](../src/components/golf/ActivitySharePreview.tsx)<br>[Share preview modal](../src/components/golf/share/ActivitySharePreviewModal.tsx)<br>[Export hook](../src/lib/hook/useShareCardExport.ts) | The horizontal `FlatList` renders week columns (`windowSize={3}`, cached date labels) bucketed in `Asia/Phnom_Penh`. A paused initial query shows an offline state. `ActivitySharePreview` lazy-loads `ActivitySharePreviewModal`, whose `TabView` uses `lazy` so `YearlyShareCard` mounts only on the Year tab. Monthly and yearly posters capture at 1080 × 1350 with `react-native-view-shot`. |
| **Recap Period Picker** | [iOS picker](../src/components/golf/ShareMonthYearPicker.tsx)<br>[Android picker](../src/components/golf/ShareMonthYearPicker.android.tsx) | iOS uses the native wheel picker. Android uses Material 3 `FilterChip` controls with 48 dp touch targets and matched selected corners across year chips and the three-column month grid, with year-only mode for yearly posters. |
| **Documents, Links & Lesson Video** | [External URL helper](../src/utils/open-external-url.ts)<br>[Session resources](../src/components/golf/SessionResourceSection.tsx) | Homework attachment links, lesson resources, and external home banners open HTTP(S) links in the platform's in-app browser. Other schemes or browser errors fall back to the system URL handler. Deferred videos mount an `expo-video` player on tap and start on that tap. |
| **Clocks, Timezones & Release Config** | [Foreground clocks](../src/lib/hook/useMinuteClock.ts)<br>[Time helpers](../src/utils/time-helper.ts)<br>[Metro config](../metro.config.js)<br>[Expo config](../app.json) | `useMinuteClock` shares one foreground timer and `AppState` listener across all consumers; `useDayClock` sleeps until the next `Asia/Phnom_Penh` midnight. `time-helper.ts` fast-paths clock strings and formats validated `Date`s directly via cached `Intl.DateTimeFormat` instances. `metro.config.js` enables `inlineRequires: true`, `src/` uses subpath imports for `lucide-react-native` and `date-fns`, and `app.json` pins Android R8 minification, `shrinkResources`, disabled Fresco GIF/WebP codecs, and iOS `disableLibdav1d: true`. |

---

## 3. Top 8 Lessons Learned (Pitfalls to Avoid in Future Apps)

1. **Seeding React Query Detail/Day Caches from Parent Queries**
   - Calling `setQueryData(dayKey, previewData)` timestamps the preview as fresh. A subsequent prefetch within `staleTime` can then skip the server request.
   - Pass `{ updatedAt: 0 }` when seeding a partial preview so the screen can display it immediately and still fetch the full response.

2. **Press Feedback on Rounded Surfaces (Platform Split)**
   - Animated opacity can override disabled styling, and an extra inner layout wrapper can change how children flex. Keep one `ReanimatedPressable` with scale as its only animated style on iOS (without subscribing to `ThemeContext`), and use core RN `Pressable` on Android so list rows allocate zero Reanimated worklets.
   - The Android highlight follows the pressable's radius. A radius on a child card or on the surrounding Profile section can leave an individual row's highlight square.

3. **Keyboard-Aware Forms Inside Native Stacks**
   - Inset-based keyboard avoidance can collapse form content inside a native stack when combined with sticky keyboard views or overlays in the scroll tree.
   - `Screen` uses `KeyboardAwareScrollView` in `mode="layout"` with `style={{ flex: 1 }}`. Render bottom sheets and modals as siblings of `Screen`.

4. **`FlashList` Row Recycling + `ReanimatedSwipeable`**
   - Pass `renderScrollComponent={GestureHandlerScrollView}` to `FlashList`. Use `friction={1}`, `dragOffsetFromLeft={10}`, `dragOffsetFromRight={-10}`, and `rightThreshold={32}` for interactive opening and closing.
   - Reset the swipeable ref in `useLayoutEffect` when `item.id` changes so a recycled row starts closed. Close the open row when vertical scrolling starts.

5. **Overlapping Optimistic Mutations Need One Shared Pending Guard**
   - A failed notification mutation can restore an old snapshot over a later successful change. Gate mark-read and deletion actions with one shared pending guard from snapshot through settlement.
   - Reservation, reschedule, and homework-submit flows wait for the server before committing results to the UI.

6. **Chart Interactions During Period Changes**
   - Keeping previous data visible avoids layout shifts during a filter change. Disable the chart while `isPlaceholderData` is true and check the selected date against the loaded range before querying day details.

7. **iOS `@expo/ui` Button Hit Targets**
   - The tappable area of a plain SwiftUI button follows its label. Apply `contentShape(shapes.rectangle())` after `frame({ maxWidth: Infinity, minHeight: 48 })` on the inner text or row to make the whole visible button tappable. `ActionButton` centralizes these modifiers.

8. **Barrel Imports & Eager Module Evaluation in Metro**
   - Metro ships with tree shaking off by default, so barrel imports from `lucide-react-native` or `date-fns/locale` bundle thousands of unused modules, and eager `require()` evaluates every route on cold start.
   - Use direct subpath imports (`lucide-react-native/icons/*`, `date-fns/*`), gate platform-only assets behind `process.env.EXPO_OS`, lazy-load secondary locales and heavy modals, enable `inlineRequires: true` in `metro.config.js`, and pin Android release shrinking in `app.json`.

---

## 4. Recommendations & Setup Checklist for Your Next Mobile App

### A. Core Stack to Keep

- Use Expo Router with `NativeTabs` for main tabs and native `Stack` for detail flows.
- Pair NativeWind 5 and Tailwind CSS 4 for React Native surfaces with `@expo/ui` for platform controls.
- Keep a single TanStack Query v5 client per signed-in layout and an API client that sets `Accept-Language`, `X-App-Client`, `X-App-Platform`, and `X-App-Version`.
- Use `FlashList` for cursor-paginated feeds and `FlatList` for bounded virtualized lists. Drive continuous motion with Reanimated shared values.
- Use React Hook Form (`useController` / `form.subscribe()` for non-re-rendering draft sync) with Zod and `react-native-keyboard-controller` for form scrolling.

### B. Build These 6 Primitives Before Any Feature Screen

1. **`Screen`** centralizes the 430-point width cap, 16-point padding, safe areas, offline banner, keyboard-aware scrolling, and fixed footers.
2. **`AppText`** provides the type ramp, semantic text colors, and tabular numerals for React Native surfaces.
3. **`ActionButton`** wraps `@expo/ui` with filled, outlined, and text appearances, primary and danger tones, loading/disabled states, haptics, and a full-width iOS hit target.
4. **`AnimatedPressable`** provides a clipped highlight on Android (plain `Pressable`), timed scale feedback on iOS (`ReanimatedPressable`), and optional selection or impact haptics.
5. **`PendingBottomSheet`** lazy-mounts the native sheet on first open and lets confirmations block dismissal while pending.
6. **`FormTextInput` and `FormPasswordInput`** connect core React Native inputs to `useController`. The password field preserves focus across visibility changes.

### C. Engineering Guardrails to Copy Over

- Keep project rules and native layout lessons close to the code. [Project working guide](../AGENTS.md) · [Native UI gotchas](native-ui-gotchas.md)
- `pnpm test` discovers `scripts/startup-compat.test.cjs` and every `scripts/tests/*.test.cjs`. Coverage includes startup compatibility, timezone/clock and activity calculations, bay note drafts, push registration and auth recovery, homework states and attachment validation, booking cache keys, refresh and pagination, keyboard layout, and native typography. [Test runner](../scripts/run-tests.cjs) · [Test suites](../scripts/tests)
- CI installs with the frozen pnpm lockfile and runs `pnpm exec prettier --check .`, `pnpm exec tsc --noEmit`, `pnpm exec eslint src`, and `pnpm test`. Follow the device checklist for visual behavior, native controls, and complete booking flows. [CI](../.github/workflows/checks.yml) · [Device QA](qa-checklist.md)
- Keep native build profiles, release shrinking flags (`enableMinifyInReleaseBuilds`, `enableShrinkResourcesInReleaseBuilds`, `disableLibdav1d`), and EAS Update channels aligned with their environments. Changes to native config or resources need a compatible native build. [EAS profiles](../eas.json) · [Expo config](../app.json) · [Build and run](build-and-run.md) · [Local development](local-development.md)
