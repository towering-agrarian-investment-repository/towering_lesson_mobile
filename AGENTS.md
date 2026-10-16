# Project working guide

This is an existing Expo React Native app for Android and iOS. Maintain the current architecture; this file is not a scaffold or a request to rebuild the design system.

## Stack and tooling

- Current baseline: Expo SDK 58, Expo Router, React Native, and TypeScript.
- Native controls use `@expo/ui`; React Native layout uses NativeWind 5 and Tailwind CSS 4.
- Data and forms use TanStack Query, Better Auth, React Hook Form, and Zod.
- Treat `package.json`, `pnpm-lock.yaml`, and installed package types as the authority for versions and available APIs.
- Use a supported Node.js LTS version meeting Expo's requirement (currently `>=22.13.0`). This machine uses nvm for Node version management.
- Use pnpm, matching `packageManager` in `package.json` and the versions in `eas.json`. Do not introduce npm or Yarn lockfiles.
- Use `pnpm exec expo install <package>` for Expo/React Native dependencies. Avoid unnecessary dependencies and additional UI libraries.
- For Expo work, read `.agents/skills/expo-overview/SKILL.md` first and follow the relevant installed skills. Check APIs against this project's SDK, not `latest` docs.

## UI components

- Prefer universal `@expo/ui` controls, including `Text`, `Button`, `TextInput`, `Picker`, `Switch`, and `BottomSheet`. Wrap native UI trees in `Host`.
- Replacing custom controls with Expo UI must preserve the existing visual design: layout, spacing, sizes, colors, gradients, typography, borders, and interaction states. Native defaults are not authorization to redesign a screen.
- Use `RNHostView` when embedding React Native views inside an Expo UI tree.
- Use Expo UI props, `textStyle`, and supported native modifiers for native controls. NativeWind `className` on a React Native wrapper does not style native text inside it.
- Put NativeWind layout classes on React Native views around `Host`. Use `Host.style` for its own width/flex/border layout; arbitrary native hosts do not inherit React Native primitive className support.
- Reuse `src/design-system/utils/native-button-styles.ts` with the universal Button's text variant for exact theme backgrounds and disabled opacity. A Host seed color generates an Android palette; it does not preserve an exact brand fill. Keep the login gradient on its existing themed surface.
- In this SDK, Expo UI `Text` takes string children and `TextInput.value` uses observable state from `useNativeState`. Preserve form reset/default-value syncing.
- Use platform-specific native views only when needed, isolating them in platform files outside the route directory. Shared files may select platform modifiers.
- Simple card surfaces are styled React Native `View`s with semantic classes. Use `Pressable` for custom React Native interactions where appropriate.
- The old project-owned `AppText`, `Button`, `Input`, `Textarea`, `Card`, `Container`, `ActionSheet`, and `ConfirmSheet` were removed. Do not recreate them as aliases, adapters, or competing controls.
- Profile preferences, photo selection, logout, notification deletion, and reservation cancellation use Expo UI `BottomSheet` with the existing branded content. Keep confirmation sheets open and block duplicate submissions/dismissal while pending. React Native `Alert` remains for existing permission/error alerts.
- Native text that should wrap must have a constrained Host width (`matchContents={{ vertical: true }}` plus explicit width/flex), rather than measuring both axes at intrinsic size. Use native frame/fill modifiers for alignment inside the host. Keep badges and other intrinsic content sized to their contents.
- Percentage Host widths require an already sized React Native parent. Inside a centered, intrinsically sized wrapper, use the cell's explicit width or intrinsic measurement; a percentage child cannot establish its parent's width. Calendar day labels use the existing 40-point cell width.
- Center native text with `textStyle.textAlign` on both platforms, alongside the SwiftUI frame alignment where needed. In a horizontal row, `items-center` controls vertical alignment; it does not imply centered text.
- Empty/error states should grow into their parent's remaining height and center a width-constrained content block. Scroll content should retain its intrinsic height with flex growth. Empty-list containers should avoid asymmetric vertical padding that shifts the state away from the center.
- Native button content must occupy the full button area on iOS before applying its background. Preserve the minimum content frame as well as the outer button frame; an outer frame alone can leave the fill sized to the label.
- Universal Expo UI `Row.alignment` controls vertical alignment. Center button labels and loading indicators horizontally inside full-width rows with balanced flexible Expo UI `Spacer`s on both sides of the content group, alongside centered text alignment.
- Form integration lives in `src/components/ui/form/`. Reuse `FormTextInput`, `FormPasswordInput`, and their field shell for React Hook Form integration. Removed select/checkbox/date/number wrappers should not be restored as unused code.
- Generic project UI remains in `src/design-system/`; check its `index.ts` for public exports. Feature-specific components belong under `src/components/`, not the design system.
- Extract shared components when they remove meaningful repetition. Avoid wrappers that only rename an existing control. When replacing a component, migrate its callers and remove its old implementation and exports.

## Theme and styling

- Reuse the existing theme in `src/design-system/utils/theme.ts` and type ramp in `src/design-system/utils/typography.ts`. Do not introduce a second theme/provider.
- The root layout maps runtime theme colors to CSS variables; `src/global.css` defines semantic NativeWind tokens and fallback values. Keep these aligned when changing tokens. Do not replace the current brand palette with sample colors.
- Use semantic classes such as `bg-background`, `bg-surface`, `bg-card`, `border-border`, `bg-muted`, `text-muted-foreground`, `bg-primary`, and existing danger/success/warning/ticket tokens on React Native views.
- Use `useTheme()` or `useThemeColors()` for native control colors. Preserve the existing system/light/dark and primary-color preferences.
- Reuse `cn` from `src/design-system/utils/cn.ts` for merged class names.
- Prefer NativeWind for React Native layout. Use inline styles/native modifiers for measured widths, native UI styling, safe-area values, or other runtime behavior.
- Preserve accessible text scaling. The existing theme's `fontScale` handles explicit native font sizes on iOS; Android Compose scales text itself.

## Layout and navigation

- Routes live in `src/app/`. Use Expo Router `Stack` for stacks and `NativeTabs` from `expo-router/native-tabs` for the main tabs.
- Keep tab labels, stack titles, badges, deep links, and back behavior intact. Tabs with headers have their own nested stack layouts.
- Preserve the providers, global CSS import, auth/update/welcome guards, and themed status bar in `src/app/_layout.tsx`. Do not replace it with a minimal sample layout.
- Use the existing `Screen` for safe-area insets, outer padding, scrolling, keyboard handling, and footers. It uses `useSafeAreaInsets` under the root `SafeAreaProvider`; do not add another `SafeAreaView` or duplicate padding around every screen.
- `Screen` scrolls by default. Use `scroll={false}` for screens containing a vertical `FlatList`; avoid nesting a virtualized list inside a same-direction `ScrollView`.
- Default screen padding is 16 on phones and 24 on wider windows. Use `maxWidth` for narrower forms and `footerSafeArea={false}` when the tab bar handles the bottom inset.
- Reuse `AdaptivePanels` for paired responsive sections. It uses native `ArrangementView` on iOS 27.1+ and a measured-width layout on Android and older iOS.
- Base responsive layout on available window/container width. Preserve mounted form and screen state during resizing, rotation, split screen, and folding.
- Preserve `userInterfaceStyle: "automatic"`, `orientation: "default"`, and iPad support in `app.json` unless the task explicitly changes them.
- Native `android/` and `ios/` projects are generated and ignored. Put persistent native configuration changes in app config/config plugins, not generated files.

## Data, interactions, and accessibility

- Required-data screens should handle `loading -> error -> empty -> content`. Preserve retry, refresh, and slow-network behavior.
- Keep fetching in the existing query/hooks/service layer; never start requests in render.
- Guard navigation against duplicate taps, using the existing navigation lock where appropriate. Choose `push`, `replace`, or back navigation intentionally.
- Disable submit/destructive actions while pending and preserve their loading indicators.
- Wait for auth bootstrap before making auth-gated routing decisions.
- Keep API URLs and environment-specific values in env/config. Never put secrets in frontend source or public Expo environment variables.
- Use `FlatList` for large or unbounded lists. Expo UI `List` is for short native grouped rows, not virtualized datasets.
- Localize user-facing text through existing i18n resources, including native control labels, navigation titles, validation, gender, and ticket-type labels.
- Preserve accessibility roles, labels, disabled/busy states, and usable touch targets. Normal buttons and inputs should have a minimum height of 48 and accommodate large text.

## Verification

Run checks appropriate to the change:

- TypeScript: `pnpm exec tsc --noEmit`
- Lint: `pnpm exec eslint src`
- Dependencies/app configuration: `pnpm dlx expo-doctor`
- Native JavaScript bundles when relevant: `pnpm exec expo export --platform android --platform ios --output-dir dist`
- Development server: `pnpm start --dev-client`

Native dependency/configuration changes may require a fresh development build. Use the existing EAS profiles in `eas.json`; `development-simulator` builds for the iOS simulator, while physical iOS development builds require signing credentials. Documentation-only changes do not require app builds.

For every screen or major interaction, review:

1. Loading, empty data, and API failure/retry states.
2. Repeated taps and pending submissions.
3. Back navigation, including Android's back button.
4. Slow/offline connections.
5. Logged-out behavior and auth bootstrap.
6. Keyboard access and large text.
7. Both themes and supported languages.
8. Phone/tablet/Duo layouts on Android and iOS.

Respect requests for manual device testing and clearly distinguish code/build checks from runtime behavior that has not been verified.
