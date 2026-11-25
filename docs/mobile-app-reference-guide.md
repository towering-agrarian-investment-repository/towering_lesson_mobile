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
- **Feature Components (`src/components/`)** hold domain cards and sections (`ReservationCard`, `TicketHistoryCard`, `ActivityOverview`, `SessionResourceSection`).
- **Hooks (`src/lib/hook/`)** own TanStack Query keys, `staleTime`, cache seeding, optimistic rollbacks, and toast error handling.
- **Services (`src/service/`)** own API calls and return typed responses. Query reads pass an `AbortSignal` through to the request.

---

## 2. Feature & Implementation Map (Use as Reference)

| Feature / Capability | Where It Lives in This Project | Key Implementation Pattern |
| :--- | :--- | :--- |
| **App Bootstrap, Auth & Guards** | [Root layout](../src/app/_layout.tsx)<br>[Auth client](../src/lib/auth-client.ts)<br>[App update hook](../src/lib/update/use-app-update.ts) | The native splash stays up until theme, language, welcome, and auth are ready. Better Auth stores session credentials in SecureStore and the route guard checks the member role. The version check runs independently and fails open on errors. A confirmed mandatory update shows `AppUpdateGate`. |
| **Native Launch Screen** | [Expo config](../app.json)<br>[Light artwork](../assets/images/happy-golf-splash-light.png)<br>[Dark artwork](../assets/images/happy-golf-splash-dark.png) | `expo-splash-screen` bundles dedicated light and dark launch artwork selected by system appearance. Changes to the native splash assets or plugin config take effect in a fresh native build. |
| **Main Tabs & Stack Headers** | [src/app/(app)/(tabs)/_layout.tsx](../src/app/(app)/(tabs)/_layout.tsx)<br>[src/design-system/utils/theme.ts](../src/design-system/utils/theme.ts) | `NativeTabs` from `expo-router/native-tabs` for platform-native tab bars (with unread badge count); nested `Stack` layouts share `getStackHeaderOptions(colors)` from the theme module. |
| **Screen Layout & Safe Areas** | [`Screen`](../src/design-system/components/Screen.tsx) | Phones and tablets share a centered 430-point column with 16-point horizontal padding and safe-area adjustments. Use `scroll={false}` for a screen with its own virtualized list. `Screen` also handles keyboard-aware scrolling and fixed footers. |
| **Theme, Dynamic Type & Languages** | [Theme](../src/design-system/utils/theme.ts)<br>[CSS tokens](../src/global.css)<br>[i18n](../src/i18n/index.ts) | Persists system/light/dark, blue/green primary color, and language preferences in AsyncStorage. The root maps theme values to CSS variables. Explicit native font sizes use the shared font scale on iOS and Compose scaling on Android. Supported languages are English, Khmer, Korean, Japanese, and Chinese. |
| **Hybrid Native Controls (`@expo/ui`)** | [`ActionButton`](../src/design-system/components/ActionButton.tsx)<br>[`PendingBottomSheet`](../src/design-system/components/PendingBottomSheet.tsx) | Uses SwiftUI and Jetpack Compose controls for native buttons and sheets, with React Native views and NativeWind 5 for layout and card surfaces. |
| **Tactile Press Feedback** | [`AnimatedPressable`](../src/design-system/components/AnimatedPressable.tsx)<br>[`TicketCard`](../src/components/golf/TicketCard.tsx) | Android draws a theme-tinted highlight clipped to the pressable's corners. Put the visible card's radius on the pressable itself. iOS uses a brief UI-thread scale that respects Reduce Motion. |
| **Connectivity & Query Cache** | [Signed-in layout](../src/app/(app)/_layout.tsx)<br>[API client](../src/lib/client/api-client.ts)<br>[`OfflineBanner`](../src/design-system/components/OfflineBanner.tsx) | Expo Network feeds TanStack Query's online manager, and `Screen` displays an offline banner. Fetched data is cached in memory during the signed-in session and cleared on sign-out. Mutations use `networkMode: "always"` so non-GET requests through `apiClient` fail immediately with a localized offline error and require a new user action after reconnect. |
| **Bay & Lesson Booking Flow** | [Date selection](../src/components/golf/booking/SelectDatePicker.tsx)<br>[Bay confirmation](../src/app/(app)/bay-booking-confirm.tsx)<br>[Lesson confirmation](../src/app/(app)/lesson-booking-confirm.tsx) | Bay availability is keyed by ticket and date range. Lesson availability is keyed by ticket and month. Bay day previews are seeded with `{ updatedAt: 0 }` so the server result still loads. The server assigns a bay from the chosen time slot. A `409 RESERVATION_SLOT_UNAVAILABLE` refreshes slot choices and preserves notes when the member picks another time. |
| **Reservation Details & Actions** | [Detail route](../src/app/(app)/reservation/%5Bid%5D.tsx)<br>[Detail components](../src/components/golf/reservation/detail) | Shows a list-row preview while full details load and gives program reservations a Lesson Program badge. The action footer appears only for `RESERVED` items whose API response has `isCancellable: true`. Cancellation requires a connection and uses a pending confirmation sheet. Rescheduling is available for eligible bay reservations with a ticket. |
| **Tickets & Pause History** | [Home tickets](../src/components/golf/MyTicket.tsx)<br>[Ticket details](../src/app/(app)/tickets/%5Bid%5D.tsx)<br>[Pause date rules](../src/utils/ticket-pause.ts) | Home requests `ACTIVE` and `IN_USE` tickets. Cards show current and upcoming periods from `pauses[]`, and details show the full history. The calendar and confirmations block bay bookings, lesson bookings, and bay reschedules during a pause, including both boundary dates. Members can choose dates outside the pause. |
| **Infinite Feeds & Pager Tabs** | [src/components/golf/reservation/ReservationTabScene.tsx](../src/components/golf/reservation/ReservationTabScene.tsx)<br>[src/components/golf/TicketTabScene.tsx](../src/components/golf/TicketTabScene.tsx)<br>[src/design-system/components/SwipeableTabBar.tsx](../src/design-system/components/SwipeableTabBar.tsx) | Pairs `react-native-pager-view` with `SwipeableTabBar` and cursor-paginated `FlashList` scenes. Uses `ListRetryFooter` for inline load-more retry and `usePullToRefresh` for user-initiated refresh. |
| **Notification Feed & Push** | [Notice route](../src/app/(app)/(tabs)/notice/index.tsx)<br>[Notice components](../src/components/golf/notice)<br>[Push registration](../src/lib/config/notification/registerPushNotification.ts) | The feed shows a skeleton on its initial fetch, an offline state if the first fetch pauses, and an empty state once it has an empty response. Swipe-to-delete uses recycled `FlashList` rows and a shared pending guard across optimistic changes. The app registers Expo push tokens after sign-in. Alert sounds depend on OS settings and, on iOS, the push payload. |
| **Profile & Forms** | [Profile sections](../src/components/golf/profile/ProfileSections.tsx)<br>[Profile edit](../src/app/(app)/profile/edit.tsx)<br>[`FormTextInput`](../src/components/ui/form/FormTextInput.tsx) | Profile delegates settings and sign-out to feature components. Edit forms use React Hook Form and Zod with field-level `useController` subscriptions. Profile photo changes stage an upload through a presigned URL before committing it with the API. |
| **Homework Detail & Uploads** | [Homework route](../src/app/(app)/homework/%5BhomeworkId%5D.tsx)<br>[Homework utilities](../src/components/golf/homework/homework-utils.ts)<br>[Submission hook](../src/lib/hook/useMemberLessonFlow.ts) | Feature components render the composer, reviews, and submission history. The utilities derive the six display states and validate attachments. The composer saves local drafts, and submission uploads via a presigned S3 URL before submitting to the API. |
| **Activity Heatmap & Share Poster** | [Activity overview](../src/components/golf/ActivityOverview.tsx)<br>[Heatmap](../src/design-system/components/charts/activity-heatmap.tsx)<br>[Share preview modal](../src/components/golf/share/ActivitySharePreviewModal.tsx)<br>[Export hook](../src/lib/hook/useShareCardExport.ts) | The horizontal `FlatList` renders week columns. Activity date bucketing uses the business timezone, `Asia/Phnom_Penh`. A paused initial query shows an offline state. Monthly and yearly posters are captured at 1080 × 1350 with `react-native-view-shot` for sharing or saving to Photos. |
| **Share Period Picker** | [iOS picker](../src/components/golf/ShareMonthYearPicker.tsx)<br>[Android picker](../src/components/golf/ShareMonthYearPicker.android.tsx) | iOS uses the native wheel picker. Android uses Material 3 year chips and a three-column month grid, with year-only mode for yearly posters. |
| **Documents, Links & Lesson Video** | [External URL helper](../src/utils/open-external-url.ts)<br>[Session resources](../src/components/golf/SessionResourceSection.tsx) | Homework attachment links, lesson resources, and external home banners open HTTP(S) links in the platform's in-app browser. Other schemes or browser errors fall back to the system URL handler. Deferred videos mount an `expo-video` player on tap and start on that tap. |

---

## 3. Top 7 Lessons Learned (Pitfalls to Avoid in Future Apps)

1. **Seeding React Query Detail/Day Caches from Parent Queries**
   - Calling `setQueryData(dayKey, previewData)` timestamps the preview as fresh. A subsequent prefetch within `staleTime` can then skip the server request.
   - Pass `{ updatedAt: 0 }` when seeding a partial preview so the screen can display it immediately and still fetch the full response.

2. **Press Feedback on Rounded Surfaces**
   - Animated opacity can override disabled styling, and an extra inner layout wrapper can change how children flex. Keep one `ReanimatedPressable` with scale as its only animated style.
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

---

## 4. Recommendations & Setup Checklist for Your Next Mobile App

### A. Core Stack to Keep

- Use Expo Router with `NativeTabs` for main tabs and native `Stack` for detail flows.
- Pair NativeWind 5 and Tailwind CSS 4 for React Native surfaces with `@expo/ui` for platform controls.
- Keep a single TanStack Query v5 client per signed-in layout and an API client that sets `Accept-Language`, `X-App-Client`, `X-App-Platform`, and `X-App-Version`.
- Use `FlashList` for cursor-paginated feeds and `FlatList` for bounded virtualized lists. Drive continuous motion with Reanimated shared values.
- Use React Hook Form with Zod and `react-native-keyboard-controller` for form scrolling.

### B. Build These 6 Primitives Before Any Feature Screen

1. **`Screen`** centralizes the 430-point width cap, 16-point padding, safe areas, offline banner, keyboard-aware scrolling, and fixed footers.
2. **`AppText`** provides the type ramp, semantic text colors, and tabular numerals for React Native surfaces.
3. **`ActionButton`** wraps `@expo/ui` with filled, outlined, and text appearances, primary and danger tones, loading/disabled states, haptics, and a full-width iOS hit target.
4. **`AnimatedPressable`** provides a clipped highlight on Android, timed scale feedback on iOS, and optional selection or impact haptics.
5. **`PendingBottomSheet`** wraps the native sheet and lets confirmations block dismissal while pending.
6. **`FormTextInput` and `FormPasswordInput`** connect core React Native inputs to `useController`. The password field preserves focus across visibility changes.

### C. Engineering Guardrails to Copy Over

- Keep project rules and native layout lessons close to the code. [Project working guide](../AGENTS.md) · [Native UI gotchas](native-ui-gotchas.md)
- `pnpm test` discovers `scripts/startup-compat.test.cjs` and every `scripts/tests/*.test.cjs`. Coverage includes startup compatibility, timezone and activity calculations, homework states and attachment validation, booking cache keys, auth recovery, refresh and pagination, keyboard layout, and native typography. [Test runner](../scripts/run-tests.cjs) · [Test suites](../scripts/tests)
- CI installs with the frozen pnpm lockfile and runs `pnpm exec prettier --check .`, `pnpm exec tsc --noEmit`, `pnpm exec eslint src`, and `pnpm test`. Follow the device checklist for visual behavior, native controls, and complete booking flows. [CI](../.github/workflows/checks.yml) · [Device QA](qa-checklist.md)
- Keep native build profiles and EAS Update channels aligned with their environments. Changes to native config or resources need a compatible native build. [EAS profiles](../eas.json) · [Build and run](build-and-run.md) · [Local development](local-development.md)
