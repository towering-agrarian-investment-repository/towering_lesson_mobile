# Design system

Authoritative reference for HappyGolf GO's visual language. The implementation lives in `src/design-system/`, `src/global.css`, and `src/app/_layout.tsx`. If this document and the code disagree, trust the code and update this file.

## Tokens

Tokens exist twice and must stay aligned:

- `src/design-system/utils/theme.ts` — JS palette for native props, navigation, Expo UI controls, and `expo-system-ui`.
- `src/global.css` — NativeWind/CSS variables for React Native layout, text, and surfaces.

The palette uses the original brand values. Helper roles (`primaryText`, `textTertiary`, `dangerForeground`, `successText`, `warningText`, media/scrim tokens) reuse the brand values so the visual identity stays unchanged.

| Role                          | Light                    | Dark                  | Use                                       |
| ----------------------------- | ------------------------ | --------------------- | ----------------------------------------- |
| `background`                  | `#FFFFFF`                | `#0A0E16`             | Page canvas                               |
| `surface`                     | `#F9FAFB`                | `#11161F`             | Inputs, recessed chips                    |
| `card`                        | `#FFFFFF`                | `#161B26`             | Cards, sheets                             |
| `border`                      | `#E5E7EB`                | `#262D3A`             | Hairlines and outlines                    |
| `muted`                       | `#F3F4F6`                | `#1C2330`             | Quiet fills, skeletons                    |
| `foreground`                  | `#111827`                | `#E5E7EB`             | Primary text                              |
| `mutedForeground`             | `#6B7280`                | `#8B95A7`             | Secondary text                            |
| `textTertiary`                | `#6B7280`                | `#8B95A7`             | Disabled labels, placeholders             |
| `primary`                     | `#00AEEF`                | `#33C6FF`             | Filled CTAs, accents                      |
| `primaryForeground`           | `#FFFFFF`                | `#FFFFFF`             | Text/icons on `primary`                   |
| `primaryText`                 | `#00AEEF`                | `#33C6FF`             | Accent text/icons on card/background      |
| `danger`                      | `#DC2626`                | `#F87171`             | Destructive                               |
| `dangerForeground`            | `#FFFFFF`                | `#FFFFFF`             | Text/icons on `danger`                    |
| `success`                     | `#16A34A`                | `#4ADE80`             | Success                                   |
| `successText`                 | `#16A34A`                | `#4ADE80`             | Success text on tint                      |
| `warning`                     | `#F59E0B`                | `#FBBF24`             | Warning                                   |
| `warningText`                 | `#92400E`                | `#FBBF24`             | Warning text on plain and tinted surfaces |
| `ticketBay`                   | `#26A9E0`                | `#4CC3F0`             | Bay ticket                                |
| `ticketPrivate`               | `#4071C0`                | `#5B8DEF`             | Private lesson ticket                     |
| `ticketGroup`                 | `#FAAD3D`                | `#FFC24B`             | Group lesson ticket                       |
| `ticketProgram`               | `#845EF7`                | `#9775FA`             | Lesson program ticket                     |
| `ticketDefault`               | `#7A8186`                | `#8B95A7`             | Other ticket                              |
| `btnMainStart` / `btnMainEnd` | `#40C057` / `#49BBC4`    | `#48D469` / `#54CBD4` | Login/welcome gradient                    |
| `scrim`                       | `rgba(0,0,0,0.45)`       | same                  | Modal/media overlays                      |
| `mediaBackground`             | `#000000`                | `#000000`             | Video containers                          |
| `mediaForeground`             | `#FFFFFF`                | `#FFFFFF`             | Text/icons over media/scrim               |
| `scrimControl`                | `rgba(255,255,255,0.20)` | same                  | Play/close controls over media            |
| `reservationReserved`         | `#3B4EC5`                | `#3B4EC5`             | Status                                    |
| `reservationCheckedIn`        | `#52D8AC`                | `#52D8AC`             | Status                                    |
| `reservationCompleted`        | `#00A071`                | `#00A071`             | Status                                    |
| `reservationCancelled`        | `#D73246`                | `#D73246`             | Status                                    |
| `reservationNoShow`           | `#FF4964`                | `#FF4964`             | Status                                    |

Rules:

- The palette keeps the original brand appearance; do not silently darken or shift the brand to chase contrast.
- Use `primaryText` for accent-colored text and icons on card/background surfaces. `primary` is for fills.
- Use `mediaForeground` on black video/image overlays; never use `primaryForeground` there.
- The green primary preference swaps `primary`, `primaryForeground`, and `primaryText` in both `theme.ts` and the runtime CSS override in `src/app/_layout.tsx`.

## Typography

`src/design-system/utils/typography.ts` defines integer native point sizes with a 12pt floor. Weights stay within 400/600/700. Korean line-heights are 1.4x–1.5x.

| Role       | Size / line | Weight | Use                |
| ---------- | ----------- | ------ | ------------------ |
| `h1`       | 26 / 34     | 700    | Screen title       |
| `h2`       | 21 / 28     | 700    | Section title      |
| `h3`       | 17 / 24     | 600    | Card title         |
| `subtitle` | 16 / 23     | 600    | Supporting heading |
| `body`     | 15 / 22     | 400    | Body copy          |
| `label`    | 15 / 22     | 600    | Labels, buttons    |
| `subtext`  | 13 / 19     | 400    | Secondary copy     |
| `caption`  | 12 / 17     | 400    | Metadata           |
| `badge`    | 12 / 16     | 600    | Pills and badges   |

`AppText` is the single text primitive. It defaults to `lineBreakStrategyIOS="hangul-word"`, caps dynamic type at 1.5x, and exposes `tabular` for timers, scores, and counts. `@expo/ui` `Text` is only for children inside an existing Expo UI `Host`.

## Spacing, radius, motion

- Spacing: 4px grid (4/8/12/16/20/24/32). Screens use the `Screen` component's 16pt horizontal gutter.
- Radius: `sm` 6 (`rounded-md`, badges), `md` 12 (`rounded-xl`, inputs/buttons/tiles), `lg` 16 (`rounded-2xl`, cards/sheets), `full` 9999 (avatars/pills).
- Motion: `src/design-system/utils/motion.ts` is the only source for durations and curves (`fast` 120, `normal` 160, `standard` 200, `slow` 280; `motionEase`, `motionEaseInOut`, `motionCssEase`, `motionCssEaseInOut`, `motionPressScale`). Animate transforms/opacity, never layout properties, inside virtualized lists.

## Components

Shared primitives live in `src/design-system/` and are exported from `index.ts`.

- `Screen` — safe areas, padding, scrolling, keyboard handling, footers.
- `AppText` — standalone React Native text; Expo UI `Text` stays inside existing native control hosts.
- `ActionButton` — standard filled/outlined/text native buttons. `tone="primary" | "danger"`, `loading`, `disabled`, `haptic`.
- `AnimatedPressable` — clipped theme-tinted RN press feedback on Android; a single `ReanimatedPressable` animating only `transform: scale` on iOS.
- `Badge` — `variant` (`default`/`primary`/`success`/`warning`/`danger`), `size` (`sm`/`md`).
- `AppToast`, `CompactEmptyState`, `DateSectionHeader`, `Divider`, `ListRetryFooter`, `ListRow`, `SegmentedControl`, `Skeleton`, `StateCard`, `SwipeableTabBar`, `PendingBottomSheet`, charts.
- Form controls: `FormTextInput`, `FormPasswordInput`, `FormFieldShell` in `src/components/ui/form/`.

Removed and not to recreate: `Input`, `Textarea`, `Card`, `Container`, `ActionSheet`, `ConfirmSheet`, `CircleLoader`, `NativeText`.

## Contrast and accessibility

- Do not hardcode colors or append hex alpha suffixes (`foreground + "bf"`). Use `mutedForeground`, `textTertiary`, `scrim`, `mediaForeground`, or `scrimControl`.
- Keep touch targets at least 48pt (`min-h-12`) with `hitSlop` where the visual is smaller.
- Provide `accessibilityLabel`, role, and disabled/busy state on interactive controls.
- Check light and dark modes plus the green primary preference when adding a token.

## Theme runtime and preferences

One `ThemeProvider` in `src/app/_layout.tsx` owns the appearance and primary-color
preferences. `useTheme()` exposes the resolved scheme, palette, native font scale,
and setters; `useThemeColors()` reads the palette. Profile appearance rows use
`src/components/golf/profile/ProfilePreferenceRow.tsx` to present native picker sheets.

| Preference    | AsyncStorage key               | Values                    | Default  |
| ------------- | ------------------------------ | ------------------------- | -------- |
| Appearance    | `app-theme-preference`         | `system`, `light`, `dark` | `system` |
| Primary color | `app-primary-color-preference` | `blue`, `green`           | `blue`   |

Startup preferences share one `AsyncStorage.multiGet` through
`src/lib/startup-preferences.ts`. Theme readiness participates in the splash gate
alongside language, welcome, and auth readiness. Invalid or unreadable preferences
fall back to System and Blue. The version check runs independently.

Changing appearance applies `Appearance.setColorScheme` synchronously (`auto` for
System), updates React state, resolves the palette, and persists the choice.
`useColorScheme()` supplies the device appearance for System. `resolvedScheme` is
always light or dark. Picker sheets block duplicate saves and report persistence
errors; a failed save can leave the current in-memory choice different from the
next cold launch.

Colors reach the UI through these paths:

- **RN surfaces and text:** semantic classes resolve the light `:root` and dark
  `prefers-color-scheme` values in `src/global.css` through `react-native-css`.
- **Green primary:** the root variable context overrides `--primary`,
  `--primary-foreground`, and `--primary-text` to match `getThemeColors`.
  Blue uses a stable empty override map; light/dark changes follow Appearance.
- **Expo UI controls and icons:** use palette props, `textStyle`, and native
  modifiers. NativeWind on an RN wrapper does not style native text.
- **Navigation and system surfaces:** `ThemedRoot` supplies navigation colors,
  `expo-system-ui` updates the system background, and the root status bar uses
  automatic styling. The image viewer manages its own light status bar.
- **Native font scaling:** the provider tracks iOS font scale up to 1.5x;
  Android Compose scales its own text. `AppText` has a default 1.5x cap.

When adding a shared color, update `ThemeColors`, both JS palettes, the CSS token
mapping, and both CSS scheme declarations. Retain `userInterfaceStyle: "automatic"`
and the existing root provider tree. Do not add another theme provider.

## Investigating theme latency

There is no in-app timing probe. Measure development and preview/release builds
on the same device: choice tap to row value, first background change, and complete
repaint. Repeat System → Light → Dark → System with the device set to both schemes.
Separate JS rendering from native Appearance, navigation, Host, and CSS updates
before attributing a delay to any one layer.

Check mounted subscriber work, duplicate appearance events, native-control colors,
and persistence after restart. Preserve draft and screen state across mode changes.
Use [device QA](docs/qa-checklist.md); compilation does not measure theme latency.
