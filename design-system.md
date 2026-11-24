# Design system

Authoritative reference for HappyGolf GO's visual language. The implementation lives in `src/design-system/`, `src/global.css`, and `src/app/_layout.tsx`. If this document and the code disagree, trust the code and update this file.

## Tokens

Tokens exist twice and must stay aligned:

- `src/design-system/utils/theme.ts` — JS palette for native props, navigation, Expo UI controls, and `expo-system-ui`.
- `src/global.css` — NativeWind/CSS variables for React Native layout, text, and surfaces.

The palette uses the original brand values. Helper roles (`primaryText`, `textTertiary`, `dangerForeground`, `successText`, `warningText`, media/scrim tokens) reuse the brand values so the visual identity stays unchanged.

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | `#FFFFFF` | `#0A0E16` | Page canvas |
| `surface` | `#F9FAFB` | `#11161F` | Inputs, recessed chips |
| `card` | `#FFFFFF` | `#161B26` | Cards, sheets |
| `border` | `#E5E7EB` | `#262D3A` | Hairlines and outlines |
| `muted` | `#F3F4F6` | `#1C2330` | Quiet fills, skeletons |
| `foreground` | `#111827` | `#E5E7EB` | Primary text |
| `mutedForeground` | `#6B7280` | `#8B95A7` | Secondary text |
| `textTertiary` | `#6B7280` | `#8B95A7` | Disabled labels, placeholders |
| `primary` | `#00AEEF` | `#33C6FF` | Filled CTAs, accents |
| `primaryForeground` | `#FFFFFF` | `#FFFFFF` | Text/icons on `primary` |
| `primaryText` | `#00AEEF` | `#33C6FF` | Accent text/icons on card/background |
| `danger` | `#DC2626` | `#F87171` | Destructive |
| `dangerForeground` | `#FFFFFF` | `#FFFFFF` | Text/icons on `danger` |
| `success` | `#16A34A` | `#4ADE80` | Success |
| `successText` | `#16A34A` | `#4ADE80` | Success text on tint |
| `warning` | `#F59E0B` | `#FBBF24` | Warning |
| `warningText` | `#F59E0B` | `#FBBF24` | Warning text on tint |
| `ticketBay` | `#26A9E0` | `#4CC3F0` | Bay ticket |
| `ticketPrivate` | `#4071C0` | `#5B8DEF` | Private lesson ticket |
| `ticketGroup` | `#FAAD3D` | `#FFC24B` | Group lesson ticket |
| `ticketProgram` | `#845EF7` | `#9775FA` | Lesson program ticket |
| `ticketDefault` | `#7A8186` | `#8B95A7` | Other ticket |
| `btnMainStart` / `btnMainEnd` | `#40C057` / `#49BBC4` | `#48D469` / `#54CBD4` | Login/welcome gradient |
| `scrim` | `rgba(0,0,0,0.45)` | same | Modal/media overlays |
| `mediaBackground` | `#000000` | `#000000` | Video containers |
| `mediaForeground` | `#FFFFFF` | `#FFFFFF` | Text/icons over media/scrim |
| `scrimControl` | `rgba(255,255,255,0.20)` | same | Play/close controls over media |
| `reservationReserved` | `#3B4EC5` | `#3B4EC5` | Status |
| `reservationCheckedIn` | `#52D8AC` | `#52D8AC` | Status |
| `reservationCompleted` | `#00A071` | `#00A071` | Status |
| `reservationCancelled` | `#D73246` | `#D73246` | Status |
| `reservationNoShow` | `#FF4964` | `#FF4964` | Status |

Rules:

- The palette keeps the original brand appearance; do not silently darken or shift the brand to chase contrast.
- Use `primaryText` for accent-colored text and icons on card/background surfaces. `primary` is for fills.
- Use `mediaForeground` on black video/image overlays; never use `primaryForeground` there.
- The green primary preference swaps `primary`, `primaryForeground`, and `primaryText` in both `theme.ts` and the runtime CSS override in `src/app/_layout.tsx`.

## Typography

`src/design-system/utils/typography.ts` defines integer native point sizes with a 12pt floor. Weights stay within 400/600/700. Korean line-heights are 1.4x–1.5x.

| Role | Size / line | Weight | Use |
| --- | --- | --- | --- |
| `h1` | 26 / 34 | 700 | Screen title |
| `h2` | 21 / 28 | 700 | Section title |
| `h3` | 17 / 24 | 600 | Card title |
| `subtitle` | 16 / 23 | 600 | Supporting heading |
| `body` | 15 / 22 | 400 | Body copy |
| `label` | 15 / 22 | 600 | Labels, buttons |
| `subtext` | 13 / 19 | 400 | Secondary copy |
| `caption` | 12 / 17 | 400 | Metadata |
| `badge` | 12 / 16 | 600 | Pills and badges |

`AppText` is the single text primitive. It defaults to `lineBreakStrategyIOS="hangul-word"`, caps dynamic type at 1.5x, and exposes `tabular` for timers, scores, and counts. `@expo/ui` `Text` is only for children inside an existing Expo UI `Host`.

## Spacing, radius, motion

- Spacing: 4px grid (4/8/12/16/20/24/32). Screens use the `Screen` component's 16pt horizontal gutter.
- Radius: `sm` 6 (`rounded-md`, badges), `md` 12 (`rounded-xl`, inputs/buttons/tiles), `lg` 16 (`rounded-2xl`, cards/sheets), `full` 9999 (avatars/pills).
- Motion: `src/design-system/utils/motion.ts` is the only source for durations and curves (`fast` 120, `normal` 160, `standard` 200, `slow` 280; `motionEase`, `motionEaseInOut`, `motionCssEase`, `motionCssEaseInOut`, `motionPressScale`). Animate transforms/opacity, never layout properties, inside virtualized lists.

## Components

Shared primitives live in `src/design-system/` and are exported from `index.ts`.

- `Screen` — safe areas, padding, scrolling, keyboard handling, footers.
- `AppText` — all text.
- `ActionButton` — standard filled/outlined/text native buttons. `tone="primary" | "danger"`, `loading`, `disabled`, `haptic`.
- `AnimatedPressable` — RN press interactions; animates only `transform: scale`.
- `Badge` — `variant` (`default`/`primary`/`success`/`warning`/`danger`), `size` (`sm`/`md`).
- `AppToast`, `CompactEmptyState`, `DateSectionHeader`, `Divider`, `ListRetryFooter`, `ListRow`, `SegmentedControl`, `Skeleton`, `StateCard`, `SwipeableTabBar`, `PendingBottomSheet`, charts.
- Form controls: `FormTextInput`, `FormPasswordInput`, `FormFieldShell` in `src/components/ui/form/`.

Removed and not to recreate: `Input`, `Textarea`, `Card`, `Container`, `ActionSheet`, `ConfirmSheet`, `CircleLoader`, `NativeText`.

## Contrast and accessibility

- Do not hardcode colors or append hex alpha suffixes (`foreground + "bf"`). Use `mutedForeground`, `textTertiary`, `scrim`, `mediaForeground`, or `scrimControl`.
- Keep touch targets at least 48pt (`min-h-12`) with `hitSlop` where the visual is smaller.
- Provide `accessibilityLabel`, role, and disabled/busy state on interactive controls.
- Check light and dark modes plus the green primary preference when adding a token.
