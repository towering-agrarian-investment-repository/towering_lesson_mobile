# Project working guide

Existing Expo React Native app (Android + iOS). Maintain the current architecture. This file is not a scaffold or a request to rebuild the design system.

If docs and code disagree, trust the code and flag the doc.

## Stack and tooling

- Authority for versions and APIs: `package.json`, `pnpm-lock.yaml`, installed package types. Check APIs against this project's SDK, not `latest` docs.
- Native controls: `@expo/ui`. RN layout and surfaces: NativeWind 5 + Tailwind CSS 4. Data/forms: TanStack Query, Better Auth, React Hook Form, Zod.
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

There are no unit tests. `tsc` and `eslint` are the only automated safety net. Runtime/device behavior is verified manually: respect requests for manual device testing and clearly separate code/build checks from unverified runtime behavior. Checklist: `docs/qa-checklist.md`.

Native dependency/config changes may need a fresh dev build (profiles in `eas.json`; `development-simulator` for iOS simulator; physical iOS needs signing credentials).

## Do not touch (unless the task explicitly says so)

- `patches/`, `metro.config.js`, `scripts/startup-compat.test.cjs`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- Generated `android/` and `ios/`. Put native config in app config/config plugins.
- `app.json`: keep `userInterfaceStyle: "automatic"`, `orientation: "default"`, iPad support.
- `src/app/_layout.tsx`: keep providers, global CSS import, auth/update/welcome guards, themed status bar. Never replace with a minimal sample.

## UI rules

- Native controls use Expo UI; layout and surfaces use RN Views.
- Use universal `@expo/ui` controls (`Text`, `Button`, `TextInput`, `Picker`, `Switch`, `BottomSheet`) inside `Host`. Use `RNHostView` to embed RN views in an Expo UI tree.
- Replacing a custom control with Expo UI must preserve the visual design (layout, spacing, sizes, colors, gradients, typography, borders, states). Native defaults are not authorization to redesign.
- Style native controls with Expo UI props, `textStyle`, and native modifiers. NativeWind `className` does not style native text.
- Put NativeWind layout classes on RN views around `Host`. Use `Host.style` for the host's own width/flex/border.
- Buttons: reuse `src/design-system/utils/native-button-styles.ts` with the universal Button's text variant. Keep the login gradient on its themed surface.
- Expo UI `Text` takes string children. `TextInput.value` uses `useNativeState`. Preserve form reset/default-value syncing.
- Platform-specific native views only when needed, in platform files outside the route directory.
- Simple cards are styled RN `View`s with semantic classes. Use `Pressable` for custom RN interactions.
- Removed, do not recreate (no aliases, adapters, or competing controls): `Button`, `Input`, `Textarea`, `Card`, `Container`, `ActionSheet`, `ConfirmSheet`.
- Sheets: profile preferences, photo selection, logout, notification deletion, and reservation cancellation use Expo UI `BottomSheet` with branded content. Keep confirmation sheets open and block duplicate submit/dismiss while pending. RN `Alert` stays for existing permission/error alerts.
- Forms: reuse `FormTextInput`, `FormPasswordInput`, and their field shell in `src/components/ui/form/`. Do not restore removed select/checkbox/date/number wrappers as unused code.
- Generic UI lives in `src/design-system/` (see its `index.ts`). Feature components live under `src/components/`.
- Layout/alignment/sizing pitfalls for native hosts: `docs/native-ui-gotchas.md`. Read it before touching native text, buttons, or empty states.
- RN text: use `AppText` (`src/design-system/components/AppText.tsx`) for repeated RN row labels, badges, and chart labels. It uses NativeWind semantic colors and RN font scaling.
- Native text: use the shared `NativeText` helper (`src/design-system/components/NativeText.tsx`) instead of repeating `Host` + `Text` + typography + `fontScale`. Extend it with props (variant, color, wrap) rather than creating another text wrapper. Use raw `Host`/`Text` only for cases it cannot express.

## Theme and styling

- Reuse `src/design-system/utils/theme.ts` and `typography.ts`. No second theme/provider. Keep the brand palette.
- Root layout maps theme colors to CSS variables; `src/global.css` defines semantic tokens and fallbacks. Keep them aligned.
- Use semantic classes on RN views (`bg-background`, `bg-surface`, `bg-card`, `border-border`, `bg-muted`, `text-muted-foreground`, `bg-primary`, danger/success/warning/ticket tokens).
- Native control colors: `useTheme()` or `useThemeColors()`. Preserve system/light/dark and primary-color preferences.
- Merge class names with `cn` from `src/design-system/utils/cn.ts`.
- NativeWind for RN layout. Inline styles/native modifiers only for measured widths, native styling, safe-area values, runtime behavior.
- Preserve text scaling: theme `fontScale` handles explicit native font sizes on iOS; Android Compose scales itself.

## Layout and navigation

- Routes in `src/app/`. `Stack` for stacks, `NativeTabs` from `expo-router/native-tabs` for main tabs. Keep tab labels, titles, badges, deep links, back behavior. Tabs with headers have nested stack layouts.
- Use `Screen` for safe-area insets, padding, scrolling, keyboard handling, footers. Do not add another `SafeAreaView` or duplicate padding.
- `Screen` scrolls by default. Use `scroll={false}` for screens with a vertical `FlatList`. Never nest a virtualized list in a same-direction `ScrollView`.
- Keep the same single-column screen layout on phones and tablets. `Screen` centers content at a phone-sized maximum width with 16-point horizontal padding. Use `footerSafeArea={false}` when the tab bar handles the bottom inset.
- Do not add separate tablet layouts or width-based panel switches unless the content requires them. Keep measurements needed to fit charts, banners, sheets, safe areas, and other controls within the available space.
- Preserve mounted form and screen state across resize, rotation, split screen, and folding.

## Data, interactions, accessibility

- Required-data screens handle `loading -> error -> empty -> content`. Preserve retry, refresh, slow-network behavior.
- Fetch only through the existing layers: screen -> hook (`src/lib/hook/`) -> service (`src/service/`). Never start requests in render.
- Guard navigation against duplicate taps (existing navigation lock). Choose `push`/`replace`/back intentionally.
- Disable submit/destructive actions while pending; keep loading indicators.
- Wait for auth bootstrap before auth-gated routing.
- API URLs and env values live in env/config. No secrets in source or public Expo env vars.
- `FlatList` for large/unbounded lists. Expo UI `List` is only for short native grouped rows.
- Localize all user-facing text through i18n resources (native labels, titles, validation, gender, ticket types).
- Preserve accessibility roles, labels, disabled/busy states, touch targets. Buttons and inputs: minimum height 48, large-text safe.

## Code quality and refactoring

- Choose the simplest solution. Flag over-engineering instead of adding abstraction.
- Before writing custom code, check installed dependencies, the Expo SDK, and RN core.
- Extract a shared component/hook only when used 3+ times or it removes real complexity. No wrappers that only rename a control. When replacing a component, migrate callers and delete the old implementation and exports.
- No dead code, unused props/exports/imports, redundant state, or duplicated logic.
- Derive values during render instead of storing in state. Avoid `useEffect` for derivable values. Skip `memo`/`useCallback`/`useMemo` unless there is a measured or obvious need.
- Use stable references: no `new Date()`, object, or array literals as default props or hook deps.
- Call hooks once per component (e.g. a single `useTheme()`).
- Use design tokens, not hardcoded colors/spacing/magic numbers.
- Refactors must not change behavior, UI, or public API. Output full files, not partial diffs.
- Run `tsc` and `eslint` after changes and fix everything you introduced.
