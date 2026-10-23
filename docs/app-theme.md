# App theme: current implementation

This describes the code as it works today. It is a reference for changing the theme and investigating slow mode switches, not a proposal to replace the design system. The project uses Expo SDK 58, React Native 0.88, NativeWind 5, Tailwind CSS 4, and `@expo/ui`; check `package.json` and installed types before changing an API.

## Where to look

| Concern | Source |
| --- | --- |
| Preferences, palettes, resolution, persistence, public hooks | [`src/design-system/utils/theme.ts`](../src/design-system/utils/theme.ts) |
| Theme installation, navigation colors, CSS variables, status bar | [`src/app/_layout.tsx`](../src/app/_layout.tsx) |
| NativeWind token names and light/dark CSS values | [`src/global.css`](../src/global.css) |
| Profile appearance picker (System, Light, Dark) | [`src/app/(app)/(tabs)/profile/index.tsx`](../src/app/(app)/(tabs)/profile/index.tsx) and [`src/components/golf/profile/ProfilePreferenceRow.tsx`](../src/components/golf/profile/ProfilePreferenceRow.tsx) |
| Profile primary-color preference | [`src/app/(app)/(tabs)/profile/index.tsx`](../src/app/(app)/(tabs)/profile/index.tsx) |
| Native typography tokens and shared text | [`src/design-system/utils/typography.ts`](../src/design-system/utils/typography.ts), [`src/design-system/components/AppText.tsx`](../src/design-system/components/AppText.tsx), [`src/design-system/components/NativeText.tsx`](../src/design-system/components/NativeText.tsx) |
| Native button styles | [`src/design-system/utils/native-button-styles.ts`](../src/design-system/utils/native-button-styles.ts) |
| Ticket type colors and class mappings | [`src/design-system/utils/ticket-type.ts`](../src/design-system/utils/ticket-type.ts) |
| Native UI layout constraints | [`docs/native-ui-gotchas.md`](native-ui-gotchas.md) |

## Theme flow

```text
Profile Appearance picker selection
  → ThemeProvider.setPreference(next mode)
  → synchronously apply Appearance.setColorScheme(mode or "auto")
  → update React preference state
  → resolve light/dark and compute colors
  → update theme context and app-wide consumers
  → root updates navigation theme and native-control props
  → native CSS media query resolves layout tokens from Appearance
  → AsyncStorage.setItem saves the preference

System preference → useColorScheme() → resolved light or dark
Blue/green preference → adjusts JS primary and overrides two CSS variables
```

There is one application `ThemeProvider`, mounted in `src/app/_layout.tsx` above the navigation tree. `ThemedRoot` consumes it and passes colors into the Expo Router navigation theme. `global.css` defines light layout tokens in `:root` and dark values in `@media (prefers-color-scheme: dark)`; the native CSS runtime follows `Appearance` changes. The `react-native-css` variable context receives only the green primary override when selected. RN text and surfaces use semantic CSS tokens; native controls, icons, and navigation consume the JS palette through `useTheme()` or `useThemeColors()`. There is no separate theme provider for the profile tab.

`preference` is the stored choice (`system`, `light`, or `dark`). `resolvedScheme` is always `light` or `dark`. When preference is `system`, the provider uses React Native's `useColorScheme()`; otherwise it uses the explicit preference. `getThemeColors(resolvedScheme, primaryColorPreference)` supplies the palette. An unrecognized or null scheme resolves to light.

On startup, the provider reads both preferences from AsyncStorage before setting `isReady`. It applies the stored appearance override, then exposes the ready state. `ThemedRoot` keeps its main UI gated on theme, welcome, and initial auth readiness. The version check runs asynchronously; a confirmed mandatory update then gates the app. Invalid or missing stored theme values become `system`; invalid or missing primary-color values become `blue`. If storage loading fails, the in-memory defaults remain.

The Appearance section in the profile body contains primary-color and theme preference rows. The theme row opens a picker sheet with System, Light, and Dark choices; its selected value appears on the row. The profile header contains the Edit action. The profile screen also uses theme colors for its sign-out sheet and other native controls.

## Persistence and platform appearance

| Setting | Storage key | Values | Default |
| --- | --- | --- | --- |
| Appearance | `app-theme-preference` | `system`, `light`, `dark` | `system` |
| Primary color | `app-primary-color-preference` | `blue`, `green` | `blue` |

The provider applies `Appearance.setColorScheme` synchronously before updating preference state or awaiting `AsyncStorage.setItem`, passing `auto` for System. `expo-system-ui` then updates the system background color when `colors.background` changes. The root `StatusBar` uses `auto`; the image-viewer modal has its own light status bar. `app.json` keeps `userInterfaceStyle: "automatic"`, allowing device appearance when the preference is System.

The picker blocks repeated selections while saving and shows an inline error if persistence fails. A storage failure can still leave the current in-memory choice different from what will load next launch.

## Palette

The light and dark CSS values in `global.css` match the JS palette in `theme.ts`, which supplies native props, navigation, and system surfaces. Fixed reservation status colors live in the exported `reservationStatusColors` constant, outside `ThemeColors`. `getThemeColors` changes the JS `primary` color to `#00BC7D` for **green** in both schemes, while the root variable context overrides `--primary` and `--primary-foreground`; the table shows the default **blue** preference.

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `background` | `#ffffff` | `#0a0e16` | App and screen background |
| `foreground` | `#111827` | `#e5e7eb` | Main text/icons |
| `surface` | `#f9fafb` | `#11161f` | Secondary surfaces |
| `card` | `#ffffff` | `#161b26` | Cards and sheets |
| `border` | `#e5e7eb` | `#262d3a` | Dividers and outlines |
| `muted` | `#f3f4f6` | `#1c2330` | Quiet fills |
| `mutedForeground` | `#6b7280` | `#8b95a7` | Secondary text |
| `primary` (blue) | `#00AEEF` | `#33C6FF` | Brand accents |
| `primaryForeground` | `#ffffff` | `#ffffff` | Text/icons on primary |
| `danger` | `#dc2626` | `#f87171` | Destructive actions |
| `success` | `#16a34a` | `#4ade80` | Success |
| `warning` | `#f59e0b` | `#fbbf24` | Warning |
| `ticketBay` | `#26a9e0` | `#4cc3f0` | Bay ticket |
| `ticketPrivate` | `#4071c0` | `#5b8def` | Private lesson ticket |
| `ticketGroup` | `#faad3d` | `#ffc24b` | Group lesson ticket |
| `ticketProgram` | `#845ef7` | `#9775fa` | Lesson program ticket |
| `ticketDefault` | `#7a8186` | `#8b95a7` | Other ticket |
| `btnMainStart` | `#40C057` | `#48D469` | Main button gradient start |
| `btnMainEnd` | `#49BBC4` | `#54CBD4` | Main button gradient end |
| `btnMainPressedStart` | `#37A54B` | `#3DAE54` | Pressed gradient start |
| `btnMainPressedEnd` | `#3A9DA5` | `#46AEB6` | Pressed gradient end |

The fixed reservation status colors are `reservationReserved #3B4EC5`, `reservationCheckedIn #52D8AC`, `reservationCompleted #00A071`, `reservationCancelled #D73246`, and `reservationNoShow #FF4964`. Notification accents use `danger`; secondary fills use `muted` and their text uses `foreground`. The ticket type helper maps type strings to ticket tokens plus badge, dot, border, and surface classes. Some solid badge classes deliberately use darker fixed colors (`BAY_USAGE #007EA7`, `GROUP_LESSON #C77800`) for contrast; these are in `ticket-type.ts`.

## How each UI layer receives colors

1. **React Native layout and surfaces:** `src/global.css` maps names such as `bg-background`, `bg-card`, `border-border`, and `text-muted-foreground` to CSS variables. Each token has a light value in `:root` and a dark value under `@media (prefers-color-scheme: dark)`. On native, `react-native-css` resolves that media query from React Native `Appearance`, including app overrides. `ThemedRoot` passes a stable empty map to `VariableContextProvider` for blue, or a stable map overriding only `--primary` and `--primary-foreground` for green. The JS palette in `theme.ts` must stay aligned for native props and navigation.
2. **Expo UI native controls:** controls live inside `Host`. Components use `useTheme()` colors in native props, `textStyle`, modifiers, and sometimes `Host.colorScheme`. NativeWind classes on an RN wrapper do not style Expo UI native text. `NativeText` remains for standalone Expo UI text; `native-button-styles.ts` supplies consistent button fill, border, and foreground behavior.
3. **Navigation:** `ThemedRoot` selects Expo Router's `DefaultTheme` or `DarkTheme`, then overrides navigation colors with the app palette. Tab and stack layouts also read theme colors for headers and tabs.
4. **System surfaces:** `Appearance.setColorScheme` receives the chosen mode synchronously, `expo-system-ui` updates its background from the resolved palette, and the root `expo-status-bar` uses automatic styling. They are separate from the CSS-variable and React context updates.
5. **Typography:** `typography.ts` defines the shared text ramp. NativeWind uses a 14-point rem on native and 16px on web. `AppText` renders React Native `Text` in repeated rows and chart labels, using semantic NativeWind text colors; RN handles accessibility font scaling without JS multiplication. `NativeText` renders standalone Expo UI text and multiplies explicit iOS sizes by the theme `fontScale`; Android Compose scales text itself.

## When changing the design

- Define layout token values once per scheme in `global.css`; keep matching JS values in `theme.ts` for native props, navigation, and `SystemUI`. If adding a token used by both layers, add it to `ThemeColors`, both JS palettes, the CSS token mapping, and both CSS scheme declarations. Only the green primary needs a runtime CSS override.
- Use semantic classes on RN views. For `@expo/ui`, use `useTheme()` colors and native styling. Keep text, icon, and background contrast in both schemes and with both primary colors.
- Use `AppText` for RN row labels, badges, and chart labels. Use `NativeText` for standalone Expo UI text that needs a native `Host`; use Expo UI `Text` directly inside an existing native control tree. Both share the `typography.ts` ramp.
- Preserve the current `app.json` appearance settings and root providers. Do not create a second provider or hardcode a new palette inside a screen.
- For a new ticket type, update `ticket-type.ts` and check its corresponding palette token, solid badge contrast, and localized label.
- Check System while the device is light **and** dark. Also check explicit Light and Dark after changing the device setting, and verify the choice survives a cold restart.

## Researching a slow switch

Selecting a theme in the picker applies a platform appearance override synchronously, then changes a context value consumed throughout the app and rebuilds root navigation colors. The native CSS media query updates layout tokens without rebuilding the variable context for light/dark switches. These paths can still contribute to elapsed tap-to-paint time; the code change alone does not establish where a remaining delay occurs.

The temporary in-app theme timing probe has been removed. Use external manual device observations for any future latency investigation.

Measure a **development build and a release/preview build** on the same device. Record choice-tap-to-row-value, choice-tap-to-first-background change, and choice-tap-to-complete-screen repaint for System→Light, Light→Dark, and Dark→System. Repeat when System resolves to light and to dark. Separate JS time (event handler, provider render, large screen renders) from native time (`Appearance.setColorScheme`, Expo UI Host updates, navigation, and variable propagation). Do not treat an unmeasured platform or component as the confirmed bottleneck.

Specific code questions to investigate:

- Does returning to System trigger a second appearance event and another provider render through `useColorScheme()`?
- How many mounted `NativeText`/`Host` trees update on the profile screen and other mounted routes?
- Is the platform appearance override expensive on either iOS or Android compared with the React palette update?
- Can rapid mode taps leave a stale stored value?
- Are any controls retaining hardcoded colors or a seeded native palette during the switch?

Use the manual checks in [`docs/qa-checklist.md`](qa-checklist.md). `pnpm exec tsc --noEmit` and `pnpm exec eslint src` catch code issues; they do not measure device latency or visual correctness.
