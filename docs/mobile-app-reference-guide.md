# Mobile App Reference Guide & Next-Project Playbook

A practical, non-overwhelming guide to how **Happy Golf Mobile** (`towering_lesson_mobile`) is built, how each feature is implemented, the hardest lessons learned on this branch, and what to carry straight into your next mobile app.

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

### Why this separation works
- **Screens (`src/app/`)** only coordinate route params, navigation, and `loading → error → empty → content` states. They never call `fetch` directly and never copy server data into `useState`.
- **Design System (`src/design-system/`)** holds reusable, domain-agnostic building blocks (`Screen`, `AppText`, `ActionButton`, `AnimatedPressable`, `PendingBottomSheet`, `SwipeableTabBar`, `ListRetryFooter`, `EmptyState`, `ErrorState`, `Skeleton`).
- **Feature Components (`src/components/`)** hold domain cards and sections (`ReservationCard`, `TicketHistoryCard`, `ActivityOverview`, `SessionResourceSection`).
- **Hooks (`src/lib/hook/`)** own TanStack Query keys, `staleTime`, cache seeding, optimistic rollbacks, and toast error handling.
- **Services (`src/service/`)** are pure async functions that accept an `AbortSignal` and return typed `ApiResponse<T>` payloads.

---

## 2. Feature & Implementation Map (Use as Reference)

| Feature / Capability | Where It Lives in This Project | Key Implementation Pattern |
| :--- | :--- | :--- |
| **App Bootstrap, Auth & Guards** | [src/app/_layout.tsx](file:///e:/company%20project/towering_lesson_mobile/src/app/_layout.tsx)<br>[src/lib/auth/auth-client.ts](file:///e:/company%20project/towering_lesson_mobile/src/lib/auth/auth-client.ts) | Waits for Better Auth session + welcome state + fail-open version check (`AppUpdateGate`) before rendering routes. Maps theme tokens to CSS variables at the root. |
| **Main Tabs & Stack Headers** | [src/app/(app)/(tabs)/_layout.tsx](file:///e:/company%20project/towering_lesson_mobile/src/app/(app)/(tabs)/_layout.tsx)<br>[src/design-system/utils/navigation-header.ts](file:///e:/company%20project/towering_lesson_mobile/src/design-system/utils/navigation-header.ts) | Uses `NativeTabs` from `expo-router/native-tabs` for platform-native tab bars (with unread badge count) and nested `Stack` layouts sharing `getStackHeaderOptions(colors)`. |
| **Screen Layout & Safe Areas** | [src/design-system/components/Screen.tsx](file:///e:/company%20project/towering_lesson_mobile/src/design-system/components/Screen.tsx) | Single-column container (`maxWidth: 430`, `16pt` horizontal padding) that handles scroll vs. list layouts (`scroll={false}`), iOS/Android safe-area insets, and fixed footers. |
| **Theme & Dynamic Type** | [src/design-system/utils/theme.ts](file:///e:/company%20project/towering_lesson_mobile/src/design-system/utils/theme.ts)<br>[src/global.css](file:///e:/company%20project/towering_lesson_mobile/src/global.css) | Supports `system / light / dark` + user-selectable primary brand color (`blue / green`) persisted in `AsyncStorage`. Applies `fontScale` to explicit native font sizes on iOS while letting Android Compose scale natively. |
| **Hybrid Native Controls (`@expo/ui`)** | [src/design-system/components/ActionButton.tsx](file:///e:/company%20project/towering_lesson_mobile/src/design-system/components/ActionButton.tsx)<br>[src/design-system/components/PendingBottomSheet.tsx](file:///e:/company%20project/towering_lesson_mobile/src/design-system/components/PendingBottomSheet.tsx) | Uses real SwiftUI (iOS) / Jetpack Compose (Android) for buttons, bottom sheets, wheel pickers, and switches, while using React Native `View` + NativeWind 5 for cards and layout. |
| **Tactile Press Feedback** | [src/design-system/components/AnimatedPressable.tsx](file:///e:/company%20project/towering_lesson_mobile/src/design-system/components/AnimatedPressable.tsx) | Single `ReanimatedPressable` driving `transform: [{ scale }]` on the UI thread via `useSharedValue`, respecting system Reduce Motion and preserving caller `opacity-*` classes. |
| **Bay & Lesson Booking Flow** | [src/components/golf/booking/SelectDatePicker.tsx](file:///e:/company%20project/towering_lesson_mobile/src/components/golf/booking/SelectDatePicker.tsx)<br>[src/app/(app)/select-bay-time.tsx](file:///e:/company%20project/towering_lesson_mobile/src/app/(app)/select-bay-time.tsx)<br>[src/app/(app)/booking-confirmation.tsx](file:///e:/company%20project/towering_lesson_mobile/src/app/(app)/booking-confirmation.tsx) | Scopes availability queries by `[ticketId, startDate, endDate]`. Prefetches month/day availability on ticket tap, seeds day previews with `{ updatedAt: 0 }`, and handles `409 RESERVATION_SLOT_UNAVAILABLE` by returning to refreshed slots without losing user notes. |
| **Infinite Feeds & Pager Tabs** | [src/components/golf/ReservationTabScene.tsx](file:///e:/company%20project/towering_lesson_mobile/src/components/golf/ReservationTabScene.tsx)<br>[src/components/golf/TicketTabScene.tsx](file:///e:/company%20project/towering_lesson_mobile/src/components/golf/TicketTabScene.tsx)<br>[src/design-system/components/SwipeableTabBar.tsx](file:///e:/company%20project/towering_lesson_mobile/src/design-system/components/SwipeableTabBar.tsx) | Pairs `react-native-pager-view` with `SwipeableTabBar` and cursor-paginated `FlashList` scenes. Uses `ListRetryFooter` for inline load-more retry and `usePullToRefresh` for user-initiated refresh. |
| **Interactive Swipe-to-Delete Feed** | [src/app/(app)/(tabs)/notice/index.tsx](file:///e:/company%20project/towering_lesson_mobile/src/app/(app)/(tabs)/notice/index.tsx)<br>[src/lib/hook/shared/useNotification.ts](file:///e:/company%20project/towering_lesson_mobile/src/lib/hook/shared/useNotification.ts) | Combines `FlashList` (`renderScrollComponent={GestureHandlerScrollView}`) with `ReanimatedSwipeable` (1:1 `friction={1}` physics), recycle reset in `useLayoutEffect`, and a shared optimistic mutation lock. |
| **Forms & Presigned S3 File Uploads** | [src/app/(app)/profile/edit.tsx](file:///e:/company%20project/towering_lesson_mobile/src/app/(app)/profile/edit.tsx)<br>[src/app/(app)/homework/[homeworkId].tsx](file:///e:/company%20project/towering_lesson_mobile/src/app/(app)/homework/%5BhomeworkId%5D.tsx)<br>[src/components/ui/form/FormTextInput.tsx](file:///e:/company%20project/towering_lesson_mobile/src/components/ui/form/FormTextInput.tsx) | React Hook Form + Zod with field-level `useController` subscriptions. Multi-step presigned S3 upload (`expo/fetch` + `expo-file-system` `File`) validates MIME/size locally and automatically refreshes expired presigned URLs. |
| **Activity Heatmap & Share Poster** | [src/components/golf/ActivityOverview.tsx](file:///e:/company%20project/towering_lesson_mobile/src/components/golf/ActivityOverview.tsx)<br>[src/components/golf/ActivitySharePreview.tsx](file:///e:/company%20project/towering_lesson_mobile/src/components/golf/ActivitySharePreview.tsx)<br>[src/hooks/useShareCardExport.ts](file:///e:/company%20project/towering_lesson_mobile/src/hooks/useShareCardExport.ts) | Virtualized horizontal 52-week `FlatList` heatmap + offscreen `@shopify/react-native-skia` canvas exported at `1080×1350` PNG to system share sheet or photo library. |
| **Deferred Lesson Video Playback** | [src/components/golf/SessionResourceSection.tsx](file:///e:/company%20project/towering_lesson_mobile/src/components/golf/SessionResourceSection.tsx) | Renders a lightweight preview card inside lists and mounts `expo-video` (`useVideoPlayer` + `VideoView`) on tap, immediately calling `videoPlayer.play()` so playback starts on the first tap. |

---

## 3. Top 7 Lessons Learned (Pitfalls to Avoid in Future Apps)

1. **Seeding React Query Detail/Day Caches from Parent Queries**
   - *The trap*: Calling `queryClient.setQueryData(dayKey, previewData)` sets `dataUpdatedAt = Date.now()`. If the query has `staleTime: 10_000`, a subsequent `prefetchQuery(dayKey)` sees the seeded preview as "fresh" and skips fetching the real server data.
   - *The fix*: Always pass `{ updatedAt: 0 }` when seeding partial or parent-derived data into a child query cache (`setQueryData(key, data, { updatedAt: 0 })`). That gives the UI an instant preview while still allowing `prefetchQuery` to fetch the authoritative response once.

2. **`AnimatedPressable` Must Not Write `opacity: 1` or Add Inner Layout Wrappers**
   - *The trap*: Writing `opacity: 1` at rest in `useAnimatedStyle` on the outer `Pressable` overwrites NativeWind's `opacity-40` or `disabled:opacity-50` classes, making disabled buttons look enabled. Conversely, wrapping children in an extra inner `<Animated.View style={{ flexGrow: 1 }}>` breaks `self-center` and vertical flex layouts.
   - *The fix*: Keep `AnimatedPressable` as a single `ReanimatedPressable` view that animates **only** `transform: [{ scale }]`.

3. **Keyboard-Aware Forms Inside Native Stacks**
   - *The trap*: `KeyboardAwareScrollView` defaults to `mode="insets"` (`ClippingScrollViewDecoratorView`). Combined with `<PendingBottomSheet>` mounted inside the scroll tree or `<KeyboardStickyView>`, it can collapse form content height to `0` on iOS/Android stack screens.
   - *The fix*: Default `KeyboardAwareScrollView` to `mode="layout"` with explicit `style: { flex: 1 }`, and always render `<PendingBottomSheet>` and `<Modal>` overlays as siblings **outside** `<Screen>`.

4. **`FlashList` Row Recycling + `ReanimatedSwipeable`**
   - *The trap*: `FlashList` reuses mounted row components for different items as you scroll. Without resetting the swipeable ref, a newly recycled row inherits an open "Delete" swipe from a previous item. Also, setting `dragOffsetFromLeft={10000}` blocks rightward swipe-back-to-close gestures.
   - *The fix*:
     - Pass `renderScrollComponent={GestureHandlerScrollView}` to `FlashList`.
     - Use 1:1 interactive swipe physics: `friction={1}`, `dragOffsetFromLeft={10}`, `dragOffsetFromRight={-10}`, `rightThreshold={32}`.
     - Call `swipeableRef.current?.reset()` inside `useLayoutEffect` whenever `item.id` changes, and close any open row on `onScrollBeginDrag`.

5. **Overlapping Optimistic Mutations Need One Shared Pending Guard**
   - *The trap*: When a screen has multiple optimistic mutations (e.g., mark notification read, mark all read, delete one, delete all), each captures a full list snapshot in `onMutate`. If two actions overlap and the first one fails after the second succeeds, its `onError` rollback restores an older snapshot and undoes the second action in the UI.
   - *The fix*: Gate all related optimistic actions behind one shared pending flag from snapshot through settlement.

6. **Lock Interactive Chart Cells While `keepPreviousData` (`isPlaceholderData`) Is Active**
   - *The trap*: Keeping previous chart data visible while a new year/month loads prevents layout flash, but if cells remain tappable during loading, tapping a cell stores a date from the *old* year under the *new* filter.
   - *The fix*: Pass `disabled={isPlaceholderData}` to interactive charts and verify `selectedDateKey` falls within the loaded `[startKey, endKey]` range before firing a by-date query.

7. **iOS `@expo/ui` Button Hit Targets**
   - *The trap*: On iOS SwiftUI, a plain `<Button variant="text">` with an outer `frame({ maxWidth: Infinity, minHeight: 48 })` only makes the text glyph itself tappable—tapping the empty colored area toward the left/right edges of the button does nothing.
   - *The fix*: Apply `contentShape(shapes.rectangle())` after `frame({ maxWidth: Infinity, minHeight: 48 })` on the inner `<Text>` or `<Row>` inside the button, and centralize this in a single `<ActionButton>` component so no screen has to repeat 40 lines of modifier boilerplate.

---

## 4. Recommendations & Setup Checklist for Your Next Mobile App

When starting your next Expo React Native project, set up these foundations on **Day 1**:

### A. Core Stack to Keep
- **Framework & Routing**: Expo SDK + `expo-router` (with `NativeTabs` from `expo-router/native-tabs` for main tabs and native `Stack` for detail flows).
- **Styling & UI**: NativeWind 5 + Tailwind CSS 4 for RN layout/surfaces, paired with `@expo/ui` for true native sheets, pickers, switches, and buttons.
- **State & Networking**: TanStack Query v5 (`useQuery`, `useInfiniteQuery`, `useMutation`) + a single `apiClient` wrapper that injects `Accept-Language`, `X-App-Client`, `X-App-Platform`, and `X-App-Version` headers.
- **Lists & Motion**: `@shopify/flash-list` for paginated feeds, `react-native-reanimated` (`useSharedValue`) for UI-thread motion, and `react-native-keyboard-controller` (`mode="layout"`) for forms.
- **Forms & Validation**: `react-hook-form` + `zod` (`@hookform/resolvers/zod`).

### B. Build These 6 Primitives Before Any Feature Screen
1. **`Screen`**: Single source of truth for max-width (`430pt`), `16pt` horizontal padding, safe areas, `KeyboardAwareScrollView` (`mode="layout"`), and fixed footers.
2. **`AppText`**: Semantic typography variants (`h1`, `h2`, `h3`, `title`, `body`, `label`, `meta`, `caption`, `badge`) with tabular numeral support and theme color tokens.
3. **`ActionButton`**: Wraps `@expo/ui` `Host` + `Button` with `appearance="filled" | "outlined" | "text"`, `tone="primary" | "danger"`, `loading`, `disabled`, haptics, and iOS full-width rectangular hit shapes.
4. **`AnimatedPressable`**: Single-view Reanimated scale feedback (`0.97` spring) with reduced-motion support and optional selection/impact haptics.
5. **`PendingBottomSheet`**: Wraps `@expo/ui` `BottomSheet` with a pending-lock guard (`dismissDisabled`) so users cannot swipe-dismiss a confirmation sheet mid-mutation.
6. **`FormTextInput` / `FormPasswordInput`**: Core RN `TextInput` connected via `useController` so focus survives password visibility toggles and error states focus automatically on invalid submit.

### C. Engineering Guardrails to Copy Over
- **Copy [AGENTS.md](file:///e:/company%20project/towering_lesson_mobile/AGENTS.md) and [docs/native-ui-gotchas.md](file:///e:/company%20project/towering_lesson_mobile/docs/native-ui-gotchas.md)** into the root of your next repository on day one. Keeping a living list of UI and data rules prevents drift across features and AI sessions.
- **Add targeted Node unit tests (`node --test`) for pure state/cache invariants**:
  - Just like [scripts/tests/bay-availability.test.cjs](file:///e:/company%20project/towering_lesson_mobile/scripts/tests/bay-availability.test.cjs) and [scripts/tests/screen-keyboard.test.cjs](file:///e:/company%20project/towering_lesson_mobile/scripts/tests/screen-keyboard.test.cjs), testing query-key isolation, cache-seeding freshness (`updatedAt: 0`), and `Screen` keyboard props in fast Node tests catches subtle regressions in under 2 seconds without needing a simulator boot.
- **Run a Dead Code & Unused Export scan before every store release**:
  - Periodically scan `src/` for unused exports, dead service methods, and duplicated `<Host><Button>` blocks so the bundle stays lean and every exported type/hook has a real caller.
