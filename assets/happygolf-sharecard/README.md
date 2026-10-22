# HappyGolf share card — non-logo illustration asset pack

This pack reconstructs the **decorative assets** from the user's screenshot as editable SVGs and 3× PNGs. It also contains a detailed agent prompt for implementing the dynamic card in Expo.

## Important
- **The original HappyGolf logo is deliberately NOT included as a reusable asset.** The app must reference the existing original logo directly, unmodified.
- The `reference/visual_mock_with_original_logo.png` is a reference-only preview that reuses pixels from the uploaded screenshot, not a newly generated standalone logo. Do not use it as the share-card background.
- The avatar crop is for comparison only; production must display actual member profile avatar.
- SVG shapes are **hand-reconstructed approximations** of a small raster screenshot, not vector exports of the original design file. Typography and avatar cannot be reconstructed perfectly from the source, but the source screenshot is included for visual comparison.

## Files

- `AGENT_PROMPT.md` — paste this into your coding agent with the assets in the repo. Exact element positions and Expo/l10n implementation guidance.
- `assets/svg/` — 8 editable SVG files.
- `assets/png/` — equivalent PNGs at 1× and 3× (`@3x`) resolution for Expo automatic resolution selection.
- `spec/measurements.json` — machine-readable original 511×637 coordinates, colors, grid and demo data.
- `spec/translations.sample.json` — English, Khmer, Chinese SC/TC, Japanese, Korean, Thai, Vietnamese, French, Spanish and Indonesian starter copy; review terminology before production.
- `reference/user_reference.png` — user's source screenshot (with logo).
- `reference/rendered_preview_no_logo.png` — dynamic English mock, logo deliberately left as placeholder.
- `reference/visual_mock_with_original_logo.png` — comparison-only mock with logo pixels copied from screenshot.
- `reference/avatar_sample_reference_only.png` — sample avatar from screenshot (not production avatar).
- `generate_assets.py` — source used to reconstruct/export the illustrations. Requires Pillow, CairoSVG and Inter installed to build English mock previews. SVG files can be edited independently of this script.

## Placement choice for Expo
Use `all_decorations.png` once at 511×637 reference-coordinates stretched to the output canvas and render all text/calendar/profile/logo natively above it. Separately display `clock_badge.png` at x244 y149 w50 h50. **Do not overlay both full `all_decorations` and all component art files at once.**

Visual QA: compare the app-generated PNG to `reference/user_reference.png` at the same resolution, correcting font metrics/letter spacing with platform screenshots. The supplied SVG artwork is not the source design's proprietary SVG code, so 100% identity cannot be guaranteed.
