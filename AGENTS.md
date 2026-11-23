# Project working guide

Existing Expo React Native app (Android + iOS). Maintain the current architecture. This file is not a scaffold or a request to rebuild the design system.

If docs and code disagree, trust the code and flag the doc.

## Stack and tooling

- Authority for versions and APIs: `package.json`, `pnpm-lock.yaml`, installed package types. Check APIs against this project's SDK, not `latest` docs.
- Native controls: `@expo/ui`. Lists: `@shopify/flash-list` for cursor-paginated infinite feeds, `FlatList` for bounded virtualized lists. RN layout and surfaces: NativeWind 5 + Tailwind CSS 4. Data/forms: TanStack Query, Better Auth, React Hook Form, Zod.
- Node: supported LTS meeting Expo's requirement (currently `>=22.13.0`), managed with nvm.
- Package manager: pnpm only, matching `packageManager` in `package.json` and `eas.json`. Never add npm/Yarn lockfiles.
- Install Expo/RN deps with `pnpm exec expo install <package>`. Avoid unnecessary dependencies and extra UI libraries.
- For Expo work, read `.agents/skills/expo-overview/SKILL.md` first and follow the relevant installed skills.

## Commands

- Types: `pnpm exec tsc --noEmit`
- Lint: `pnpm exec eslint src`
- Config/deps: `pnpm dlx expo-doctor`
- Bundles: `pnpm exec expo export --platform android --platform ios --output-dir dist`
- Dev server: `pnpm start --dev-client`
- Startup compat: `node --test scripts/startup-compat.test.cjs`
- Bay availability tests: `node --test scripts/tests/bay-availability.test.cjs`

Automated checks consist of `tsc`, `eslint`, `scripts/startup-compat.test.cjs`, and `scripts/tests/bay-availability.test.cjs`. Runtime/device behavior is verified manually: respect requests for manual device testing and clearly separate code/build checks from unverified runtime behavior. Checklist: `docs/qa-checklist.md`.

Native dependency/config changes may need a fresh dev build (profiles in `eas.json`; `development-simulator` for iOS simulator; physical iOS needs signing credentials).

## Do not touch (unless the task explicitly says so)

- `patches/`, `metro.config.js`, `scripts/startup-compat.test.cjs`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- Generated `android/` and `ios/`. Put native config in app config/config plugins.
- `app.json`: keep `userInterfaceStyle: "automatic"`, `orientation: "default"`, iPad support.
- `src/app/_layout.tsx`: keep providers, global CSS import, auth/update/welcome guards, themed status bar. Never replace with a minimal sample.

## UI rules

- Native controls use Expo UI; layout and surfaces use RN Views.
- Use universal `@expo/ui` controls (`Button`, `Picker`, `Switch`, `BottomSheet`, and `Text` inside an existing `Host`). Use `RNHostView` to embed RN views in an Expo UI tree.
- Replacing a custom control with Expo UI must preserve the visual design (layout, spacing, sizes, colors, gradients, typography, borders, states). Native defaults are not authorization to redesign.
- Style native controls with Expo UI props, `textStyle`, and native modifiers. NativeWind `className` does not style native text.
- Put NativeWind layout classes on RN views around `Host`. Use `Host.style` for the host's own width/flex/border.
- Buttons: use the shared `ActionButton` (`src/design-system/components/ActionButton.tsx`) for standard filled, outlined, or text native buttons (`tone="primary" | "danger"`, `loading`, `disabled`, `haptic`), or `src/design-system/utils/native-button-styles.ts` with the universal Button's text variant when custom inner composition is required (such as the login gradient surface or multi-button `PendingBottomSheet` `Column`s). Keep the login gradient on its themed surface.
- Expo UI `Text` takes string children and is used only inside an existing `@expo/ui` `Host` (`Button`, `Picker`, `List`, `BottomSheet`).
- Platform-specific native views only when needed, in platform files outside the route directory.
- Simple cards are styled RN `View`s with semantic classes. Use `AnimatedPressable` (`src/design-system/components/AnimatedPressable.tsx`) for custom RN interactions (use raw `Pressable` only for high-density grid cells like calendar/heatmap day cells with lightweight opacity feedback). `AnimatedPressable` must stay a single `ReanimatedPressable` animating only `transform: [{ scale }]` so it never overwrites caller `opacity-*` / `disabled:opacity-*` classes or alters child flex layout.
- Shared navigation and list controls: reuse `SwipeableTabBar` (`src/design-system/components/SwipeableTabBar.tsx`) for horizontal filter pill bars synced with `PagerView`, and `ListRetryFooter` (`src/design-system/components/ListRetryFooter.tsx`) for cursor-paginated load-more error footers.
- Removed, do not recreate (no aliases, adapters, or competing controls): `Input`, `Textarea`, `Card`, `Container`, `ActionSheet`, `ConfirmSheet`.
- Sheets: profile preferences, photo selection, logout, notification deletion, and reservation cancellation use Expo UI `BottomSheet` (`PendingBottomSheet`) with branded content. Render `<PendingBottomSheet>` and `<Modal>` overlays as siblings outside `<Screen>` (never inside `<Screen keyboardAware>` scroll content). Keep confirmation sheets open and block duplicate submit/dismiss while pending for high-stakes server-validated actions (reservation cancellation, logout); low-risk reversible/optimistic mutations (notification deletion) may close immediately on confirm. RN `Alert` stays for existing permission/error alerts.
- Forms: reuse `FormTextInput`, `FormPasswordInput`, and their field shell in `src/components/ui/form/` (backed by core RN `TextInput` so focus survives password visibility toggles and multiline alignment stays consistent). Do not restore removed select/checkbox/date/number wrappers as unused code.
- Generic UI lives in `src/design-system/` (see its `index.ts`). Feature components live under `src/components/`.
- Layout/alignment/sizing pitfalls for native hosts: `docs/native-ui-gotchas.md`. Read it before touching native text, buttons, or empty states.
- Text default: use `AppText` (`src/design-system/components/AppText.tsx`) for chrome, standalone labels, tab bars, list rows, badges, and chart labels (`NativeText` delegates to `AppText` for compatibility). Reserve `@expo/ui` `Text` strictly for children inside an existing `@expo/ui` `Host`.

## Theme and styling

- Reuse `src/design-system/utils/theme.ts` and `typography.ts`. No second theme/provider. Keep the brand palette.
- Root layout maps theme colors to CSS variables; `src/global.css` defines semantic tokens and fallbacks. Keep them aligned.
- Use semantic classes on RN views (`bg-background`, `bg-surface`, `bg-card`, `border-border`, `bg-muted`, `text-muted-foreground`, `bg-primary`, danger/success/warning/ticket tokens).
- Native control colors: `useTheme()` or `useThemeColors()`. Preserve system/light/dark and primary-color preferences.
- Merge class names with `cn` from `src/design-system/utils/cn.ts`.
- NativeWind for RN layout. Inline styles/native modifiers only for measured widths, native styling, safe-area values, runtime behavior.
- Preserve text scaling: theme `fontScale` handles explicit native font sizes on iOS; Android Compose scales itself.

## Layout and navigation

- Routes in `src/app/`. `Stack` for stacks, `NativeTabs` from `expo-router/native-tabs` for main tabs. Keep tab labels, titles, badges, deep links, back behavior. Tabs with headers have nested stack layouts sharing `getStackHeaderOptions(colors)`.
- Use `Screen` for safe-area insets, padding, scrolling, keyboard handling, footers. Do not add another `SafeAreaView` or duplicate padding. Do not opt out of `Screen`'s 16-point horizontal padding with manual `px-6` (`24px`) overrides that misalign headers, cards, and footers.
- `Screen` scrolls by default and defaults `keyboardScrollMode = "layout"` on `KeyboardAwareScrollView` with explicit `style: { flex: 1 }` (without `KeyboardStickyView` or `KeyboardToolbar`). Use `scroll={false}` for screens with a vertical `FlashList` or `FlatList`. Never nest a virtualized list in a same-direction `ScrollView`.
- Keep the same single-column screen layout on phones and tablets. `Screen` centers content at a phone-sized maximum width with 16-point horizontal padding. In native tabs, Android applies the bottom tab inset to the screen, while iOS applies automatic insets to the first scroll view only. A fixed `Screen` footer on iOS must use its bottom safe-area inset (`footerSafeArea`); non-footer stack screens apply `bottomSafeArea` (default `!footer`, opted out inside Android native tabs) so content never sits under the iOS home indicator or Android edge-to-edge navigation bar.
- Do not add separate tablet layouts or width-based panel switches unless the content requires them. Keep measurements needed to fit charts, banners, sheets, safe areas, and other controls within the available space.
- Preserve mounted form and screen state across resize, rotation, split screen, and folding.

## Data, interactions, accessibility

- Required-data screens handle `loading -> error -> empty -> content`. Preserve retry, refresh, slow-network behavior.
- Fetch only through the existing layers: screen -> hook (`src/lib/hook/`) -> service (`src/service/`). Never start requests in render. Read server data directly from React Query without copying it into local React state. When seeding a detail/day query cache with a partial preview from a parent list/month query via `queryClient.setQueryData`, pass `{ updatedAt: 0 }` so `prefetchQuery` still fetches the authoritative response while `staleTime` prevents duplicate fetches across step transitions. Disable interactive chart cells while `isPlaceholderData` is true and validate that a selected date falls within the loaded range before querying by-date data.
- Use optimistic updates (`onMutate` snapshot + `onError` rollback + `onSettled` invalidate) for low-risk reversible mutations (such as notification mark-read and delete), guarded by a single shared pending flag across related mutations so overlapping actions cannot restore a stale snapshot over a newer action. Keep booking, reschedule, and homework file-upload mutations pessimistic because they depend on server-side 409 slot-conflict checks or multi-step uploads.
- Guard navigation against duplicate taps (existing navigation lock). Choose `push`/`replace`/back intentionally.
- Disable submit/destructive actions while pending; keep loading indicators.
- Wait for auth bootstrap before auth-gated routing.
- API URLs and env values live in env/config. No secrets in source or public Expo env vars.
- Use `@shopify/flash-list` (`FlashList`) for cursor-paginated infinite feeds (`notice`, `ReservationTabScene`, `TicketTabScene`, `ticket-history`, `lesson-log`) and `FlatList` for bounded virtualized lists. Expo UI `List` is only for short native grouped rows. When rows use `ReanimatedSwipeable`, pass `renderScrollComponent={GestureHandlerScrollView}` to `FlashList`, use 1:1 interactive swipe physics (`friction={1}`, `dragOffsetFromLeft={10}`, `dragOffsetFromRight={-10}`, `rightThreshold={32}`), reset recycled swipeable refs on item ID change, and close open rows on `onScrollBeginDrag`.
- Use `useSharedValue` (Reanimated) for press, scroll, and drag animation values — never drive continuous or press animations with React `useState`. Use `useMinuteClock` (`src/lib/hook/useMinuteClock.ts`) for live countdown ticks on active screens. For deferred video players (`SessionResourceSection`), store only whether the user requested playback, derive mounting from `!deferVideo || playRequested`, and call `videoPlayer.play()` on mount when triggered by a tap.
- Localize all user-facing text through i18n resources (native labels, titles, validation, gender, ticket types).
- Preserve accessibility roles, labels, disabled/busy states, touch targets. Buttons and inputs: minimum height 48, large-text safe.

## Code quality and refactoring

- Choose the simplest solution. Flag over-engineering instead of adding abstraction.
- Before writing custom code, check installed dependencies, the Expo SDK, and RN core.
- Extract a shared component/hook only when used 3+ times or it removes real complexity. No wrappers that only rename a control. When replacing a component, migrate callers and delete the old implementation and exports.
- No dead code, unused props/exports/imports, redundant state, or duplicated logic.
- Derive values during render instead of storing in state. Avoid `useEffect` for derivable values. Skip `memo`/`useCallback`/`useMemo` unless there is a measured or obvious need — virtualized list row components (`FlashList`/`FlatList`), `ItemSeparatorComponent`, `keyExtractor`, per-item callbacks, and dynamic `<Stack.Screen options>` always count as an obvious need.
- Use stable references: no `new Date()`, object, or array literals as default props or hook deps.
- Call hooks once per component (e.g. a single `useTheme()`).
- Use design tokens, not hardcoded colors/spacing/magic numbers.
- Refactors must not change behavior, UI, or public API. Output full files, not partial diffs.
- Run `tsc` and `eslint` after changes and fix everything you introduced.
