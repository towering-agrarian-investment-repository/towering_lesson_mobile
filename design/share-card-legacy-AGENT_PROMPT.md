# Codex / AI coding agent task — Recreate the HappyGolf monthly social share card in Expo

**Implement this task directly in the existing Expo Router + React Native + TypeScript repository.** Use the supplied reference image (`reference/user_reference.png`), the measured layout (`spec/measurements.json`), and the generated non-logo assets in `assets/`. The goal is to reproduce the image **as closely as technically possible in the English reference**, while supporting translated text and all months. The original screenshot is only 511 × 637 pixels and has no editable design file; do not claim mathematically 100% pixel-identical text rasterization across devices. Perform visual comparisons and iterate.

## 1. Non-negotiable constraints

1. Recreate the **same exact composition**: cyan framing, white rounded card, golf-course flag and clouds on the upper right, green 8 with rays on the left, a reservation label below, vertical divider, 6.7h plus clock on the right, seven-column calendar of genuine square day cells, divider, avatar/name footer, the **existing original** HappyGolf logo at bottom right, and restrained waves/ball/sprigs at the bottom.
2. Do not create, regenerate, retype, trace, recolor, distort, or embed the HappyGolf logo. **Find and reuse the project's existing transparent original logo asset.** The provided art bundle deliberately excludes it. Keep it bottom right. Do not move it to the header. If an original transparent logo cannot be found, tell the developer which asset is missing; never synthesize an approximation.
3. Do not add "5 active days", new headings, extra stats, gradients, glass cards, photographs, shadows, confetti not present in assets, or a different visual hierarchy. No unrelated redesign.
4. Use React Native components for **dynamic text, calendar cells, user photo, logo, and interactive Share/Save buttons**; the decorative artwork may come from the supplied SVGs/PNGs. **Never export the original reference screenshot as the final generated card**: real data and translations must render natively.
5. Only the generated card is captured; do not capture the status bar, device frame, navigation bar, background screen, share button, or save button.
6. Use TanStack Query v5 or the repository's existing API/data layer if present. Reuse existing server state, session, member profile and reservation data. Do not add manual `useEffect` fetches or duplicate Query data in Zustand. Avoid changing the existing app architecture.

## 2. Included assets and intended usage

Under `assets/svg/` there are **editable SVG sources**; matching 1× and 3× (`@3x`) exports are under `assets/png/` for direct `Image` use in Expo:

| Asset | Screenshot coordinate x,y (pixels) | Screenshot width×height | What it draws |
|---|---:|---:|---|
| `frame_background` | 0,0 | 511×637 | Solid cyan outer color and white rounded frame (x19 y23 w475 h591 r21) |
| `sky_clouds` | 258,23 | 236×137 | Top-right wavy light-cyan sky and subtle cloud silhouettes |
| `flag_hills` | 355,75 | 139×169 | Green hills, dark pole, coral flag, and green radiating strokes |
| `bottom_hills` | 0,539 | 511×98 | Layered green bottom waves, leaves and shrubs |
| `golf_ball` | 0,563 | 58×74 | Partial white dimpled golf ball in lower-left corner |
| `sparkles` | 0,0 | 511×637 | Green rays around the 8, yellow left sparks, green side sparks |
| `clock_badge` | 244,149 | 50×50 | Pale yellow circle and navy clock glyph |
| `all_decorations` | 0,0 | 511×637 | Preferred single combined **background-only** graphic, containing ALL of the above except the clock badge, without text, calendar, avatar or logo |

**Preferred approach:** one `<Image source={require('.../all_decorations.png')}/>` placed at x0/y0 and stretched to the card's exact 511:637 aspect ratio; draw native dynamic components above it and use `clock_badge.png` separately. If using `all_decorations`, **do not overlay the individual decorative PNGs again**. For future design edits, prefer the source SVGs and rasterize them after editing. If Metro is already configured for SVG imports, native SVG rendering is acceptable; otherwise use the provided PNGs rather than spending time altering Metro configuration.

`reference/avatar_sample_reference_only.png` is a low-resolution crop to help compare the example. In production use the **member's actual profile photo**, not this sample hardcoded. `reference/visual_mock_with_original_logo.png` is only a visual inspection mock, not an app asset; the logo in that mock is pasted from the user's reference photo and was not recreated here.

## 3. Reference coordinate system, export and responsive scaling

- Source design viewBox: **511 × 637** logical design pixels, no safe-area padding inside the captured card.
- Output: **1080 × 1350 PNG** (~4:5), suitable for common social platforms; the tiny ratio difference between 511:637 and 4:5 is under 0.3%. Render with `scaleX = outputWidth / 511` and `scaleY = outputHeight / 637`. For on-device previews, use `targetWidth = min(availableWidth, preferredWidth)` and `targetHeight = targetWidth * 637 / 511`; use the same coordinates multiplied by `targetWidth / 511`. Do **not** independently resize dynamic elements with arbitrary percentages or `Dimensions.get('screen')`.
- All numbers in the tables here and in `spec/measurements.json` refer to the **511 × 637** reference. In React Native these should be multiplied by the same canvas scale before setting `left`, `top`, `width`, `height`, font size, radius, gap and line height.
- Use `position:'absolute'` only **inside this isolated visual share card**, not throughout the surrounding screens. Buttons and modals live outside the capture view.
- Use a single design canvas so it looks the same on different phone widths and is not affected by safe-area insets or dynamic navigation headers.
- For large output, either render at the correct pixel density or use `captureRef` with explicitly validated `width` and `height`; after export, programmatically verify that the resulting file is actually 1080 × 1350 physical pixels. Device-independent pixels and physical pixels are not the same. Avoid trusting platform defaults blindly.
- Background must **not** be a captured screenshot of the app or the reference photo. Use the decorative assets provided here.

## 4. Exact structure and component measurements

### A. White frame, illustration background

| Element | X | Y | Width | Height | Detail |
|---|---:|---:|---:|---:|---|
| Outer cyan canvas | 0 | 0 | 511 | 637 | `#5FDCFC`; no padding |
| Inner white rounded card | 19 | 23 | 475 | 591 | `#FEFEFE`, radius **21** |
| Upper sky scene | 258 | 23 | 236 | 137 | packaged artwork, behind dynamic labels |
| Golf scene and flag | 355 | 75 | 139 | 169 | packaged artwork |
| Bottom layered waves | 0 | 539 | 511 | 98 | packaged artwork; includes edge decoration |
| Decorative golf ball | 0 | 563 | 58 | 74 | clipped naturally by canvas bounds |
| Colored spark marks | 0 | 0 | 511 | 637 | packaged transparent full-size layer |
| Clock icon badge | 244 | 149 | 50 | 50 | packaged asset |

Draw illustrations **underneath** native calendar, footer and metrics; no clipping of the SVG at the logo area. Treat sky/green contours as fixed decoration, not hit targets.

### B. Header and key metrics

| Component | Left | Top | Box W | Box H | Text / style |
|---|---:|---:|---:|---:|---|
| Month and year | 52 | 46 | 215 | 23 | uppercase EN `OCTOBER 2026`, Inter Display Bold 15px, line height 19, tracking ~3.6px, color `#485C7F` |
| Big reservation number | 66 | ~73 **visible glyph** | 112 | 113 | `8`, Inter Display Black ~132px, line height ~127, `#00B66E`; tune the native Text top because font metric and glyph top differ, ensuring green glyph bottom is above the word below |
| Reservations word | 42 | 176 | 185 | 33 | `reservations`, Inter Display Black 25px, line height 29, `#061630`; left-aligned |
| Vertical divider | 227 | 119 | 1.5 | 93 | `#E2EAF0` |
| Clock circle | 244 | 149 | 50 | 50 | use asset; never emoji |
| Time value | 303 | 153 | 84 | 38 | `6.7h`, Inter Display ExtraBold 32px, line height 37, `#061630` |
| Time label | 303 | 187 | 84 | 16 | `ON COURSE`, Inter Display Bold 9px, line height 13, tracking ~0.55, `#485C7F` |

The clock and the time metric are **one horizontal unit** to the right of a single divider. There is **no active-days stat**. Never push the time/value outside x=400 or across the golf flag. In English preserve 6.7h above its label; in long localized text, auto-fit the label and value in the same region, preserving the illustration with no overlaps.

### C. Calendar — **actual square cells**

- Weekday label row: top **228**, height **16**; seven equally spaced text centers at x: **96.5, 149.2, 201.8, 254.4, 307.0, 359.6, 412.2**, font 9.5, Inter Bold, ink `#485C7F`.
- Date grid starts at **x=74, y=250**; **7 columns**, **5 rows for October 2026**, **45 × 45** square cells, **corner radius 8**, horizontal gap **7.7**, vertical gap **4.5**. Column positions: `x=74 + col × 52.7`; row positions `y=250 + row × 49.5`.
- Empty square background: `#F1F3F5`. Regular numerals: 12.5px Medium `#485C7F`, centered. Highlighted numerals: 12.5px Bold white centered. Active-green: `#00B875`; active-orange: `#FFAA12`.
- Monday is first column, Sunday last column, matching the reference layout. Weekday labels are **localized**, but the calendar still begins on Monday to retain the visual layout.
- October 2026 begins on **Thursday**. The 5×7 cells MUST read:

```text
 Mon Tue Wed Thu Fri Sat Sun
  --  --  --   1   2   3   4
   5   6   7   8   9  10  11
  12  13  14  15  16  17  18
  19  20  21  22  23  24  25
  26  27  28  29  30  31  --
```

- Example highlighted days only: **2 green, 6 green, 13 orange, 21 green, 28 orange**. These color meanings are **NOT specified by the reference**; read existing business logic to determine which reservation types/statuses correspond to green vs orange. Do not invent statuses or colors. All other dates are neutral. User data determines highlights and counts, not this hardcoded example.
- For months needing 6 weeks, keep the frame fixed: **38×38** square cells and ~5px vertical gap, preserving 7 same-width column slots. Calendar must still end before y=497. Do not ever make cells rectangular to fix overflow.
- The calendar summary is a month, **not a 12-month heatmap**; do not show other months.

### D. Footer

| Component | X | Y | W | H | Styling |
|---|---:|---:|---:|---:|---|
| Divider | 49 | 515 | 414 | 1 | `#E2EAF0` |
| Circular real avatar | 58 | 528 | 56 | 56 | round radius 28, `cover`; fallback placeholder if no photo |
| Member name | 124 | 538 | 192 | 27 | `Alexis DE` sample; dynamic backend name, Inter Display ExtraBold 20px, line height 25, `#061630`; shorten/ellipsize only if it truly exceeds bounded area |
| Under-name attribution | 124 | 566 | 170 | 15 | `ON HAPPY GOLF`, Inter Bold 9px, 12 line height, tracking ~2.4px, `#485C7F`; localized string has smaller/zero tracking for CJK/Khmer |
| **Existing actual HappyGolf logo** | 320 | 535 | 136 | 43 | existing app logo asset, `resizeMode:'contain'`, untouched original colors, positioned above waves, never redrawn |

Keep avatar/name left and HappyGolf logo right. Ensure the grass behind and beneath the footer is fully contained and doesn't cut off the logo or obscure the text.

### E. Colors and fonts

Read exact color values from `spec/measurements.json`. Dominant: outer cyan `#5FDCFC`, paper `#FEFEFE`, deep navy `#061630`, reservation green `#00B875`, orange `#FFAA12`, neutral day-cell `#F1F3F5`. Original artwork uses layered **solid fills**; avoid photography, glossy effect or shadows.

For EN/Latin use the project's closest existing Inter/Inter Display heavy weights; do not ship or fetch proprietary fonts without consent. Load necessary font families via the project's existing `expo-font` path. For Khmer use a font with **proper Khmer shaping** (e.g. Noto Sans Khmer); Chinese Simplified/Traditional use fonts supporting those glyphs (e.g. Noto Sans SC/TC); Japanese Noto Sans JP; Korean Noto Sans KR; Thai Noto Sans Thai. Use platform/system fallbacks if project fonts are unavailable. **Do not distribute bundled font files with these generated artwork assets.**

Set `includeFontPadding:false` for Android in reference-screen typography; adjust only after comparing iOS/Android screenshots. Do not attempt to simulate script fonts by translating glyphs character-by-character. Set correct locale-specific line heights for tall/stacked script clusters.

## 5. Localization and internationalization — required

Support at minimum these language tags: `en`, `km`, `zh-Hans`, `zh-Hant`, `ja`, `ko`, `th`, `vi`, `fr`, `es`, `id`. The translated starter keys are in `spec/translations.sample.json`, but treat them as translation candidates requiring native-language QA, especially golf terminology. Reuse the repo's established i18n library if it has one; otherwise use `expo-localization` and an existing supported translation library (`i18next`/`react-i18next` or `i18n-js`) as appropriate. Do not create two parallel translation systems.

Localize **all** text that should translate: month and year, `reservations`, `ON COURSE`, `ON HAPPY GOLF`, weekday abbreviations and hour units; keep the proper name `HappyGolf` and user's actual name unchanged. For months, weekdays and numbers use `Intl.DateTimeFormat` and `Intl.NumberFormat` rather than English arrays or substring hacks.

Implementation rules:

- Use Gregorian dates for the share-card (2026 means 2026 across languages), unless the business explicitly requires a different calendar. A safe month formatter is `new Intl.DateTimeFormat(locale, { month:'long', year:'numeric', calendar:'gregory', timeZone:'UTC' })` on a UTC date; fall back gracefully if a platform lacks some options.
- Format `reservationCount` with `Intl.NumberFormat(locale)`; format `6.7` with one decimal digit and localized decimal separator. The unit can remain `h` only in locales where appropriate. Example Khmer may display Khmer digits with `ម៉ោង`, Japanese `時間`, Chinese `小时` or `小時`. If long, show localized number on the top line and localized unit/description underneath; never overlap the green flag or divider.
- Generate month cells from a UTC date calculation independent of the phone's timezone. With JS `Date.UTC(year, monthIndex, 1)`, the offset for Monday-first columns is `(getUTCDay() + 6) % 7`. For weekday translations, format known UTC Monday–Sunday anchor dates with `Intl.DateTimeFormat(locale,{ weekday:'short', timeZone:'UTC' })`, optionally use `narrow` for CJK or constrained widths; confirm output with native-language QA.
- **Do not force uppercase or letter spacing on Khmer, Chinese or Japanese text.** Uppercase/tracking is only for Latin script. Khmer must render intact, not as spaced disconnected glyphs. Avoid truncation of translated `reservations` at all costs: reduce up to a safe minimum (e.g. 16px) or wrap within its box without covering the calendar.
- Keep all text within its measured container and test 11 languages on both Android and iOS. For unusual long localizations allow targeted box-layout adjustments while protecting the brand layout and square calendar cells.
- Use the locale selected by the **app** if there is one, rather than always taking the device language. Fallback to device locale, and then `en`.
- User name may contain Khmer, Chinese, Japanese, emoji; prevent overflow with `numberOfLines={1}` + controlled scaling or ellipsis at the end. Avatar must stay circular and image-loaded before capture.
- Bonus if already supported by app: RTL languages should use natural text direction without mirroring the illustration/calendar's fixed seven columns or distorting the logo; not required to add RTL support from scratch.

## 6. Dynamic data contract and color status

Suggested component props (adapt to existing domain model and repositories):

```ts
type MonthlyGolfShareCardProps = {
  year: number;
  monthIndex: number; // 0..11
  reservationCount: number;
  hoursOnCourse: number; // 6.7 sample
  days: Array<{ date: string; color: 'green' | 'orange' | 'none' }>;
  displayName: string;
  avatarUri?: string;
  locale: string;
};
```

Prefer getting this data from an existing React Query hook. For booking status colors use existing domain rules. The month belongs to a specified **branch timezone** when grouping reservations (don't let UTC conversion shift a reservation from one local calendar day to another); the UTC date algorithm is only for **rendering the calendar grid**. Avoid recomputing hours from `end - start` if cancellations, check-ins or domain aggregation rules alter business totals; consume trusted summary fields where possible. Never include private identifiers, email, phone, access token or other personal fields in the shared card.

## 7. Expo implementation and sharing

Use a component tree equivalent to:

```tsx
<View ref={cardRef} collapsable={false} style={{ width: cardW, height: cardH, position: 'relative' }}>
  <Image source={require('./assets/png/all_decorations.png')}
    style={{ position:'absolute', left:0, top:0, width:cardW, height:cardH }} resizeMode="stretch" />
  {/* Dynamically drawn month, 8, reservations, divider, clock icon, hours */}
  {/* Day of week labels and actual square 7-column month grid */}
  {/* Footer separator, profile image, member name, translated attribution */}
  {/* Original logo from THIS APP at x320 y535 w136 h43 */}
</View>
```

Use a local `baseW=511`, `baseH=637` and a `pos(x,y,w,h)` helper that scales by current cardW/cardH. `fontSize`, border radius and spacing also scale with card width; vertical values scale with card height. `screen preview` can be ~360 × 449 dp; `capture result` must be 1080 × 1350 pixels. The user should see the card in a share preview, then use `react-native-view-shot` (`captureRef`) and `expo-sharing` to share the rendered PNG. Provide Save to Photos via `expo-media-library` only if that functionality is already desired in this flow. Install dependencies with `npx expo install react-native-view-shot expo-sharing expo-localization` (and whichever localization/font libs are actually missing) rather than incompatible arbitrary versions.

Before calling `captureRef`, ensure fonts are loaded (`useFonts` or project's font loader), artwork is ready, the avatar has fired `onLoad`, and the card is mounted/layout-complete. Use try/catch with sensible user feedback. Use `Sharing.isAvailableAsync()` where relevant. Only show Share/Save actions **outside** the capture ref. Use the platform share sheet, not arbitrary navigation to provider URLs.

## 8. Validation criteria (targeted tests, not excessive full suites)

1. Compare an iOS **and** Android English screenshot to `reference/user_reference.png` side by side. The output must have the same positioning, overall proportions, illustrations and color hierarchy. **DO NOT** claim pixel-perfect success without performing that visual comparison.
2. The square day cells must stay exactly 1:1, radius 8 reference units, at all render sizes. First day of October 2026 is Thursday; October 2 is Friday, October 31 is Saturday. Never render impossible dates, duplicates or Oct 3 twice.
3. No "5 active days" metric. Reservation count and time must remain cleanly combined at top. HappyGolf logo must be the project original and at **bottom right** only.
4. Test five-row October and a six-week month, a month with zero reservations, a three-digit count (e.g. 125; apply size reduction rather than overflow), a long name and slow avatar loading.
5. Test the actual translation/render of `km`, `zh-Hans`, `zh-Hant`, `ja`, `ko`, `th` and `en`; include representative screenshots. Check Khmer combining marks aren't cut, text doesn't overlap, digits use locale rules and the card remains shareable.
6. Export a physical **1080 × 1350 PNG**, inspect actual dimensions and check transparency/color correctness. The logo isn't clipped by hills; the flag remains inside top right; no status bar or controls are captured.
7. Only run **targeted** tests for the date-grid and localization logic and visual QA for the share view. Don't run the entire app E2E suite merely for a UI composition edit; reserve full checks for the existing release process.

## 9. Expected final deliverables in the app repo

- Typed `MonthlyGolfShareCard` component and share preview integration using existing data/hooks.
- Localized strings / formatting and font fallbacks where needed.
- Original HappyGolf logo referenced from existing repo, unchanged.
- Generated decorative assets organized under the app's assets directory.
- Screenshot(s) showing EN and Khmer/Japanese/Chinese render, including a **1080×1350** captured sample.
- Concise change summary and what could not be made exact from the raster reference.

**Start by inspecting existing share card code, locale setup and logo path, then implement; do not ask me to re-describe the design or create a fresh design from scratch.**
