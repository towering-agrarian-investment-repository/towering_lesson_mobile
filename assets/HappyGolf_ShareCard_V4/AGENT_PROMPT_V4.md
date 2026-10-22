# HappyGolf Monthly Share Card — FINAL V4 (minimal footer landscape)

**Task:** In the existing Expo Router / React Native TypeScript project, implement the monthly share card based on the included `reference/SIMPLIFIED_VISUAL_DIRECTION.png` (and the previous approved UI for all unchanged details). **V4 supersedes V1, V2 and V3**, especially their `bottom_hills` and combined decoration overlays. Build an actual dynamic component, not a flat screenshot. Do not redesign other sections.

## THE ONE REQUIRED VISUAL CHANGE

The V3 bottom had **too many overlapping green hill layers and grass clusters**. V4 uses only **TWO** broad, smooth bottom hills, one in lighter green behind and one in medium green in front. Keep only two small grass tufts and a single partially visible golf ball in the lower-left. Leave plenty of clear white space around the footer name and logo. **Do not layer V3 and V4 hills, add a third or fourth hill, repeat grass elements, or use a bottom background photo.** The top-right red flag, sky and green flag hill stay as before; the logo stays untouched.

## Assets (CRITICAL — use only V4)

- `assets/decorations_minimal_v4.png` — **1122×1402 RGBA**, recommended SINGLE full-canvas transparent decoration layer. Contains top-right flag/clouds, green emphasis strokes, and the **minimal V4 bottom**. No logo, avatar, calendar, or words. Place exactly once behind all React Native content, scaled uniformly with the layout. DO NOT also draw the split V4 bottom on top.
- `assets/bottom_hills_minimal_v4.png` — **1122×230 RGBA** separate bottom-only decoration, placed at **x=0, y=1172** in the 1122×1402 design coordinate system, for when you compose decorations individually instead of using the combined file.
- `assets/bottom_hills_minimal_v4.svg` — **editable** original vector for the same two-hill scene. Expo can use via `react-native-svg` or pre-rendered PNG. No lettering, logo, avatar or footer content is embedded in these assets.
- `reference/SIMPLIFIED_VISUAL_DIRECTION.png` — visual direction of the simplified overall card. `reference/PREVIOUS_APPROVED.png` — original card for verifying everything else unchanged.
- `spec/layout_v4.json` — precise source-space coordinates and colors. Canvas source **1122×1402**, output target **1080×1350**.

**DO NOT use** `bottom_hills_v3.png`, `decorations_v3.png`, old SVGs from V1/V2, or any prior ZIP. Do not add the same decoration image twice. The original HappyGolf logo must be located in the EXISTING app assets, not copied from screenshots and not regenerated.

## UI layout and dimensions

Design in a coordinate space 1122×1402. Uniformly scale all x/y/width/height, font sizes, radii and spacing for native preview (scaling factor previewWidth/1122). Capture at 1080×1350 physical pixels. White edge-to-edge poster, no cyan frame, no big outside shadow. Preserve all component sizes and placements from `spec/layout_v4.json`:

- Date title near x79,y101. Huge green `8` above bold navy `reservations` near x78,y394; stat vertical divider x472,y323; yellow clock and `6.7h / ON COURSE` alongside.
- Flat, top-right red flag over its green fairway and blue cloud/sky artwork; no change to the original top illustration.
- Seven-column **wide** Monday-first month grid from x≈48 to x≈1060; weekday headings over columns. Tiles approx **133×98** source px with corner radius 15, x stride 146.6, y stride 107.5. Use exact widths/gaps from spec and reference, not square or circular dots.
- Saturdays: light blue `#E8F2FF` / text `#0866CD`; Sundays: light pink `#FDEAF0` / text `#FB426C`. Neutral tiles `#F0F2F5`. Booking green `#00B76A`, booking orange `#FFB20B`, selected text white. Selected state overrides weekend color.
- Footer hairline at x68,y1110, circular member avatar at x88,y1130 (126×126), username at x244,y1153, localized footer subtitle beneath. Unaltered **original HappyGolf logo** at x≈696,y1138 within ~324×104. Footer contents should render **above** the decoration layer.
- Bottom minimal hills SVG content starts below the footer near y≈1260. Its transparent image bounding box is at x0,y1172,w1122,h230; **only two hill layers**, two modest tufts and one partial golf ball. Never cover the footer logo or member name.

Use Inter Black/ExtraBold for Latin large headline, Inter for ordinary labels, and script-appropriate installed font families (Noto Sans Khmer, Noto Sans Japanese, Noto Sans SC/TC, Noto Sans Korean, Noto Sans Thai). Don't embed a font file in the output ZIP.

## Month/date behavior and localization

October 2026 sample: Oct 1 Thursday; green Oct 6 and 21; orange Oct 13 and 28; `8 reservations`, `6.7h`, sample member `Alexis DE`. Oct 2 is plain Friday, Oct 3 is blue Saturday, Oct 4 is pink Sunday. The count of reservations is distinct from number of highlighted dates. Use real app data at runtime, not the sample.

For any month, generate dates programmatically from `(new Date(Date.UTC(year, monthIndex, 1)).getUTCDay()+6)%7` Monday-first offset. All days must be unique/correct, include empty leading/trailing placeholders and handle 6-week months. Use branch timezone for reservation day grouping.

Reuse existing app locale/i18n and TanStack Query v5; cover `en`, `km`, `zh-Hans`, `zh-Hant`, `ja`, `ko`, `th`, `vi`, `fr`, `es`, `id`. Translate month name, weekday labels, reservation label, time label, footer subtitle. Handle CJK/Khmer font rendering (no excessive Latin spacing, allow flexible widths); keep HappyGolf branding exactly unchanged.

## Code and delivery

Implement typed monthly share card + actual PNG capture via `react-native-view-shot`, mobile sharing via `expo-sharing` where applicable. Use only project dependencies unless necessary; prefer `npx expo install`. Wait for fonts/avatar to load before capture, don't include share button or OS status bar in PNG. Use the real current-user avatar. Integrate into existing Expo screen; do not build a second app.

Render screenshot and visually compare against `reference/SIMPLIFIED_VISUAL_DIRECTION.png` (for the simplified hills) and `reference/PREVIOUS_APPROVED.png` (for everything else). Ensure no more than TWO landscape hill layers, no old PNG reused, original logo correct, calendar weekday alignment correct, no footer overlap, no off-canvas clipping. Test selected `km`, `ja`, `zh-Hans`, long username, a 6-week month; follow the app's lightweight/risk-based testing practice. Report what is implemented and any unavoidable deviations; never claim 100% verified if no screenshot was taken.
